// import { useMemo, useState } from 'react'
// import { Calendar, Clock, Download, Printer } from 'lucide-react'
// import PdfActionsModal from '../components/PdfActionsModal'
// import TableState from '../components/TableState'
// import useAsyncData from '../hooks/useAsyncData'
// import useToast from '../hooks/useToast'
// import useNow from '../hooks/useNow'
// import { getProducts } from '../services/productsService'
// import { getUnits } from '../services/unitsService'
// import { getStock } from '../services/stockService'
// import { createBilling } from '../services/vouchersService'
// import { getErrorMessage } from '../services/api'
// import { formatDate, formatQty, formatQtyWithUnit, formatTime, formatVoucher } from '../utils/format'
// import { buildVoucherPdf, getPaperSize } from '../utils/voucherPdf'
// import { downloadCsv, todayStamp } from '../utils/pdfActions'

// const load = () => Promise.all([getProducts(), getUnits(), getStock()])

// const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals, any unit

// // One stock line = one product in one unit. Units are never converted.
// const rowKey = (productId, unitId) => `${productId}:${unitId}`

// /*
//  * BILLING page.
//  *  - The list is the stock balance (same numbers as the Stock page).
//  *  - "Bill Quantity" is editable (default = everything available).
//  *    Any unit allows up to 3 decimals.
//  *  - Tick the entries to bill, then "Submit Billing" creates the voucher.
//  *  - Print makes the voucher PDF (A4 / A5).
//  * Stock is added on the separate Entry page.
//  */
// export default function Billing() {
//   const toast = useToast()
//   const now = useNow()

//   const { data, loading, error, reload } = useAsyncData(load)
//   const [products, units, stock] = data ?? [[], [], []]
//   const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])
//   const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

//   // Stock balance rows: one per product + unit that still has stock.
//   const rows = useMemo(
//     () =>
//       stock
//         .filter((s) => Number(s.remaining_stock) > 0 && productById[s.product_id]?.is_active !== false)
//         .map((s) => {
//           const unitId = s.unit_id ?? productById[s.product_id]?.unit_id
//           const unit = unitName[unitId] ?? ''
//           return {
//             key: rowKey(s.product_id, unitId),
//             productId: s.product_id,
//             unitId,
//             name: s.product_name ?? productById[s.product_id]?.product_name ?? `#${s.product_id}`,
//             unit,
//             available: Number(s.remaining_stock),
//           }
//         }),
//     [stock, productById, unitName],
//   )

//   // Per-row edits: { [rowKey]: { quantity?, selected? } }
//   const [edits, setEdits] = useState({})
//   const patchEdit = (key, patch) =>
//     setEdits((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))

//   const entries = rows.map((r) => {
//     const e = edits[r.key] ?? {}
//     return { ...r, quantity: e.quantity ?? String(r.available), selected: Boolean(e.selected) }
//   })

//   const [submitting, setSubmitting] = useState(false)
//   const [lastVoucher, setLastVoucher] = useState('')
//   const [lastBill, setLastBill] = useState(null) // last submitted voucher, used by Print
//   const [billError, setBillError] = useState('')
//   const [paper] = useState(getPaperSize) // paper size is no longer chosen on this page
//   const [printBill, setPrintBill] = useState(null) // bill waiting in the print popup


//   const qtyValid = (e) => {
//     const q = String(e.quantity).trim()
//     return QTY_RE.test(q) && Number(q) > 0
//   }
//   const qtyWithinStock = (e) => Number(e.quantity) <= e.available
//   const selected = entries.filter((e) => e.selected)
//   const totalQuantity = selected.reduce((sum, e) => sum + (qtyValid(e) ? Number(e.quantity) : 0), 0)
//   const allSelected = entries.length > 0 && selected.length === entries.length

//   // Untick = quantity goes back to the full available amount.
//   const toggleRow = (key, checked) =>
//     patchEdit(key, checked ? { selected: true } : { selected: false, quantity: undefined })

//   const toggleAll = (checked) =>
//     setEdits((prev) => {
//       const next = { ...prev }
//       rows.forEach((r) => {
//         next[r.key] = checked
//           ? { ...next[r.key], selected: true }
//           : { ...next[r.key], selected: false, quantity: undefined }
//       })
//       return next
//     })

//   const validateSelected = () => {
//     if (selected.length === 0) {
//       toast.error('Select at least one entry.')
//       return false
//     }
//     const invalid = selected.find((e) => !qtyValid(e))
//     if (invalid) {
//       toast.error(`${invalid.name}: enter a quantity greater than 0 (up to 3 decimals).`)
//       return false
//     }
//     const over = selected.find((e) => !qtyWithinStock(e))
//     if (over) {
//       toast.error(`${over.name}: you can bill at most ${formatQtyWithUnit(over.available, over.unit)}.`)
//       return false
//     }
//     return true
//   }

//   const handleSubmitBilling = async () => {
//     if (submitting || !validateSelected()) return
//     const billedKeys = selected.map((e) => e.key)
//     const billedItems = selected.map((e) => ({
//       name: e.name,
//       quantity: Number(e.quantity),
//       unit: e.unit,
//     }))

//     setSubmitting(true)
//     setBillError('')
//     try {
//       const voucher = await createBilling(
//         selected.map((e) => ({
//           product_id: e.productId,
//           unit_id: e.unitId,
//           quantity: Number(e.quantity),
//         })),
//       )
//       const label = formatVoucher(voucher.voucher_number)
//       setLastVoucher(label)
//       setLastBill({
//         voucherNumber: voucher.voucher_number,
//         date: voucher.voucher_date ?? new Date(),
//         items: billedItems,
//       })
//       // Reset the billed rows; whatever is left in stock shows again, unticked.
//       setEdits((prev) => {
//         const next = { ...prev }
//         billedKeys.forEach((key) => delete next[key])
//         return next
//       })
//       toast.success(`Billing submitted. Voucher ${label} created.`)
//       reload()
//     } catch (err) {
//       const message = getErrorMessage(err)
//       setBillError(message)
//       toast.error(message)
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const toPrintItems = (list) =>
//     list.map((e) => ({ name: e.name, quantity: Number(e.quantity), unit: e.unit }))

//   // Which bill to print: ticked entries -> last submitted voucher -> every entry in the list.
//   // Entries printed before billing are a draft: they have no voucher ID yet.
//   const resolveBill = () => {
//     if (selected.length > 0) {
//       if (!validateSelected()) return null
//       return { voucherNumber: null, date: new Date(), items: toPrintItems(selected) }
//     }
//     if (lastBill) return lastBill
//     if (entries.length > 0) {
//       if (entries.some((e) => !qtyValid(e) || !qtyWithinStock(e))) {
//         toast.error('Check the bill quantities before printing.')
//         return null
//       }
//       return { voucherNumber: null, date: new Date(), items: toPrintItems(entries) }
//     }
//     return null
//   }

//   // The printer icon opens a small menu: Print / Download / Share.
//   const openPrintMenu = () => {
//     const bill = resolveBill()
//     if (bill) setPrintBill(bill)
//   }

//   // Export the Available Stock list (with the bill quantities and ticks) as CSV.
//   const exportCsv = () => {
//     if (entries.length === 0) {
//       toast.error('There is nothing to export.')
//       return
//     }

//     downloadCsv(`mothys-billing-${todayStamp()}.csv`, [
//       ['S.No', 'Product', 'Unit', 'Available Quantity', 'Bill Quantity', 'Selected'],
//       ...entries.map((en, i) => [
//         i + 1,
//         en.name,
//         en.unit,
//         en.available,
//         en.quantity,
//         en.selected ? 'Yes' : 'No',
//       ]),
//     ])
//   }

//   // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
//   const buildPdf = () => buildVoucherPdf({ ...printBill, paper })

//   return (
//     <>
//       <style>{`
//         .qty-input.qty-locked {
//           opacity: .55;
//           background: #f1f5f9;
//         }

