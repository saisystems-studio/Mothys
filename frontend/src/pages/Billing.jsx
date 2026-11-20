import { useMemo, useState } from 'react'
import { Calendar, Clock, Download, Printer } from 'lucide-react'
import PdfActionsModal from '../components/PdfActionsModal'
import TableState from '../components/TableState'
import useAsyncData from '../hooks/useAsyncData'
import useToast from '../hooks/useToast'
import useNow from '../hooks/useNow'
import { getProducts } from '../services/productsService'
import { getUnits } from '../services/unitsService'
import { getStock } from '../services/stockService'
import { createBilling } from '../services/vouchersService'
import { getErrorMessage } from '../services/api'
import { formatDate, formatQty, formatQtyWithUnit, formatTime, formatVoucher } from '../utils/format'
import { buildVoucherPdf, getPaperSize } from '../utils/voucherPdf'
import { downloadCsv, todayStamp } from '../utils/pdfActions'

const load = () => Promise.all([getProducts(), getUnits(), getStock()])

const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals, any unit

// One stock line = one product in one unit. Units are never converted.
const rowKey = (productId, unitId) => `${productId}:${unitId}`

/*
 * BILLING page.
 *  - The list is the stock balance (same numbers as the Stock page).
 *  - "Bill Quantity" is editable (default = everything available).
 *    Any unit allows up to 3 decimals.
 *  - Tick the entries to bill, then "Submit Billing" creates the voucher.
 *  - Print makes the voucher PDF (A4 / A5).
 * Stock is added on the separate Entry page.
 */
