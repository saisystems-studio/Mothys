import { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock } from 'lucide-react'
import TableState from '../components/TableState'
import useAsyncData from '../hooks/useAsyncData'
import useToast from '../hooks/useToast'
import { getProducts } from '../services/productsService'
import { getUnits } from '../services/unitsService'
import { getStock, createStockEntry } from '../services/stockService'
import { createBilling } from '../services/vouchersService'
import { getErrorMessage } from '../services/api'
import { formatDate, formatQty, formatQtyWithUnit, formatTime, formatVoucher } from '../utils/format'

const load = () => Promise.all([getProducts(), getUnits(), getStock()])
const QTY_RE = /^\d+(\.\d{1,3})?$/

/*
 * The list on this page IS the stock balance (same numbers as the Stock page).
 *  - "Add to List" posts a stock IN, then the balance below updates.
 *  - "Bill Quantity" is editable (default = everything available). Billing a
 *    smaller quantity bills only that much; the rest stays in stock and stays
 *    in this list, so it can be edited and billed any time.
 * Only the editable bill quantity and the tick box are kept in the page state.
 */

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function EntryBilling() {
  const toast = useToast()
  const now = useNow()

  const { data, loading, error, reload } = useAsyncData(load)
  const [products, units, stock] = data ?? [[], [], []]
  const activeProducts = products.filter((p) => p.is_active)
  const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])
  const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

  // Stock balance rows: active products that still have stock.
  const rows = useMemo(
    () =>
      stock
        .filter((s) => Number(s.remaining_stock) > 0 && productById[s.product_id]?.is_active !== false)
        .map((s) => ({
          productId: s.product_id,
          name: s.product_name ?? productById[s.product_id]?.product_name ?? `#${s.product_id}`,
          unit: unitName[s.unit_id ?? productById[s.product_id]?.unit_id] ?? '',
          available: Number(s.remaining_stock),
        })),
    [stock, productById, unitName],
  )

  // Per-product edits: { [productId]: { quantity?, selected? } }
  const [edits, setEdits] = useState({})
  const patchEdit = (productId, patch) =>
    setEdits((prev) => ({ ...prev, [productId]: { ...prev[productId], ...patch } }))

  const entries = rows.map((r) => {
    const e = edits[r.productId] ?? {}
    return { ...r, quantity: e.quantity ?? String(r.available), selected: Boolean(e.selected) }
  })

  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastVoucher, setLastVoucher] = useState('')
  const [billError, setBillError] = useState('')

  const qtyValid = (e) => QTY_RE.test(String(e.quantity).trim()) && Number(e.quantity) > 0
  const qtyWithinStock = (e) => Number(e.quantity) <= e.available
  const selected = entries.filter((e) => e.selected)
  const totalQuantity = selected.reduce((sum, e) => sum + (qtyValid(e) ? Number(e.quantity) : 0), 0)
  const allSelected = entries.length > 0 && selected.length === entries.length
  const currentUnit = productId ? unitName[productById[productId]?.unit_id] : ''

  // Add to list: the quantity is posted to stock (IN), then the balance below refreshes.
  const handleAdd = async (e) => {
    e.preventDefault()
    if (adding) return
    if (!productId) return setAddError('Select a product.')
    if (!QTY_RE.test(quantity.trim()) || Number(quantity) <= 0)
      return setAddError('Enter a quantity greater than 0 (up to 3 decimals).')
    setAddError('')

    const pid = Number(productId)
    setAdding(true)
    try {
      await createStockEntry(pid, Number(quantity.trim()))
      // Tick the product and let its bill quantity follow the new balance.
      setEdits((prev) => ({ ...prev, [pid]: { selected: true } }))
      setQuantity('')
      toast.success('Stock updated.')
      reload()
    } catch (err) {
      const message = getErrorMessage(err)
      setAddError(message)
      toast.error(message)
    } finally {
      setAdding(false)
    }
  }

  const toggleAll = (checked) =>
    setEdits((prev) => {
      const next = { ...prev }
      rows.forEach((r) => {
        next[r.productId] = { ...next[r.productId], selected: checked }
      })
      return next
    })

  const validateSelected = () => {
    if (selected.length === 0) {
      toast.error('Select at least one entry.')
      return false
    }
    if (selected.some((e) => !qtyValid(e))) {
      toast.error('Every selected entry needs a quantity greater than 0.')
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
    const billedIds = selected.map((e) => e.productId)
    setSubmitting(true)
    setBillError('')
    try {
      const voucher = await createBilling(
        selected.map((e) => ({ product_id: e.productId, quantity: Number(e.quantity) })),
      )
      const label = formatVoucher(voucher.voucher_number)
      setLastVoucher(label)
      // Reset the billed rows; whatever is left in stock shows again, unticked.
      setEdits((prev) => {
        const next = { ...prev }
        billedIds.forEach((id) => delete next[id])
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

  return (
    <>
      <div className="page-head">
        <h1>Entry &amp; Billing</h1>
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
        <form className="card" onSubmit={handleAdd} noValidate>
          <h2 className="card-title">Add Product Entry</h2>
          <div className="entry-add">
            <div className="field">
              <label htmlFor="eb-product">
                Product <span className="req">*</span>
              </label>
              <select
                id="eb-product"
                className="select"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={loading || adding}
              >
                <option value="">{loading ? 'Loading products…' : 'Select product'}</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.product_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="eb-qty">
                Quantity <span className="req">*</span>
              </label>
              <div className="input-wrap">
                <input
                  id="eb-qty"
                  inputMode="decimal"
                  className="input"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={adding}
                />
                {currentUnit && <span className="input-suffix">{currentUnit}</span>}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || adding}>
              {adding && <span className="spinner" />}
              Add to List
            </button>
          </div>
          {addError && <p className="field-error" style={{ marginTop: 8 }}>{addError}</p>}
        </form>

        <div className="table-card">
          <div className="report-head">
            <span>Available Stock</span>
            {/* <span className="saved-note">Same balance as the Stock page</span> */}
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
                    <tr key={en.productId} className={en.selected ? 'row-selected' : ''}>
                      <td>{i + 1}</td>
                      <td>{en.name}</td>
                      <td>{formatQtyWithUnit(en.available, en.unit)}</td>
                      <td>
                        <label className="qty-input" style={bad ? { borderColor: 'var(--red)' } : undefined}>
                          <input
                            inputMode="decimal"
                            value={en.quantity}
                            onChange={(e) => patchEdit(en.productId, { quantity: e.target.value })}
                            aria-label="Bill quantity"
                          />
                          <span>{en.unit}</span>
                        </label>
                      </td>
                      <td className="chk">
                        <input
                          type="checkbox"
                          checked={en.selected}
                          onChange={(e) => patchEdit(en.productId, { selected: e.target.checked })}
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
            emptyText="No stock available. Choose a product and quantity above, then click “Add to List”."
            onRetry={reload}
          />
        </div>

        {billError && <div className="form-error">{billError}</div>}

        <div className="bill-bar">
          <span className="pill pill-amber">Selected Entries: {selected.length}</span>
          <span className="pill pill-green">Total Quantity: {formatQty(totalQuantity)}</span>
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
    </>
  )
}