//         .qty-input.qty-locked input {
//           cursor: not-allowed;
//         }

//       `}</style>

//       <div className="page-head">
//         <h1>Billing</h1>
//         <div className="page-head-tools">
//           <span className="chip">
//             <Calendar size={16} />
//             {formatDate(now)}
//           </span>
//           <span className="chip">
//             <Clock size={16} />
//             {formatTime(now)}
//           </span>
//         </div>
//       </div>

//       <div className="stack">
//         <div className="table-card">
//           <div className="report-head">
//             <span>Available Stock</span>
//           </div>
//           <div className="table-scroll">
//             <table className="data">
//               <thead>
//                 <tr>
//                   <th style={{ width: 90 }}>S.No</th>
//                   <th>Product</th>
//                   <th>Available</th>
//                   <th>Bill Quantity</th>
//                   <th className="chk">
//                     <input
//                       type="checkbox"
//                       checked={allSelected}
//                       onChange={(e) => toggleAll(e.target.checked)}
//                       aria-label="Select all entries"
//                       disabled={entries.length === 0}
//                     />
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {entries.map((en, i) => {
//                   const bad = !qtyValid(en) || !qtyWithinStock(en)
//                   return (
//                     <tr key={en.key} className={en.selected ? 'row-selected' : ''}>
//                       <td>{i + 1}</td>
//                       <td>{en.name}</td>
//                       <td>{formatQtyWithUnit(en.available, en.unit)}</td>
//                       <td>
//                         <label
//                           className={`qty-input ${en.selected ? '' : 'qty-locked'}`}
//                           style={en.selected && bad ? { borderColor: 'var(--red)' } : undefined}
//                           title={en.selected ? undefined : 'Tick the entry to edit the quantity'}
//                         >
//                           <input
//                             inputMode="decimal"
//                             value={en.quantity}
//                             onChange={(e) => patchEdit(en.key, { quantity: e.target.value })}
//                             aria-label="Bill quantity"
//                             disabled={!en.selected}
//                           />
//                           <span>{en.unit}</span>
//                         </label>
//                       </td>
//                       <td className="chk">
//                         <input
//                           type="checkbox"
//                           checked={en.selected}
//                           onChange={(e) => toggleRow(en.key, e.target.checked)}
//                           aria-label="Select entry"
//                         />
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>
//           <TableState
//             loading={loading && entries.length === 0}
//             error={error}
//             empty={!loading && !error && entries.length === 0}
//             emptyText="No stock available. Add stock on the Entry page first."
//             onRetry={reload}
//           />
//         </div>

//         {billError && <div className="form-error">{billError}</div>}

//         <div className="bill-bar">
//           <span className="pill pill-amber">Selected Entries: {selected.length}</span>
//           <span className="pill pill-green">Total Quantity: {formatQty(totalQuantity)}</span>

//           <button
//             type="button"
//             className="btn btn-outline"
//             onClick={exportCsv}
//             disabled={entries.length === 0}
//             title="Download the stock list as CSV"
//           >
//             <Download size={16} />
//             Export CSV
//           </button>

//           <button
//             type="button"
//             className="btn btn-outline"
//             onClick={openPrintMenu}
//             disabled={selected.length === 0 && !lastBill && entries.length === 0}
//             aria-label="Print"
//             title={
//               selected.length > 0
//                 ? 'Print / share the selected entries'
//                 : lastBill
//                   ? `Print / share voucher ${lastVoucher}`
//                   : 'Print / share all entries in the list'
//             }
//           >
//             <Printer size={18} />
//           </button>

//           <div className="bill-note">
//             Voucher ID is generated on Submit Billing
//             {lastVoucher && <strong>Last: {lastVoucher}</strong>}
//           </div>
//           <button
//             type="button"
//             className="btn btn-success"
//             disabled={submitting || selected.length === 0}
//             onClick={handleSubmitBilling}
//           >
//             {submitting && <span className="spinner" />}
//             Submit Billing
//           </button>
//         </div>
//       </div>

//       {printBill && (
//         <PdfActionsModal title="Print voucher" build={buildPdf} onClose={() => setPrintBill(null)} />
//       )}
//     </>
//   )
// }
        




// import { useMemo, useState } from 'react'
// import { Calendar, Clock, Download, Printer } from 'lucide-react'
// import PdfActionsModal from '../components/PdfActionsModal'
// import TableState from '../components/TableState'
// import useAsyncData from '../hooks/useAsyncData'
// import useToast from '../hooks/useToast'
// import useNow from '../hooks/useNow'
// import { getProducts } from '../services/productsService'
// import { getUnits } from '../services/unitsService'
// import { getStock } from '../services/stockService'
// import { createBilling } from '../services/vouchersService'
// import { getErrorMessage } from '../services/api'
// import { formatDate, formatQty, formatQtyWithUnit, formatTime, formatVoucher } from '../utils/format'
// import { buildVoucherPdf, getPaperSize } from '../utils/voucherPdf'
// import { downloadCsv, todayStamp } from '../utils/pdfActions'

// const load = () => Promise.all([getProducts(), getUnits(), getStock()])

// const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals, any unit

// // One stock line = one product in one unit. Units are never converted.
// const rowKey = (productId, unitId) => `${productId}:${unitId}`

// /*
//  * BILLING page.
//  *  - The list is the stock balance (same numbers as the Stock page).
//  *  - Same product = one table row. Its units are shown in "Available" separated by " / ",
//  *    and every unit has its own Bill Quantity box (side by side).
//  *  - "Bill Quantity" is editable (default = everything available) once its entry is ticked.
//  *    Any unit allows up to 3 decimals.
//  *  - Each unit has its own tick box, so one unit can be billed on its own.
//  *    The checkbox column ticks / unticks all units of that product at once.
//  *  - Tick the entries to bill, then "Submit Billing" creates the voucher.
//  *  - Print makes the voucher PDF (A4 / A5).
//  * Stock is added on the separate Entry page.
//  */
// export default function Billing() {
//   const toast = useToast()
//   const now = useNow()

//   const { data, loading, error, reload } = useAsyncData(load)
//   const [products, units, stock] = data ?? [[], [], []]
//   const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])
//   const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

//   // Stock balance rows: one per product + unit that still has stock.
//   const rows = useMemo(
//     () =>
//       stock
//         .filter((s) => Number(s.remaining_stock) > 0 && productById[s.product_id]?.is_active !== false)
//         .map((s) => {
//           const unitId = s.unit_id ?? productById[s.product_id]?.unit_id
//           const unit = unitName[unitId] ?? ''
//           return {
//             key: rowKey(s.product_id, unitId),
//             productId: s.product_id,
//             unitId,
//             name: s.product_name ?? productById[s.product_id]?.product_name ?? `#${s.product_id}`,
//             unit,
//             available: Number(s.remaining_stock),
//           }
//         }),
//     [stock, productById, unitName],
//   )

//   // Per-row edits: { [rowKey]: { quantity?, selected? } }
//   const [edits, setEdits] = useState({})
//   const patchEdit = (key, patch) =>
//     setEdits((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))

//   const entries = rows.map((r) => {
//     const e = edits[r.key] ?? {}
//     return { ...r, quantity: e.quantity ?? String(r.available), selected: Boolean(e.selected) }
//   })

//   // Same product (in different units) is shown as ONE table row.
//   const groups = []
//   const groupIndex = {}
//   entries.forEach((en) => {
//     if (!(en.productId in groupIndex)) {
//       groupIndex[en.productId] = groups.length
//       groups.push({ productId: en.productId, name: en.name, lines: [] })
//     }
//     groups[groupIndex[en.productId]].lines.push(en)
//   })

//   const [submitting, setSubmitting] = useState(false)
//   const [lastVoucher, setLastVoucher] = useState('')
//   const [lastBill, setLastBill] = useState(null) // last submitted voucher, used by Print
//   const [billError, setBillError] = useState('')
//   const [paper] = useState(getPaperSize) // paper size is no longer chosen on this page
//   const [printBill, setPrintBill] = useState(null) // bill waiting in the print popup


//   const qtyValid = (e) => {
//     const q = String(e.quantity).trim()
//     return QTY_RE.test(q) && Number(q) > 0
//   }
//   const qtyWithinStock = (e) => Number(e.quantity) <= e.available
//   const selected = entries.filter((e) => e.selected)
//   const totalQuantity = selected.reduce((sum, e) => sum + (qtyValid(e) ? Number(e.quantity) : 0), 0)
//   const allSelected = entries.length > 0 && selected.length === entries.length

//   // Untick = quantity goes back to the full available amount.
//   const toggleRow = (key, checked) =>
//     patchEdit(key, checked ? { selected: true } : { selected: false, quantity: undefined })

//   // Checkbox column: tick / untick every unit of one product.
//   const toggleGroup = (group, checked) =>
//     setEdits((prev) => {
//       const next = { ...prev }
//       group.lines.forEach((l) => {
//         next[l.key] = checked
//           ? { ...next[l.key], selected: true }
//           : { ...next[l.key], selected: false, quantity: undefined }
//       })
//       return next
//     })

//   const toggleAll = (checked) =>
//     setEdits((prev) => {
//       const next = { ...prev }
//       rows.forEach((r) => {
//         next[r.key] = checked
//           ? { ...next[r.key], selected: true }
//           : { ...next[r.key], selected: false, quantity: undefined }
//       })
//       return next
//     })

//   const validateSelected = () => {
//     if (selected.length === 0) {
//       toast.error('Select at least one entry.')
//       return false
//     }
//     const invalid = selected.find((e) => !qtyValid(e))
//     if (invalid) {
//       toast.error(`${invalid.name}: enter a quantity greater than 0 (up to 3 decimals).`)
//       return false
//     }
//     const over = selected.find((e) => !qtyWithinStock(e))
//     if (over) {
//       toast.error(`${over.name}: you can bill at most ${formatQtyWithUnit(over.available, over.unit)}.`)
//       return false
//     }
//     return true
//   }

//   const handleSubmitBilling = async () => {
//     if (submitting || !validateSelected()) return
//     const billedKeys = selected.map((e) => e.key)
//     const billedItems = selected.map((e) => ({
//       name: e.name,
//       quantity: Number(e.quantity),
//       unit: e.unit,
//     }))

//     setSubmitting(true)
//     setBillError('')
//     try {
//       const voucher = await createBilling(
//         selected.map((e) => ({
//           product_id: e.productId,
//           unit_id: e.unitId,
//           quantity: Number(e.quantity),
//         })),
//       )
//       const label = formatVoucher(voucher.voucher_number)
//       setLastVoucher(label)
//       setLastBill({
//         voucherNumber: voucher.voucher_number,
//         date: voucher.voucher_date ?? new Date(),
//         items: billedItems,
//       })
//       // Reset the billed rows; whatever is left in stock shows again, unticked.
//       setEdits((prev) => {
//         const next = { ...prev }
//         billedKeys.forEach((key) => delete next[key])
//         return next
//       })
//       toast.success(`Billing submitted. Voucher ${label} created.`)
//       reload()
//     } catch (err) {
//       const message = getErrorMessage(err)
//       setBillError(message)
//       toast.error(message)
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const toPrintItems = (list) =>
//     list.map((e) => ({ name: e.name, quantity: Number(e.quantity), unit: e.unit }))

//   // Which bill to print: ticked entries -> last submitted voucher -> every entry in the list.
//   // Entries printed before billing are a draft: they have no voucher ID yet.
//   const resolveBill = () => {
//     if (selected.length > 0) {
//       if (!validateSelected()) return null
//       return { voucherNumber: null, date: new Date(), items: toPrintItems(selected) }
//     }
//     if (lastBill) return lastBill
//     if (entries.length > 0) {
//       if (entries.some((e) => !qtyValid(e) || !qtyWithinStock(e))) {
//         toast.error('Check the bill quantities before printing.')
//         return null
//       }
//       return { voucherNumber: null, date: new Date(), items: toPrintItems(entries) }
//     }
//     return null
//   }

//   // The printer icon opens a small menu: Print / Download / Share.
//   const openPrintMenu = () => {
//     const bill = resolveBill()
//     if (bill) setPrintBill(bill)
//   }

//   // Export the Available Stock list (with the bill quantities and ticks) as CSV.
//   const exportCsv = () => {
//     if (entries.length === 0) {
//       toast.error('There is nothing to export.')
//       return
//     }

//     downloadCsv(`mothys-billing-${todayStamp()}.csv`, [
//       ['S.No', 'Product', 'Unit', 'Available Quantity', 'Bill Quantity', 'Selected'],
//       ...entries.map((en, i) => [
//         i + 1,
//         en.name,
//         en.unit,
//         en.available,
//         en.quantity,
//         en.selected ? 'Yes' : 'No',
//       ]),
//     ])
//   }

//   // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
//   const buildPdf = () => buildVoucherPdf({ ...printBill, paper })

//   return (
//     <>
//       <style>{`
//         .qty-input.qty-locked {
//           opacity: .55;
//           background: #f1f5f9;
//         }

//         .qty-input.qty-locked input {
//           cursor: not-allowed;
//         }

//         .qty-stack {
//           display: flex;
//           flex-direction: row;
//           flex-wrap: nowrap;
//           align-items: center;
//           gap: 10px;
//           padding: 2px 0;
//         }

//         .qty-item {
//           display: flex;
//           align-items: center;
//           gap: 4px;
//           flex: 0 0 auto;
//         }

//         .qty-stack .qty-input {
//           flex: 0 0 auto;
//           width: 104px;
//           min-width: 0;
//           height: 34px;
//           padding: 0 8px;
//           font-size: 13px;
//         }

//         .qty-stack .qty-input input {
//           width: 100%;
//           min-width: 0;
//           font-size: 13px;
//         }

//         .qty-stack .qty-input span {
//           font-size: 12px;
//           white-space: nowrap;
//         }

//       `}</style>

//       <div className="page-head">
//         <h1>Billing</h1>
//         <div className="page-head-tools">
//           <span className="chip">
//             <Calendar size={16} />
//             {formatDate(now)}
//           </span>
//           <span className="chip">
//             <Clock size={16} />
//             {formatTime(now)}
//           </span>
//         </div>
//       </div>

//       <div className="stack">
//         <div className="table-card">
//           <div className="report-head">
//             <span>Available Stock</span>
//           </div>
//           <div className="table-scroll">
//             <table className="data">
//               <thead>
//                 <tr>
//                   <th style={{ width: 60 }}>S.No</th>
//                   <th style={{ width: 140 }}>Product</th>
//                   <th>Available</th>
//                   <th className="chk" style={{ width: 48 }}>
//                     <input
//                       type="checkbox"
//                       checked={allSelected}
//                       onChange={(e) => toggleAll(e.target.checked)}
//                       aria-label="Select all entries"
//                       disabled={entries.length === 0}
//                     />
//                   </th>
//                   <th style={{ whiteSpace: 'nowrap' }}>Bill Quantity</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {groups.map((group, i) => {
//                   const groupSelected = group.lines.every((l) => l.selected)
//                   const groupAny = group.lines.some((l) => l.selected)
//                   return (
//                     <tr key={group.productId} className={groupAny ? 'row-selected' : ''}>
//                       <td>{i + 1}</td>
//                       <td style={{ overflowWrap: 'anywhere', minWidth: 140 }}>{group.name}</td>
//                       <td style={{ whiteSpace: 'nowrap' }}>
//                         {group.lines
//                           .map((l) => formatQtyWithUnit(l.available, l.unit))
//                           .join(' / ')}
//                       </td>
//                       <td className="chk">
//                         <input
//                           type="checkbox"
//                           checked={groupSelected}
//                           ref={(el) => {
//                             if (el) el.indeterminate = groupAny && !groupSelected
//                           }}
//                           onChange={(e) => toggleGroup(group, e.target.checked)}
//                           aria-label="Select all units of this product"
//                         />
//                       </td>
//                       <td style={{ whiteSpace: 'nowrap' }}>
//                         <div className="qty-stack">
//                           {group.lines.map((en) => {
//                             const bad = !qtyValid(en) || !qtyWithinStock(en)
//                             return (
//                               <div className="qty-item" key={en.key}>
//                                 <label
//                                   className={`qty-input ${en.selected ? '' : 'qty-locked'}`}
//                                   style={en.selected && bad ? { borderColor: 'var(--red)' } : undefined}
//                                   title={en.selected ? undefined : 'Tick the entry to edit the quantity'}
//                                 >
//                                   <input
//                                     inputMode="decimal"
//                                     value={en.quantity}
//                                     onChange={(e) => patchEdit(en.key, { quantity: e.target.value })}
//                                     aria-label={`Bill quantity (${en.unit})`}
//                                     disabled={!en.selected}
//                                   />
//                                   <span>{en.unit}</span>
//                                 </label>
//                               </div>
//                             )
//                           })}
//                         </div>
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>
//           <TableState
//             loading={loading && entries.length === 0}
//             error={error}
//             empty={!loading && !error && entries.length === 0}
//             emptyText="No stock available. Add stock on the Entry page first."
//             onRetry={reload}
//           />
//         </div>

//         {billError && <div className="form-error">{billError}</div>}

//         <div className="bill-bar">
//           <span className="pill pill-amber">Selected Entries: {selected.length}</span>
//           <span className="pill pill-green">Total Quantity: {formatQty(totalQuantity)}</span>

//           <button
//             type="button"
//             className="btn btn-outline"
//             onClick={exportCsv}
//             disabled={entries.length === 0}
//             title="Download the stock list as CSV"
//           >
//             <Download size={16} />
//             Export CSV
//           </button>

//           <button
//             type="button"
//             className="btn btn-outline"
//             onClick={openPrintMenu}
//             disabled={selected.length === 0 && !lastBill && entries.length === 0}
//             aria-label="Print"
//             title={
//               selected.length > 0
//                 ? 'Print / share the selected entries'
//                 : lastBill
//                   ? `Print / share voucher ${lastVoucher}`
//                   : 'Print / share all entries in the list'
//             }
//           >
//             <Printer size={18} />
//           </button>

//           <div className="bill-note">
//             Voucher ID is generated on Submit Billing
//             {lastVoucher && <strong>Last: {lastVoucher}</strong>}
//           </div>
//           <button
//             type="button"
//             className="btn btn-success"
//             disabled={submitting || selected.length === 0}
//             onClick={handleSubmitBilling}
//           >
//             {submitting && <span className="spinner" />}
//             Submit Billing
//           </button>
//         </div>
//       </div>

//       {printBill && (
//         <PdfActionsModal title="Print voucher" build={buildPdf} onClose={() => setPrintBill(null)} />
//       )}
//     </>
//   )
// }






// import { useEffect, useMemo, useState } from 'react'
// import { Calendar, CheckCircle2, Clock, Download, Printer, Receipt, X } from 'lucide-react'
// import PdfActionsModal from '../components/PdfActionsModal'
// import TableState from '../components/TableState'
// import useAsyncData from '../hooks/useAsyncData'
// import useToast from '../hooks/useToast'
// import useNow from '../hooks/useNow'
// import { getProducts } from '../services/productsService'
// import { getUnits } from '../services/unitsService'
// import { getStock } from '../services/stockService'
// import { createBilling } from '../services/vouchersService'
// import { getErrorMessage } from '../services/api'
// import { formatDate, formatQty, formatQtyWithUnit, formatTime, formatVoucher } from '../utils/format'
// import { buildVoucherPdf, getPaperSize } from '../utils/voucherPdf'
// import { downloadCsv, todayStamp } from '../utils/pdfActions'

// const load = () => Promise.all([getProducts(), getUnits(), getStock()])

// const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals, any unit

// // One stock line = one product in one unit. Units are never converted.
// const rowKey = (productId, unitId) => `${productId}:${unitId}`

// /* ------------------------------------------------------------------ */
// /* Popup shown right after "Submit Billing" succeeds.                  */
// /* Shows the created voucher number + a Print button (same print      */
// /* popup as the Reports voucher card: Print / Download / Share).       */
// /* bill: { voucherNumber, date, items: [{ name, quantity, unit }] }    */
// /* ------------------------------------------------------------------ */
// function VoucherCreatedModal({ bill, paper, onClose }) {
//   const [printOpen, setPrintOpen] = useState(false)

//   // While the print popup is open it handles Esc / outside clicks itself.
//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === 'Escape' && !printOpen) onClose()
//     }
//     window.addEventListener('keydown', onKey)
//     return () => window.removeEventListener('keydown', onKey)
//   }, [onClose, printOpen])

//   // Called once when the print popup opens.
//   const buildPdf = () =>
//     buildVoucherPdf({
//       voucherNumber: bill.voucherNumber,
//       date: bill.date,
//       items: bill.items,
//       paper,
//     })

//   return (
//     <div
//       className="vm-backdrop"
//       onMouseDown={(e) => {
//         if (e.target === e.currentTarget && !printOpen) onClose()
//       }}
//     >
//       <div className="vm-card" role="dialog" aria-modal="true" aria-label="Voucher created">
//         <div className="vm-head">
//           <div className="vm-title">
//             <div className="vm-icon vm-icon-success">
//               <CheckCircle2 size={22} />
//             </div>
//             <div>
//               <h3>Voucher {formatVoucher(bill.voucherNumber)} created</h3>
//               <p>Billing submitted successfully</p>
//             </div>
//           </div>

//           <button type="button" className="vm-close" onClick={onClose} aria-label="Close">
//             <X size={18} />
//           </button>
//         </div>

//         <div className="vm-body">
//           <div className="vm-meta">
//             <div>
//               <span className="vm-label">Voucher ID</span>
//               <div className="vm-value">{formatVoucher(bill.voucherNumber)}</div>
//             </div>
//             <div>
//               <span className="vm-label">Date</span>
//               <div className="vm-value">{formatDate(bill.date)}</div>
//             </div>
//           </div>

//           <div className="vm-lines">
//             <div className="vm-line vm-line-head">
//               <span>Product</span>
//               <span style={{ textAlign: 'right' }}>Billed Quantity</span>
//             </div>

//             {bill.items.map((it, i) => (
//               <div className="vm-line" key={`${it.name}-${it.unit}-${i}`}>
//                 <b>{it.name}</b>
//                 <span style={{ textAlign: 'right', fontWeight: 700 }}>
//                   {formatQtyWithUnit(it.quantity, it.unit)}
//                 </span>
//               </div>
//             ))}

//             <div className="vm-line vm-line-total">
//               <b>Total Items</b>
//               <span style={{ textAlign: 'right', fontWeight: 750 }}>{bill.items.length}</span>
//             </div>
//           </div>
//         </div>

//         <div className="vm-foot">
//           <div className="vm-print">
//             <button
//               type="button"
//               className="vm-btn"
//               onClick={() => setPrintOpen(true)}
//               aria-label="Print voucher"
//               title="Print / download / share voucher"
//             >
//               <Printer size={17} />
//               Print
//             </button>
//           </div>

//           <button type="button" className="vm-btn primary" onClick={onClose}>
//             Close
//           </button>
//         </div>
//       </div>

//       {printOpen && (
//         <PdfActionsModal
//           title={`Print voucher ${formatVoucher(bill.voucherNumber)}`}
//           build={buildPdf}
//           onClose={() => setPrintOpen(false)}
//         />
//       )}
//     </div>
//   )
// }

// /*
//  * BILLING page.
//  *  - The list is the stock balance (same numbers as the Stock page).
//  *  - Same product = one table row. Its units are shown in "Available" separated by " / ",
//  *    and every unit has its own Bill Quantity box (side by side).
//  *  - "Bill Quantity" is editable (default = everything available) once its entry is ticked.
//  *    Any unit allows up to 3 decimals.
//  *  - Each unit has its own tick box, so one unit can be billed on its own.
//  *    The checkbox column ticks / unticks all units of that product at once.
//  *  - Tick the entries to bill, then "Submit Billing" creates the voucher and opens a
//  *    popup with the created voucher number and a Print button.
//  *  - Print makes the voucher PDF (A4 / A5).
//  * Stock is added on the separate Entry page.
//  */
// export default function Billing() {
//   const toast = useToast()
//   const now = useNow()

//   const { data, loading, error, reload } = useAsyncData(load)
//   const [products, units, stock] = data ?? [[], [], []]
//   const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])
//   const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products])

//   // Stock balance rows: one per product + unit that still has stock.
//   const rows = useMemo(
//     () =>
//       stock
//         .filter((s) => Number(s.remaining_stock) > 0 && productById[s.product_id]?.is_active !== false)
//         .map((s) => {
//           const unitId = s.unit_id ?? productById[s.product_id]?.unit_id
//           const unit = unitName[unitId] ?? ''
//           return {
//             key: rowKey(s.product_id, unitId),
//             productId: s.product_id,
//             unitId,
//             name: s.product_name ?? productById[s.product_id]?.product_name ?? `#${s.product_id}`,
//             unit,
//             available: Number(s.remaining_stock),
//           }
//         }),
//     [stock, productById, unitName],
//   )

//   // Per-row edits: { [rowKey]: { quantity?, selected? } }
//   const [edits, setEdits] = useState({})
//   const patchEdit = (key, patch) =>
//     setEdits((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))

//   const entries = rows.map((r) => {
//     const e = edits[r.key] ?? {}
//     return { ...r, quantity: e.quantity ?? String(r.available), selected: Boolean(e.selected) }
//   })

//   // Same product (in different units) is shown as ONE table row.
//   const groups = []
//   const groupIndex = {}
//   entries.forEach((en) => {
//     if (!(en.productId in groupIndex)) {
//       groupIndex[en.productId] = groups.length
//       groups.push({ productId: en.productId, name: en.name, lines: [] })
//     }
//     groups[groupIndex[en.productId]].lines.push(en)
//   })

//   const [submitting, setSubmitting] = useState(false)
//   const [lastVoucher, setLastVoucher] = useState('')
//   const [lastBill, setLastBill] = useState(null) // last submitted voucher, used by Print
//   const [billError, setBillError] = useState('')
//   const [paper] = useState(getPaperSize) // paper size is no longer chosen on this page
//   const [printBill, setPrintBill] = useState(null) // bill waiting in the print popup
//   const [createdBill, setCreatedBill] = useState(null) // popup shown after Submit Billing

//   const qtyValid = (e) => {
//     const q = String(e.quantity).trim()
//     return QTY_RE.test(q) && Number(q) > 0
//   }
//   const qtyWithinStock = (e) => Number(e.quantity) <= e.available
//   const selected = entries.filter((e) => e.selected)
//   const totalQuantity = selected.reduce((sum, e) => sum + (qtyValid(e) ? Number(e.quantity) : 0), 0)
//   const allSelected = entries.length > 0 && selected.length === entries.length

//   // Untick = quantity goes back to the full available amount.
//   const toggleRow = (key, checked) =>
//     patchEdit(key, checked ? { selected: true } : { selected: false, quantity: undefined })

//   // Checkbox column: tick / untick every unit of one product.
//   const toggleGroup = (group, checked) =>
//     setEdits((prev) => {
//       const next = { ...prev }
//       group.lines.forEach((l) => {
//         next[l.key] = checked
//           ? { ...next[l.key], selected: true }
//           : { ...next[l.key], selected: false, quantity: undefined }
//       })
//       return next
//     })

//   const toggleAll = (checked) =>
//     setEdits((prev) => {
//       const next = { ...prev }
//       rows.forEach((r) => {
//         next[r.key] = checked
//           ? { ...next[r.key], selected: true }
//           : { ...next[r.key], selected: false, quantity: undefined }
//       })
//       return next
//     })

//   const validateSelected = () => {
//     if (selected.length === 0) {
//       toast.error('Select at least one entry.')
//       return false
//     }
//     const invalid = selected.find((e) => !qtyValid(e))
//     if (invalid) {
//       toast.error(`${invalid.name}: enter a quantity greater than 0 (up to 3 decimals).`)
//       return false
//     }
//     const over = selected.find((e) => !qtyWithinStock(e))
//     if (over) {
//       toast.error(`${over.name}: you can bill at most ${formatQtyWithUnit(over.available, over.unit)}.`)
//       return false
//     }
//     return true
//   }

//   const handleSubmitBilling = async () => {
//     if (submitting || !validateSelected()) return
//     const billedKeys = selected.map((e) => e.key)
//     const billedItems = selected.map((e) => ({
//       name: e.name,
//       quantity: Number(e.quantity),
//       unit: e.unit,
//     }))

//     setSubmitting(true)
//     setBillError('')
//     try {
//       const voucher = await createBilling(
//         selected.map((e) => ({
//           product_id: e.productId,
//           unit_id: e.unitId,
//           quantity: Number(e.quantity),
//         })),
//       )
//       const label = formatVoucher(voucher.voucher_number)
//       const bill = {
//         voucherNumber: voucher.voucher_number,
//         date: voucher.voucher_date ?? new Date(),
//         items: billedItems,
//       }
//       setLastVoucher(label)
//       setLastBill(bill)
//       setCreatedBill(bill) // open the "voucher created" popup with the Print button
//       // Reset the billed rows; whatever is left in stock shows again, unticked.
//       setEdits((prev) => {
//         const next = { ...prev }
//         billedKeys.forEach((key) => delete next[key])
//         return next
//       })
//       toast.success(`Billing submitted. Voucher ${label} created.`)
//       reload()
//     } catch (err) {
//       const message = getErrorMessage(err)
//       setBillError(message)
//       toast.error(message)
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const toPrintItems = (list) =>
//     list.map((e) => ({ name: e.name, quantity: Number(e.quantity), unit: e.unit }))

//   // Which bill to print: ticked entries -> last submitted voucher -> every entry in the list.
//   // Entries printed before billing are a draft: they have no voucher ID yet.
//   const resolveBill = () => {
//     if (selected.length > 0) {
//       if (!validateSelected()) return null
//       return { voucherNumber: null, date: new Date(), items: toPrintItems(selected) }
//     }
//     if (lastBill) return lastBill
//     if (entries.length > 0) {
//       if (entries.some((e) => !qtyValid(e) || !qtyWithinStock(e))) {
//         toast.error('Check the bill quantities before printing.')
//         return null
//       }
//       return { voucherNumber: null, date: new Date(), items: toPrintItems(entries) }
//     }
//     return null
//   }

//   // The printer icon opens a small menu: Print / Download / Share.
//   const openPrintMenu = () => {
//     const bill = resolveBill()
//     if (bill) setPrintBill(bill)
//   }

//   // Export the Available Stock list (with the bill quantities and ticks) as CSV.
//   const exportCsv = () => {
//     if (entries.length === 0) {
//       toast.error('There is nothing to export.')
//       return
//     }

//     downloadCsv(`mothys-billing-${todayStamp()}.csv`, [
//       ['S.No', 'Product', 'Unit', 'Available Quantity', 'Bill Quantity', 'Selected'],
//       ...entries.map((en, i) => [
//         i + 1,
//         en.name,
//         en.unit,
//         en.available,
//         en.quantity,
//         en.selected ? 'Yes' : 'No',
//       ]),
//     ])
//   }

//   // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
//   const buildPdf = () => buildVoucherPdf({ ...printBill, paper })

//   return (
//     <>
//       <style>{`
//         .qty-input.qty-locked {
//           opacity: .55;
//           background: #f1f5f9;
//         }

//         .qty-input.qty-locked input {
//           cursor: not-allowed;
//         }

//         .qty-stack {
//           display: flex;
//           flex-direction: row;
//           flex-wrap: nowrap;
//           align-items: center;
//           gap: 10px;
//           padding: 2px 0;
//         }

//         .qty-item {
//           display: flex;
//           align-items: center;
//           gap: 4px;
//           flex: 0 0 auto;
//         }

//         .qty-stack .qty-input {
//           flex: 0 0 auto;
//           width: 104px;
//           min-width: 0;
//           height: 34px;
//           padding: 0 8px;
//           font-size: 13px;
//         }

//         .qty-stack .qty-input input {
//           width: 100%;
//           min-width: 0;
//           font-size: 13px;
//         }

//         .qty-stack .qty-input span {
//           font-size: 12px;
//           white-space: nowrap;
//         }

//         /* ---------- Voucher created popup (same look as the Reports voucher card) ---------- */
//         .vm-backdrop {
//           position: fixed;
//           inset: 0;
//           z-index: 1000;
//           display: grid;
//           place-items: center;
//           padding: 16px;
//           background: rgba(15, 23, 42, .45);
//           animation: vmFade .15s ease;
//         }

//         @keyframes vmFade {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }

//         .vm-card {
//           width: 100%;
//           max-width: 560px;
//           max-height: 90vh;
//           display: flex;
//           flex-direction: column;
//           background: #fff;
//           border-radius: 16px;
//           overflow: hidden;
//           box-shadow: 0 20px 50px rgba(15, 23, 42, .25);
//         }

//         .vm-head {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           padding: 18px 22px;
//           border-bottom: 1px solid #e5eaf1;
//         }

//         .vm-title {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           min-width: 0;
//         }

//         .vm-icon {
//           flex: 0 0 42px;
//           width: 42px;
//           height: 42px;
//           display: grid;
//           place-items: center;
//           border-radius: 11px;
//           background: #edf2ff;
//           color: #2861e9;
//         }

//         .vm-icon-success {
//           background: #e7f7ee;
//           color: #0caa58;
//         }

//         .vm-title h3 {
//           margin: 0;
//           font-size: 16px;
//           font-weight: 750;
//           color: #1b2947;
//         }

//         .vm-title p {
//           margin: 4px 0 0;
//           font-size: 12px;
//           color: #71809a;
//         }

//         .vm-close {
//           width: 34px;
//           height: 34px;
//           display: grid;
//           place-items: center;
//           border: 0;
//           border-radius: 9px;
//           background: #f1f5fa;
//           color: #52627e;
//           cursor: pointer;
//         }

//         .vm-close:hover {
//           background: #e5edfa;
//           color: #2458db;
//         }

//         .vm-body {
//           padding: 20px 22px;
//           overflow-y: auto;
//         }

//         .vm-label {
//           display: block;
//           margin-bottom: 8px;
//           font-size: 12px;
//           font-weight: 700;
//           color: #52627e;
//         }

//         .vm-meta {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 16px;
//           margin-bottom: 20px;
//         }

//         .vm-value {
//           font-size: 14px;
//           font-weight: 700;
//           color: #1b2947;
//         }

//         .vm-lines {
//           border: 1px solid #e5eaf1;
//           border-radius: 12px;
//           overflow: hidden;
//         }

//         .vm-line {
//           display: grid;
//           grid-template-columns: 1fr 150px;
//           align-items: center;
//           gap: 12px;
//           padding: 12px 16px;
//           border-top: 1px solid #edf0f5;
//           font-size: 13px;
//           color: #293955;
//         }

//         .vm-line:first-child {
//           border-top: 0;
//         }

//         .vm-line-head {
//           background: #f7f9fc;
//           color: #65748e;
//           font-size: 10px;
//           font-weight: 750;
//           letter-spacing: .55px;
//           text-transform: uppercase;
//         }

//         .vm-line-total {
//           background: #f7f9fc;
//         }

//         .vm-line b {
//           font-weight: 700;
//           color: #1d2c49;
//         }

//         .vm-foot {
//           display: flex;
//           flex-wrap: wrap;
//           justify-content: flex-end;
//           align-items: center;
//           gap: 10px;
//           padding: 14px 22px;
//           border-top: 1px solid #e5eaf1;
//         }

//         .vm-print {
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           margin-right: auto;
//         }

//         .vm-btn {
//           min-height: 40px;
//           padding: 0 18px;
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           border: 1px solid #dce3ed;
//           border-radius: 9px;
//           background: #fff;
//           color: #52627e;
//           font-size: 13px;
//           font-weight: 650;
//           cursor: pointer;
//         }

//         .vm-btn:hover {
//           background: #f6f8fc;
//           color: #2458db;
//         }

//         .vm-btn.primary {
//           background: #2458db;
//           border-color: #2458db;
//           color: #fff;
//         }

//         .vm-btn.primary:hover {
//           background: #1747c2;
//         }

//         @media (max-width: 700px) {
//           .vm-meta {
//             grid-template-columns: 1fr;
//           }

//           .vm-line {
//             grid-template-columns: 1fr;
//             gap: 8px;
//           }

//           .vm-print {
//             width: 100%;
//             margin-right: 0;
//           }

//           .vm-print .vm-btn {
//             flex: 1;
//             justify-content: center;
//           }
//         }
//       `}</style>

//       <div className="page-head">
//         <h1>Billing</h1>
//         <div className="page-head-tools">
//           <span className="chip">
//             <Calendar size={16} />
//             {formatDate(now)}
//           </span>
//           <span className="chip">
//             <Clock size={16} />
//             {formatTime(now)}
//           </span>
//         </div>
//       </div>

//       <div className="stack">
//         <div className="table-card">
//           <div className="report-head">
//             <span>Available Stock</span>
//           </div>
//           <div className="table-scroll">
//             <table className="data">
//               <thead>
//                 <tr>
//                   <th style={{ width: 60 }}>S.No</th>
//                   <th style={{ width: 140 }}>Product</th>
//                   <th>Available</th>
//                   <th className="chk" style={{ width: 48 }}>
//                     <input
//                       type="checkbox"
//                       checked={allSelected}
//                       onChange={(e) => toggleAll(e.target.checked)}
//                       aria-label="Select all entries"
//                       disabled={entries.length === 0}
//                     />
//                   </th>
//                   <th style={{ whiteSpace: 'nowrap' }}>Bill Quantity</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {groups.map((group, i) => {
//                   const groupSelected = group.lines.every((l) => l.selected)
//                   const groupAny = group.lines.some((l) => l.selected)
//                   return (
//                     <tr key={group.productId} className={groupAny ? 'row-selected' : ''}>
//                       <td>{i + 1}</td>
//                       <td style={{ overflowWrap: 'anywhere', minWidth: 140 }}>{group.name}</td>
//                       <td style={{ whiteSpace: 'nowrap' }}>
//                         {group.lines
//                           .map((l) => formatQtyWithUnit(l.available, l.unit))
//                           .join(' / ')}
//                       </td>
//                       <td className="chk">
//                         <input
//                           type="checkbox"
//                           checked={groupSelected}
//                           ref={(el) => {
//                             if (el) el.indeterminate = groupAny && !groupSelected
//                           }}
//                           onChange={(e) => toggleGroup(group, e.target.checked)}
//                           aria-label="Select all units of this product"
//                         />
//                       </td>
//                       <td style={{ whiteSpace: 'nowrap' }}>
//                         <div className="qty-stack">
//                           {group.lines.map((en) => {
//                             const bad = !qtyValid(en) || !qtyWithinStock(en)
//                             return (
//                               <div className="qty-item" key={en.key}>
//                                 <label
//                                   className={`qty-input ${en.selected ? '' : 'qty-locked'}`}
//                                   style={en.selected && bad ? { borderColor: 'var(--red)' } : undefined}
//                                   title={en.selected ? undefined : 'Tick the entry to edit the quantity'}
//                                 >
//                                   <input
//                                     inputMode="decimal"
//                                     value={en.quantity}
//                                     onChange={(e) => patchEdit(en.key, { quantity: e.target.value })}
//                                     aria-label={`Bill quantity (${en.unit})`}
//                                     disabled={!en.selected}
//                                   />
//                                   <span>{en.unit}</span>
//                                 </label>
//                               </div>
//                             )
//                           })}
//                         </div>
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>
//           <TableState
//             loading={loading && entries.length === 0}
//             error={error}
//             empty={!loading && !error && entries.length === 0}
//             emptyText="No stock available. Add stock on the Entry page first."
//             onRetry={reload}
//           />
//         </div>

//         {billError && <div className="form-error">{billError}</div>}

//         <div className="bill-bar">
//           <span className="pill pill-amber">Selected Entries: {selected.length}</span>
//           <span className="pill pill-green">Total Quantity: {formatQty(totalQuantity)}</span>

//           <button
//             type="button"
//             className="btn btn-outline"
//             onClick={exportCsv}
//             disabled={entries.length === 0}
//             title="Download the stock list as CSV"
//           >
//             <Download size={16} />
//             Export CSV
//           </button>

//           <button
//             type="button"
//             className="btn btn-outline"
//             onClick={openPrintMenu}
//             disabled={selected.length === 0 && !lastBill && entries.length === 0}
//             aria-label="Print"
//             title={
//               selected.length > 0
//                 ? 'Print / share the selected entries'
//                 : lastBill
//                   ? `Print / share voucher ${lastVoucher}`
//                   : 'Print / share all entries in the list'
//             }
//           >
//             <Printer size={18} />
//           </button>

//           <div className="bill-note">
//             Voucher ID is generated on Submit Billing
//             {lastVoucher && <strong>Last: {lastVoucher}</strong>}
//           </div>
//           <button
//             type="button"
//             className="btn btn-success"
//             disabled={submitting || selected.length === 0}
//             onClick={handleSubmitBilling}
//           >
//             {submitting && <span className="spinner" />}
//             Submit Billing
//           </button>
//         </div>
//       </div>

//       {printBill && (
//         <PdfActionsModal title="Print voucher" build={buildPdf} onClose={() => setPrintBill(null)} />
//       )}

//       {createdBill && (
//         <VoucherCreatedModal
//           bill={createdBill}
//           paper={paper}
//           onClose={() => setCreatedBill(null)}
//         />
//       )}
//     </>
//   )
// }

import { useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle2, Clock, Download, Printer, Receipt, X } from 'lucide-react'
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

/* ------------------------------------------------------------------ */
/* Popup shown right after "Submit Billing" succeeds.                  */
/* Shows the created voucher number + a Print button (same print      */
/* popup as the Reports voucher card: Print / Download / Share).       */
/* bill: { voucherNumber, date, items: [{ name, quantity, unit }] }    */
/* ------------------------------------------------------------------ */
function VoucherCreatedModal({ bill, paper, onClose }) {
  const [printOpen, setPrintOpen] = useState(false)

  // While the print popup is open it handles Esc / outside clicks itself.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !printOpen) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, printOpen])

  // Called once when the print popup opens.
  const buildPdf = () =>
    buildVoucherPdf({
      voucherNumber: bill.voucherNumber,
      date: bill.date,
      items: bill.items,
      paper,
    })

  return (
    <div
      className="vm-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !printOpen) onClose()
      }}
    >
      <div className="vm-card" role="dialog" aria-modal="true" aria-label="Voucher created">
        <div className="vm-head">
          <div className="vm-title">
            <div className="vm-icon vm-icon-success">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3>Voucher {formatVoucher(bill.voucherNumber)} created</h3>
              <p>Billing submitted successfully</p>
            </div>
          </div>

          <button type="button" className="vm-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="vm-body">
          <div className="vm-meta">
            <div>
              <span className="vm-label">Voucher ID</span>
              <div className="vm-value">{formatVoucher(bill.voucherNumber)}</div>
            </div>
            <div>
              <span className="vm-label">Date</span>
              <div className="vm-value">{formatDate(bill.date)}</div>
            </div>
          </div>

          <div className="vm-lines">
            <div className="vm-line vm-line-head">
              <span>Product</span>
              <span style={{ textAlign: 'right' }}>Billed Quantity</span>
            </div>

            {bill.items.map((it, i) => (
              <div className="vm-line" key={`${it.name}-${it.unit}-${i}`}>
                <b>{it.name}</b>
                <span style={{ textAlign: 'right', fontWeight: 700 }}>
                  {formatQtyWithUnit(it.quantity, it.unit)}
                </span>
              </div>
            ))}

            <div className="vm-line vm-line-total">
              <b>Total Items</b>
              <span style={{ textAlign: 'right', fontWeight: 750 }}>{bill.items.length}</span>
            </div>
          </div>
        </div>

        <div className="vm-foot">
          <div className="vm-print">
            <button
              type="button"
              className="vm-btn"
              onClick={() => setPrintOpen(true)}
              aria-label="Print voucher"
              title="Print / download / share voucher"
            >
              <Printer size={17} />
              Print
            </button>
          </div>

          <button type="button" className="vm-btn primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {printOpen && (
        <PdfActionsModal
          title={`Print voucher ${formatVoucher(bill.voucherNumber)}`}
          build={buildPdf}
          onClose={() => setPrintOpen(false)}
        />
      )}
    </div>
  )
}