export default function Billing() {
  const toast = useToast()
  const now = useNow()

  const { data, loading, error, reload } = useAsyncData(load)
  const [products, units, stock] = data ?? [[], [], []]
  const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])
  const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

  // Stock balance rows: one per product + unit that still has stock.
  const rows = useMemo(
    () =>
      stock
        .filter((s) => Number(s.remaining_stock) > 0 && productById[s.product_id]?.is_active !== false)
        .map((s) => {
          const unitId = s.unit_id ?? productById[s.product_id]?.unit_id
          const unit = unitName[unitId] ?? ''
          return {
            key: rowKey(s.product_id, unitId),
            productId: s.product_id,
            unitId,
            name: s.product_name ?? productById[s.product_id]?.product_name ?? `#${s.product_id}`,
            unit,
            available: Number(s.remaining_stock),
          }
        }),
    [stock, productById, unitName],
  )

  // Per-row edits: { [rowKey]: { quantity?, selected? } }
  const [edits, setEdits] = useState({})
  const patchEdit = (key, patch) =>
    setEdits((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))

  const entries = rows.map((r) => {
    const e = edits[r.key] ?? {}
    return { ...r, quantity: e.quantity ?? String(r.available), selected: Boolean(e.selected) }
  })

  const [submitting, setSubmitting] = useState(false)
  const [lastVoucher, setLastVoucher] = useState('')
  const [lastBill, setLastBill] = useState(null) // last submitted voucher, used by Print
  const [billError, setBillError] = useState('')
  const [paper] = useState(getPaperSize) // paper size is no longer chosen on this page
  const [printBill, setPrintBill] = useState(null) // bill waiting in the print popup


  const qtyValid = (e) => {
    const q = String(e.quantity).trim()
    return QTY_RE.test(q) && Number(q) > 0
  }
  const qtyWithinStock = (e) => Number(e.quantity) <= e.available
  const selected = entries.filter((e) => e.selected)
  const totalQuantity = selected.reduce((sum, e) => sum + (qtyValid(e) ? Number(e.quantity) : 0), 0)
  const allSelected = entries.length > 0 && selected.length === entries.length

  // Untick = quantity goes back to the full available amount.
  const toggleRow = (key, checked) =>
    patchEdit(key, checked ? { selected: true } : { selected: false, quantity: undefined })

  const toggleAll = (checked) =>
    setEdits((prev) => {
      const next = { ...prev }
      rows.forEach((r) => {
        next[r.key] = checked
          ? { ...next[r.key], selected: true }
          : { ...next[r.key], selected: false, quantity: undefined }
      })
      return next
    })

  const validateSelected = () => {
    if (selected.length === 0) {
      toast.error('Select at least one entry.')
      return false
    }
    const invalid = selected.find((e) => !qtyValid(e))
    if (invalid) {
      toast.error(`${invalid.name}: enter a quantity greater than 0 (up to 3 decimals).`)
      return false
    }
    const over = selected.find((e) => !qtyWithinStock(e))
    if (over) {
      toast.error(`${over.name}: you can bill at most ${formatQtyWithUnit(over.available, over.unit)}.`)
      return false
    }
    return true
  }

  const handleSubmitBilling = async () => {
    if (submitting || !validateSelected()) return
    const billedKeys = selected.map((e) => e.key)
    const billedItems = selected.map((e) => ({
      name: e.name,
      quantity: Number(e.quantity),
      unit: e.unit,
    }))

    setSubmitting(true)
    setBillError('')
    try {
      const voucher = await createBilling(
        selected.map((e) => ({
          product_id: e.productId,
          unit_id: e.unitId,
          quantity: Number(e.quantity),
        })),
      )
      const label = formatVoucher(voucher.voucher_number)
      setLastVoucher(label)
      setLastBill({
        voucherNumber: voucher.voucher_number,
        date: voucher.voucher_date ?? new Date(),
        items: billedItems,
      })
      // Reset the billed rows; whatever is left in stock shows again, unticked.
      setEdits((prev) => {
        const next = { ...prev }
        billedKeys.forEach((key) => delete next[key])
        return next
      })
      toast.success(`Billing submitted. Voucher ${label} created.`)
      reload()
    } catch (err) {
      const message = getErrorMessage(err)
      setBillError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const toPrintItems = (list) =>
    list.map((e) => ({ name: e.name, quantity: Number(e.quantity), unit: e.unit }))

  // Which bill to print: ticked entries -> last submitted voucher -> every entry in the list.
  // Entries printed before billing are a draft: they have no voucher ID yet.
  const resolveBill = () => {
    if (selected.length > 0) {
      if (!validateSelected()) return null
      return { voucherNumber: null, date: new Date(), items: toPrintItems(selected) }
    }
    if (lastBill) return lastBill
    if (entries.length > 0) {
      if (entries.some((e) => !qtyValid(e) || !qtyWithinStock(e))) {
        toast.error('Check the bill quantities before printing.')
        return null
      }
      return { voucherNumber: null, date: new Date(), items: toPrintItems(entries) }
    }
    return null
  }

  // The printer icon opens a small menu: Print / Download / Share.
  const openPrintMenu = () => {
    const bill = resolveBill()
    if (bill) setPrintBill(bill)
  }

  // Export the Available Stock list (with the bill quantities and ticks) as CSV.
  const exportCsv = () => {
    if (entries.length === 0) {
      toast.error('There is nothing to export.')
      return
    }

    downloadCsv(`mothys-billing-${todayStamp()}.csv`, [
      ['S.No', 'Product', 'Unit', 'Available Quantity', 'Bill Quantity', 'Selected'],
      ...entries.map((en, i) => [
        i + 1,
        en.name,
        en.unit,
        en.available,
        en.quantity,
        en.selected ? 'Yes' : 'No',
      ]),
    ])
  }

  // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
  const buildPdf = () => buildVoucherPdf({ ...printBill, paper })

  return (
    <>
      <style>{`
        .qty-input.qty-locked {
          opacity: .55;
          background: #f1f5f9;
        }

        .qty-input.qty-locked input {
          cursor: not-allowed;
        }

      `}</style>

      <div className="page-head">
        <h1>Billing</h1>
        <div className="page-head-tools">
          <span className="chip">
            <Calendar size={16} />
            {formatDate(now)}
          </span>
          <span className="chip">
            <Clock size={16} />
            {formatTime(now)}
          </span>
        </div>
      </div>

      <div className="stack">
        <div className="table-card">
          <div className="report-head">
            <span>Available Stock</span>
          </div>
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>S.No</th>
                  <th>Product</th>
                  <th>Available</th>
                  <th>Bill Quantity</th>
                  <th className="chk">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Select all entries"
                      disabled={entries.length === 0}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((en, i) => {
                  const bad = !qtyValid(en) || !qtyWithinStock(en)
                  return (
                    <tr key={en.key} className={en.selected ? 'row-selected' : ''}>
                      <td>{i + 1}</td>
                      <td>{en.name}</td>
                      <td>{formatQtyWithUnit(en.available, en.unit)}</td>
                      <td>
                        <label
                          className={`qty-input ${en.selected ? '' : 'qty-locked'}`}
                          style={en.selected && bad ? { borderColor: 'var(--red)' } : undefined}
                          title={en.selected ? undefined : 'Tick the entry to edit the quantity'}
                        >
                          <input
                            inputMode="decimal"
                            value={en.quantity}
                            onChange={(e) => patchEdit(en.key, { quantity: e.target.value })}
                            aria-label="Bill quantity"
                            disabled={!en.selected}
                          />
                          <span>{en.unit}</span>
                        </label>
                      </td>
                      <td className="chk">
                        <input
                          type="checkbox"
                          checked={en.selected}
                          onChange={(e) => toggleRow(en.key, e.target.checked)}
                          aria-label="Select entry"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <TableState
            loading={loading && entries.length === 0}
            error={error}
            empty={!loading && !error && entries.length === 0}
            emptyText="No stock available. Add stock on the Entry page first."
            onRetry={reload}
          />
        </div>

        {billError && <div className="form-error">{billError}</div>}

        <div className="bill-bar">
          <span className="pill pill-amber">Selected Entries: {selected.length}</span>
          <span className="pill pill-green">Total Quantity: {formatQty(totalQuantity)}</span>

          <button
            type="button"
            className="btn btn-outline"
            onClick={exportCsv}
            disabled={entries.length === 0}
            title="Download the stock list as CSV"
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={openPrintMenu}
            disabled={selected.length === 0 && !lastBill && entries.length === 0}
            aria-label="Print"
            title={
              selected.length > 0
                ? 'Print / share the selected entries'
                : lastBill
                  ? `Print / share voucher ${lastVoucher}`
                  : 'Print / share all entries in the list'
            }
          >
            <Printer size={18} />
          </button>

          <div className="bill-note">
            Voucher ID is generated on Submit Billing
            {lastVoucher && <strong>Last: {lastVoucher}</strong>}
          </div>
          <button
            type="button"
            className="btn btn-success"
            disabled={submitting || selected.length === 0}
            onClick={handleSubmitBilling}
          >
            {submitting && <span className="spinner" />}
            Submit Billing
          </button>
        </div>
      </div>

      {printBill && (
        <PdfActionsModal title="Print voucher" build={buildPdf} onClose={() => setPrintBill(null)} />
      )}
    </>
  )
}
        