/*
 * BILLING page.
 *  - The list is the stock balance (same numbers as the Stock page).
 *  - Same product = one table row. Its units are shown in "Available" separated by " / ",
 *    and every unit has its own Bill Quantity box (side by side).
 *  - Tick the product checkbox to unlock its Bill Quantity boxes (up to 3 decimals).
 *    Every box shows its value (full available stock).
 *    One-unit product: billed in full unless you edit the box.
 *    Product with 2+ units: only the unit(s) you EDIT are billed; units you do not touch
 *    (e.g. PCS) are NOT billed and stay in stock.
 *  - The header checkbox ticks everything and fills the full available amount.
 *  - Tick the entries to bill, then "Submit Billing" creates the voucher and opens a
 *    popup with the created voucher number and a Print button.
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
    // Every box always shows its value (default = full available stock).
    return {
      ...r,
      quantity: e.quantity ?? String(r.available),
      selected: Boolean(e.selected),
      touched: Boolean(e.touched), // the person typed in this box
    }
  })

  // Same product (in different units) is shown as ONE table row.
  const groups = []
  const groupIndex = {}
  entries.forEach((en) => {
    if (!(en.productId in groupIndex)) {
      groupIndex[en.productId] = groups.length
      groups.push({ productId: en.productId, name: en.name, lines: [] })
    }
    groups[groupIndex[en.productId]].lines.push(en)
  })

  const [submitting, setSubmitting] = useState(false)
  const [lastVoucher, setLastVoucher] = useState('')
  const [lastBill, setLastBill] = useState(null) // last submitted voucher, used by Print
  const [billError, setBillError] = useState('')
  const [paper] = useState(getPaperSize) // paper size is no longer chosen on this page
  const [printBill, setPrintBill] = useState(null) // bill waiting in the print popup
  const [createdBill, setCreatedBill] = useState(null) // popup shown after Submit Billing

  const qtyValid = (e) => {
    const q = String(e.quantity).trim()
    return QTY_RE.test(q) && Number(q) > 0
  }
  const qtyWithinStock = (e) => Number(e.quantity) <= e.available
  // A unit is billed only when it is ticked AND edited (touched). A unit that was ticked but
  // not edited (e.g. PCS) is left alone and stays in stock. Blank / 0 is also not billed.
  const isSkipped = (e) => {
    if (!e.touched) return true
    const q = String(e.quantity).trim()
    return q === '' || (QTY_RE.test(q) && Number(q) === 0)
  }
  const ticked = entries.filter((e) => e.selected) // units of ticked products
  const selected = ticked.filter((e) => !isSkipped(e)) // units that will really be billed
  const totalQuantity = selected.reduce((sum, e) => sum + (qtyValid(e) ? Number(e.quantity) : 0), 0)
  const allSelected = entries.length > 0 && ticked.length === entries.length

  // Product checkbox: tick / untick the product. Ticking unlocks all its unit boxes and
  // shows their values (full available stock).
  //  - product with ONE unit  -> billed in full (edit the box to bill less)
  //  - product with 2+ units  -> only the unit(s) you EDIT are billed; the others stay in stock
  // Unticking puts everything back to the locked, untouched state.
  // Product checkbox: tick / untick the product. Ticking unlocks all its unit boxes and
// bills every unit in full (edit a box to bill less; set it to 0 / blank to skip that unit).
// Unticking puts everything back to the locked, untouched state.
const toggleGroup = (group, checked) =>
  setEdits((prev) => {
    const next = { ...prev }
    group.lines.forEach((l) => {
      next[l.key] = checked
        ? { selected: true, quantity: undefined, touched: true }   // <-- was: group.lines.length === 1
        : { selected: false, quantity: undefined, touched: false }
    })
    return next
  })

  // Header checkbox: bill everything in full.
  const toggleAll = (checked) =>
    setEdits((prev) => {
      const next = { ...prev }
      rows.forEach((r) => {
        next[r.key] = checked
          ? { selected: true, quantity: undefined, touched: true }
          : { selected: false, quantity: undefined, touched: false }
      })
      return next
    })

  const validateSelected = () => {
    if (selected.length === 0) {
      toast.error('Tick a product and enter a quantity for at least one unit.')
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
    const billedKeys = ticked.map((e) => e.key) // reset every unit of the ticked products
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
      const bill = {
        voucherNumber: voucher.voucher_number,
        date: voucher.voucher_date ?? new Date(),
        items: billedItems,
      }
      setLastVoucher(label)
      setLastBill(bill)
      setCreatedBill(bill) // open the "voucher created" popup with the Print button
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

        /* ticked product, but this unit was not edited -> stays in stock, not billed */
        .qty-input.qty-idle {
          opacity: .6;
        }

        .qty-input.qty-locked input {
          cursor: not-allowed;
        }

        .qty-stack {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: center;
          gap: 10px;
          padding: 2px 0;
        }

        .qty-item {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 0 0 auto;
        }

        .qty-stack .qty-input {
          flex: 0 0 auto;
          width: 104px;
          min-width: 0;
          height: 34px;
          padding: 0 8px;
          font-size: 13px;
        }

        .qty-stack .qty-input input {
          width: 100%;
          min-width: 0;
          font-size: 13px;
        }

        .qty-stack .qty-input span {
          font-size: 12px;
          white-space: nowrap;
        }

        /* ---------- Voucher created popup (same look as the Reports voucher card) ---------- */
        .vm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 16px;
          background: rgba(15, 23, 42, .45);
          animation: vmFade .15s ease;
        }

        @keyframes vmFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .vm-card {
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(15, 23, 42, .25);
        }

        .vm-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 22px;
          border-bottom: 1px solid #e5eaf1;
        }

        .vm-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .vm-icon {
          flex: 0 0 42px;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #edf2ff;
          color: #2861e9;
        }

        .vm-icon-success {
          background: #e7f7ee;
          color: #0caa58;
        }

        .vm-title h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 750;
          color: #1b2947;
        }

        .vm-title p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #71809a;
        }

        .vm-close {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 9px;
          background: #f1f5fa;
          color: #52627e;
          cursor: pointer;
        }

        .vm-close:hover {
          background: #e5edfa;
          color: #2458db;
        }

        .vm-body {
          padding: 20px 22px;
          overflow-y: auto;
        }

        .vm-label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #52627e;
        }

        .vm-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .vm-value {
          font-size: 14px;
          font-weight: 700;
          color: #1b2947;
        }

        .vm-lines {
          border: 1px solid #e5eaf1;
          border-radius: 12px;
          overflow: hidden;
        }

        .vm-line {
          display: grid;
          grid-template-columns: 1fr 150px;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-top: 1px solid #edf0f5;
          font-size: 13px;
          color: #293955;
        }

        .vm-line:first-child {
          border-top: 0;
        }

        .vm-line-head {
          background: #f7f9fc;
          color: #65748e;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .55px;
          text-transform: uppercase;
        }

        .vm-line-total {
          background: #f7f9fc;
        }

        .vm-line b {
          font-weight: 700;
          color: #1d2c49;
        }

        .vm-foot {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
          padding: 14px 22px;
          border-top: 1px solid #e5eaf1;
        }

        .vm-print {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-right: auto;
        }

        .vm-btn {
          min-height: 40px;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #dce3ed;
          border-radius: 9px;
          background: #fff;
          color: #52627e;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
        }

        .vm-btn:hover {
          background: #f6f8fc;
          color: #2458db;
        }

        .vm-btn.primary {
          background: #2458db;
          border-color: #2458db;
          color: #fff;
        }

        .vm-btn.primary:hover {
          background: #1747c2;
        }

        @media (max-width: 700px) {
          .vm-meta {
            grid-template-columns: 1fr;
          }

          .vm-line {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .vm-print {
            width: 100%;
            margin-right: 0;
          }

          .vm-print .vm-btn {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>

      <div className="page-head">
        <h1>Billing</h1>
        <div className="page-head-tools">
          {/* <span className="chip">
            <Calendar size={16} />
            {formatDate(now)}
          </span> */}
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
                  <th style={{ width: 60 }}>S.No</th>
                  <th style={{ width: 140 }}>Product</th>
                  <th>Available</th>
                  <th className="chk" style={{ width: 48 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Select all entries"
                      disabled={entries.length === 0}
                    />
                  </th>
                  <th style={{ whiteSpace: 'nowrap' }}>Bill Quantity</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, i) => {
                  const groupSelected = group.lines.every((l) => l.selected)
                  const groupAny = group.lines.some((l) => l.selected)
                  return (
                    <tr key={group.productId} className={groupAny ? 'row-selected' : ''}>
                      <td>{i + 1}</td>
                      <td style={{ overflowWrap: 'anywhere', minWidth: 140 }}>{group.name}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {group.lines
                          .map((l) => formatQtyWithUnit(l.available, l.unit))
                          .join(' / ')}
                      </td>
                      <td className="chk">
                        <input
                          type="checkbox"
                          checked={groupSelected}
                          onChange={(e) => toggleGroup(group, e.target.checked)}
                          aria-label="Select this product"
                        />
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="qty-stack">
                          {group.lines.map((en) => {
                            const bad = !qtyValid(en) || !qtyWithinStock(en)
                            return (
                              <div className="qty-item" key={en.key}>
                                <label
                                  className={`qty-input ${
                                    !en.selected ? 'qty-locked' : en.touched ? '' : 'qty-idle'
                                  }`}
                                  style={
                                    en.selected && !isSkipped(en) && bad
                                      ? { borderColor: 'var(--red)' }
                                      : undefined
                                  }
                                  title={
                                    !en.selected
                                      ? 'Tick the product to edit the quantity'
                                      : en.touched
                                        ? undefined
                                        : `Not billed - edit this box to bill ${en.unit}`
                                  }
                                >
                                  <input
                                    inputMode="decimal"
                                    value={en.quantity}
                                    onChange={(e) =>
                                      patchEdit(en.key, { quantity: e.target.value, touched: true })
                                    }
                                    aria-label={`Bill quantity (${en.unit})`}
                                    disabled={!en.selected}
                                  />
                                  <span>{en.unit}</span>
                                </label>
                              </div>
                            )
                          })}
                        </div>
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

      {createdBill && (
        <VoucherCreatedModal
          bill={createdBill}
          paper={paper}
          onClose={() => setCreatedBill(null)}
        />
      )}
    </>
  )
}
