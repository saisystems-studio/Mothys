// // import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// // import {
// //   Download,
// //   RotateCcw,
// //   Search,
// //   SlidersHorizontal,
// //   X,
// //   Receipt,
// //   FileText,
// //   Package,
// //   Pencil,
// //   Save,
// //   ChevronDown,
// //   ChevronUp,
// // } from 'lucide-react'

// // import TableState from '../components/TableState'
// // import useAsyncData from '../hooks/useAsyncData'
// // import useToast from '../hooks/useToast'
// // import { getVoucherDetails } from '../services/reportsService'
// // import { updateVoucher } from '../services/vouchersService'
// // import { getStock } from '../services/stockService'
// // import { getProducts } from '../services/productsService'
// // import { getUnits } from '../services/unitsService'
// // import { QUICK_RANGES, getRange } from '../utils/dateRanges'
// // import { formatDate, formatQtyWithUnit, formatVoucher } from '../utils/format'

// // const loadLookups = () => Promise.all([getProducts(), getUnits()])

// // const initialFilters = () => ({
// //   range: 'today',
// //   ...getRange('today'),
// //   productId: '',
// // })

// // const isoLabel = (iso) => (iso ? formatDate(`${iso}T00:00:00`) : '')

// // const toInputDate = (d) => (d ? String(d).slice(0, 10) : '')

// // function csvCell(value) {
// //   const s = String(value ?? '')
// //   return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
// // }

// // /* ------------------------------------------------------------------ */
// // /* Voucher details / edit card                                         */
// // /* voucher: { voucher_id, voucher_number, voucher_date, lines: [...] } */
// // /* ------------------------------------------------------------------ */
// // function VoucherCard({ voucher, onClose, onSaved }) {
// //   const toast = useToast()
// //   const [editing, setEditing] = useState(false)
// //   const [saving, setSaving] = useState(false)
// //   const [date, setDate] = useState(toInputDate(voucher.voucher_date))
// //   const [qty, setQty] = useState(() =>
// //     voucher.lines.map((l) => String(l.quantity)),
// //   )

// //   useEffect(() => {
// //     const onKey = (e) => {
// //       if (e.key === 'Escape' && !saving) onClose()
// //     }
// //     window.addEventListener('keydown', onKey)
// //     return () => window.removeEventListener('keydown', onKey)
// //   }, [onClose, saving])

// //   const cancelEdit = () => {
// //     setDate(toInputDate(voucher.voucher_date))
// //     setQty(voucher.lines.map((l) => String(l.quantity)))
// //     setEditing(false)
// //   }

// //   const save = async () => {
// //     if (!date) return toast.error('Voucher date is required.')

// //     if (
// //       qty.some((q) => q === '' || Number.isNaN(Number(q)) || Number(q) <= 0)
// //     ) {
// //       return toast.error('Every quantity must be greater than zero.')
// //     }

// //     setSaving(true)

// //    try {
// //   await updateVoucher(voucher.voucher_id, {
// //     voucher_date: date,
// //     items: voucher.lines.map((l, i) => ({
// //       product_id: l.product_id,
// //       quantity: Number(qty[i]),
// //     })),
// //   })

// //       toast.success('Voucher updated.')
// //       onSaved?.()
// //       onClose()
// //     } catch (err) {
// //       toast.error(err?.message || 'Could not update the voucher.')
// //     } finally {
// //       setSaving(false)
// //     }
// //   }

// //   return (
// //     <div
// //       className="vm-backdrop"
// //       onMouseDown={(e) => {
// //         if (e.target === e.currentTarget && !saving) onClose()
// //       }}
// //     >
// //       <div
// //         className="vm-card"
// //         role="dialog"
// //         aria-modal="true"
// //         aria-label="Voucher details"
// //       >
// //         <div className="vm-head">
// //           <div className="vm-title">
// //             <div className="vm-icon">
// //               <Receipt size={20} />
// //             </div>
// //             <div>
// //               <h3>Voucher {formatVoucher(voucher.voucher_number)}</h3>
// //               <p>{editing ? 'Editing voucher' : 'Voucher details'}</p>
// //             </div>
// //           </div>

// //           <button
// //             type="button"
// //             className="vm-close"
// //             onClick={onClose}
// //             aria-label="Close"
// //             disabled={saving}
// //           >
// //             <X size={18} />
// //           </button>
// //         </div>

// //         <div className="vm-body">
// //           <div className="vm-meta">
// //             <div>
// //               <span className="vm-label">Voucher ID</span>
// //               <div className="vm-value">
// //                 {formatVoucher(voucher.voucher_number)}
// //               </div>
// //             </div>

// //             <div>
// //               <label className="vm-label" htmlFor="vm-date">
// //                 Date
// //               </label>
// //               {editing ? (
// //                 <input
// //                   id="vm-date"
// //                   type="date"
// //                   className="vm-input"
// //                   value={date}
// //                   onChange={(e) => setDate(e.target.value)}
// //                 />
// //               ) : (
// //                 <div className="vm-value">{formatDate(voucher.voucher_date)}</div>
// //               )}
// //             </div>
// //           </div>

// //           <div className="vm-lines">
// //             <div className="vm-line vm-line-head">
// //               <span>Product</span>
// //               <span style={{ textAlign: 'right' }}>Billed Quantity</span>
// //             </div>

// //             {voucher.lines.map((l, i) => (
// //               <div className="vm-line" key={`${l.product_id}-${i}`}>
// //                 <b>{l.product_name}</b>

// //                 {editing ? (
// //                   <div className="vm-qty-wrap">
// //                     <input
// //                       type="number"
// //                       min="0"
// //                       step="any"
// //                       className="vm-input"
// //                       value={qty[i]}
// //                       aria-label={`Quantity for ${l.product_name}`}
// //                       onChange={(e) =>
// //                         setQty((q) =>
// //                           q.map((v, j) => (j === i ? e.target.value : v)),
// //                         )
// //                       }
// //                     />
// //                     <span className="vm-unit">{l.unit_name}</span>
// //                   </div>
// //                 ) : (
// //                   <span style={{ textAlign: 'right', fontWeight: 700 }}>
// //                     {formatQtyWithUnit(l.quantity, l.unit_name)}
// //                   </span>
// //                 )}
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         <div className="vm-foot">
// //           {editing ? (
// //             <>
// //               <button
// //                 type="button"
// //                 className="vm-btn"
// //                 onClick={cancelEdit}
// //                 disabled={saving}
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 type="button"
// //                 className="vm-btn primary"
// //                 onClick={save}
// //                 disabled={saving}
// //               >
// //                 <Save size={15} />
// //                 {saving ? 'Saving…' : 'Update'}
// //               </button>
// //             </>
// //           ) : (
// //             <>
// //               <button type="button" className="vm-btn" onClick={onClose}>
// //                 Close
// //               </button>
// //               <button
// //                 type="button"
// //                 className="vm-btn primary"
// //                 onClick={() => setEditing(true)}
// //               >
// //                 <Pencil size={15} />
// //                 Edit
// //               </button>
// //             </>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }

// // export default function Reports() {
// //   const toast = useToast()

// //   const [draft, setDraft] = useState(initialFilters)
// //   const [applied, setApplied] = useState(initialFilters)
// //   const [filtersOpen, setFiltersOpen] = useState(false)
// //   const [openVoucherId, setOpenVoucherId] = useState(null)
// //   const stockRef = useRef(null)

// //   const { data: lookups } = useAsyncData(loadLookups)
// //   const [products, units] = lookups ?? [[], []]

// //   const unitName = useMemo(
// //     () => Object.fromEntries(units.map((u) => [u.id, u.unit_name])),
// //     [units],
// //   )

// //   const loadReport = useCallback(
// //     () =>
// //       Promise.all([
// //         getVoucherDetails({
// //           startDate: applied.from,
// //           endDate: applied.to,
// //           productId: applied.productId || undefined,
// //         }),
// //         getStock(),
// //       ]),
// //     [applied],
// //   )

// //   const { data, loading, error, reload } = useAsyncData(loadReport)

// //   const [billed, stockAll] = data ?? [[], []]

// //   const stock = useMemo(
// //     () =>
// //       stockAll
// //         .filter(
// //           (s) =>
// //             !applied.productId ||
// //             String(s.product_id) === String(applied.productId),
// //         )
// //         .filter((s) => Number(s.remaining_stock) > 0),
// //     [stockAll, applied.productId],
// //   )

// //   const productLabel = applied.productId
// //     ? products.find((p) => String(p.id) === String(applied.productId))
// //         ?.product_name ?? 'Selected product'
// //     : 'All products'

// //   const totalVouchers = useMemo(
// //     () => new Set(billed.map((r) => r.voucher_id)).size,
// //     [billed],
// //   )

// //   const openVoucher = useMemo(() => {
// //     if (openVoucherId == null) return null

// //     const lines = billed.filter((r) => r.voucher_id === openVoucherId)
// //     if (!lines.length) return null

// //     return {
// //       voucher_id: openVoucherId,
// //       voucher_number: lines[0].voucher_number,
// //       voucher_date: lines[0].voucher_date,
// //       lines,
// //     }
// //   }, [billed, openVoucherId])

// //   const pickRange = (key) => {
// //     if (key === 'custom') {
// //       setDraft((d) => ({ ...d, range: 'custom' }))
// //       return
// //     }

// //     const next = {
// //       ...draft,
// //       range: key,
// //       ...getRange(key),
// //     }

// //     setDraft(next)
// //     setApplied(next)
// //   }

// //   const pickProduct = (productId) => {
// //     setDraft((d) => ({ ...d, productId }))
// //   }

// //   const generate = () => {
// //     if (!draft.from || !draft.to) {
// //       return toast.error('Choose both a start and end date.')
// //     }

// //     if (draft.from > draft.to) {
// //       return toast.error('Start date cannot be later than end date.')
// //     }

// //     setApplied(draft)
// //     setFiltersOpen(false)
// //   }

// //   const reset = () => {
// //     const fresh = initialFilters()
// //     setDraft(fresh)
// //     setApplied(fresh)
// //   }

// //   const exportCsv = () => {
// //     if (!billed.length && !stock.length) {
// //       return toast.info('There is no data to export.')
// //     }

// //     const lines = [
// //       `Mothys Inventory Report`,
// //       `Period,${applied.from} to ${applied.to}`,
// //       `Product,${csvCell(productLabel)}`,
// //       '',
// //       'Billed Details',
// //       'S.No,Voucher,Voucher Date,Product,Unit,Billed Quantity',
// //       ...billed.map((r, i) =>
// //         [
// //           i + 1,
// //           formatVoucher(r.voucher_number),
// //           formatDate(r.voucher_date),
// //           r.product_name,
// //           r.unit_name,
// //           Number(r.quantity),
// //         ]
// //           .map(csvCell)
// //           .join(','),
// //       ),
// //       '',
// //       `Stock Remaining,As on ${formatDate(new Date())}`,
// //       'S.No,Product,Unit,Remaining Quantity',
// //       ...stock.map((s, i) =>
// //         [
// //           i + 1,
// //           s.product_name,
// //           unitName[s.unit_id] ?? '',
// //           Number(s.remaining_stock),
// //         ]
// //           .map(csvCell)
// //           .join(','),
// //       ),
// //     ]

// //     const blob = new Blob(['\uFEFF' + lines.join('\n')], {
// //       type: 'text/csv;charset=utf-8',
// //     })

// //     const url = URL.createObjectURL(blob)
// //     const a = document.createElement('a')

// //     a.href = url
// //     a.download = `mothys-report-${applied.from}-to-${applied.to}.csv`
// //     a.click()

// //     URL.revokeObjectURL(url)
// //   }

// //   const scrollToStock = () =>
// //     stockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// //   const custom = draft.range === 'custom'
// //   const todayLabel = formatDate(new Date())

// //   return (
// //     <>
// //       <style>{`
// //         .reports-page {
// //           width: 100%;
// //           color: var(--text, #17233f);
// //         }

// //         .reports-page * {
// //           box-sizing: border-box;
// //         }

// //         .reports-heading {
// //           display: flex;
// //           justify-content: space-between;
// //           align-items: center;
// //           gap: 16px;
// //           flex-wrap: wrap;
// //           margin-bottom: 24px;
// //         }

// //         .reports-heading h1 {
// //           margin: 0;
// //           font-size: 28px;
// //           font-weight: 750;
// //           letter-spacing: -0.7px;
// //           color: #17233f;
// //         }

// //         .reports-subtitle {
// //           margin: 7px 0 0;
// //           color: #64748b;
// //           font-size: 13px;
// //         }

// //         .reports-actions {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //         }

// //         .reports-page .report-btn {
// //           min-height: 44px;
// //           display: inline-flex;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 9px;
// //           padding: 0 18px;
// //           border-radius: 10px;
// //           font-size: 13px;
// //           font-weight: 650;
// //           cursor: pointer;
// //           transition: .2s ease;
// //         }

// //         .reports-page .report-filter-btn {
// //           background: #fff;
// //           color: #1e3155;
// //           border: 1px solid #d7dfeb;
// //         }

// //         .reports-page .report-filter-btn:hover {
// //           border-color: #2563eb;
// //           color: #2563eb;
// //           background: #f8faff;
// //         }

// //         .reports-page .report-export-btn,
// //         .reports-page .report-generate-btn {
// //           background: #2458db;
// //           color: #fff;
// //           border: 1px solid #2458db;
// //           box-shadow: 0 3px 8px rgba(36, 88, 219, .15);
// //         }

// //         .reports-page .report-export-btn:hover,
// //         .reports-page .report-generate-btn:hover {
// //           background: #1747c2;
// //           border-color: #1747c2;
// //           transform: translateY(-1px);
// //         }

// //         .reports-page .report-export-btn:disabled {
// //           opacity: .55;
// //           cursor: not-allowed;
// //           transform: none;
// //         }

// //         .report-filter-panel {
// //           background: #fff;
// //           border: 1px solid #dce3ee;
// //           border-radius: 15px;
// //           padding: 23px 24px;
// //           margin-bottom: 24px;
// //           box-shadow: 0 5px 18px rgba(22, 39, 72, .045);
// //           animation: reportSlide .18s ease;
// //         }

// //         @keyframes reportSlide {
// //           from { opacity: 0; transform: translateY(-5px); }
// //           to { opacity: 1; transform: translateY(0); }
// //         }

// //         .report-filter-title {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 12px;
// //           margin-bottom: 22px;
// //         }

// //         .report-filter-title h3 {
// //           margin: 0;
// //           color: #1c2b49;
// //           font-size: 16px;
// //           font-weight: 750;
// //         }

// //         .report-filter-title p {
// //           margin: 5px 0 0;
// //           font-size: 12px;
// //           color: #71809a;
// //         }

// //         .report-close {
// //           width: 34px;
// //           height: 34px;
// //           display: grid;
// //           place-items: center;
// //           border: 0;
// //           border-radius: 9px;
// //           background: #f1f5fa;
// //           color: #52627e;
// //           cursor: pointer;
// //         }

// //         .report-close:hover {
// //           background: #e5edfa;
// //           color: #2458db;
// //         }

// //         .report-field-label {
// //           display: block;
// //           margin-bottom: 9px;
// //           font-size: 12px;
// //           font-weight: 700;
// //           color: #52627e;
// //         }

// //         .report-quick-ranges {
// //           display: flex;
// //           flex-wrap: wrap;
// //           gap: 8px;
// //           margin-bottom: 21px;
// //         }

// //         .report-quick-ranges button {
// //           min-height: 37px;
// //           padding: 0 15px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 8px;
// //           background: #fff;
// //           color: #53627c;
// //           font-size: 12px;
// //           font-weight: 600;
// //           cursor: pointer;
// //           transition: .18s ease;
// //         }

// //         .report-quick-ranges button:hover {
// //           border-color: #8eabed;
// //           color: #2458db;
// //           background: #f7f9ff;
// //         }

// //         .report-quick-ranges button.active {
// //           border-color: #2458db;
// //           background: #edf3ff;
// //           color: #2458db;
// //           box-shadow: inset 0 0 0 1px #2458db;
// //         }

// //         .report-filter-fields {
// //           display: grid;
// //           grid-template-columns: repeat(3, minmax(0, 1fr));
// //           gap: 18px;
// //         }

// //         .report-filter-fields input,
// //         .report-filter-fields select {
// //           width: 100%;
// //           height: 44px;
// //           padding: 0 12px;
// //           border: 1px solid #d9e1ed;
// //           border-radius: 9px;
// //           outline: none;
// //           background: #fff;
// //           color: #253653;
// //           font-size: 13px;
// //         }

// //         .report-filter-fields input:focus,
// //         .report-filter-fields select:focus {
// //           border-color: #3972ed;
// //           box-shadow: 0 0 0 3px rgba(57, 114, 237, .10);
// //         }

// //         .report-filter-fields input:disabled {
// //           background: #f4f6fa;
// //           color: #9aa6b8;
// //           cursor: not-allowed;
// //         }

// //         .report-filter-footer {
// //           display: flex;
// //           align-items: center;
// //           justify-content: flex-end;
// //           gap: 10px;
// //           border-top: 1px solid #edf0f5;
// //           margin-top: 22px;
// //           padding-top: 17px;
// //         }

// //         .report-reset-btn {
// //           min-height: 40px;
// //           padding: 0 15px;
// //           display: inline-flex;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 7px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 9px;
// //           background: #fff;
// //           color: #52627e;
// //           font-size: 12px;
// //           font-weight: 650;
// //           cursor: pointer;
// //         }

// //         .report-reset-btn:hover {
// //           background: #f6f8fc;
// //           color: #2458db;
// //         }

// //         .report-generate-btn {
// //           min-height: 40px !important;
// //           padding: 0 17px !important;
// //           border-radius: 9px !important;
// //           font-size: 12px !important;
// //         }

// //         .report-summary-grid {
// //           display: grid;
// //           grid-template-columns: repeat(3, minmax(0, 1fr));
// //           gap: 20px;
// //           margin-bottom: 24px;
// //         }

// //         .report-stat {
// //           min-width: 0;
// //           min-height: 145px;
// //           display: flex;
// //           align-items: flex-start;
// //           gap: 15px;
// //           padding: 22px 20px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 14px;
// //           background: #fff;
// //           box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
// //         }

// //         .report-stat-link {
// //           width: 100%;
// //           font: inherit;
// //           color: inherit;
// //           text-align: left;
// //           cursor: pointer;
// //           transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
// //         }

// //         .report-stat-link:hover {
// //           border-color: #2458db;
// //           box-shadow: 0 8px 22px rgba(36, 88, 219, .12);
// //           transform: translateY(-2px);
// //         }

// //         .report-stat-link:focus-visible {
// //           outline: 3px solid rgba(36, 88, 219, .35);
// //           outline-offset: 2px;
// //         }

// //         .report-stat-hint {
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 4px;
// //           margin-top: 8px;
// //           color: #2458db;
// //           font-size: 11px;
// //           font-weight: 700;
// //         }

// //         .report-table-card.stock-card {
// //           scroll-margin-top: 16px;
// //         }

// //         .report-stat-icon {
// //           flex: 0 0 52px;
// //           width: 52px;
// //           height: 52px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 13px;
// //         }

// //         .report-stat-icon.blue {
// //           background: #eaf0ff;
// //           color: #2861e9;
// //         }

// //         .report-stat-icon.purple {
// //           background: #f1eaff;
// //           color: #8b42f6;
// //         }

// //         .report-stat-icon.orange {
// //           background: #fff2e6;
// //           color: #ec850d;
// //         }

// //         .report-stat-icon.green {
// //           background: #e7f7ee;
// //           color: #0caa58;
// //         }

// //         .report-stat-content {
// //           min-width: 0;
// //         }

// //         .report-stat-label {
// //           color: #64718a;
// //           font-size: 12px;
// //           font-weight: 650;
// //           line-height: 1.5;
// //         }

// //         .report-stat-value {
// //           margin-top: 5px;
// //           color: #1b2947;
// //           font-size: 29px;
// //           font-weight: 780;
// //           line-height: 1.15;
// //           letter-spacing: -.6px;
// //         }

// //         .report-stat-note {
// //           margin-top: 8px;
// //           color: #74819a;
// //           font-size: 11px;
// //           line-height: 1.5;
// //         }

// //         .report-tables {
// //           display: grid;
// //           grid-template-columns: 1fr;
// //           gap: 22px;
// //         }

// //         .report-table-card {
// //           min-width: 0;
// //           overflow: hidden;
// //           border: 1px solid #dce3ed;
// //           border-radius: 14px;
// //           background: #fff;
// //           box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
// //         }

// //         .report-table-head {
// //           min-height: 82px;
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 14px;
// //           padding: 17px 22px;
// //           border-bottom: 1px solid #e5eaf1;
// //         }

// //         .report-table-heading {
// //           display: flex;
// //           align-items: center;
// //           gap: 13px;
// //           min-width: 0;
// //         }

// //         .report-table-icon {
// //           flex: 0 0 44px;
// //           width: 44px;
// //           height: 44px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 11px;
// //           background: #edf2ff;
// //           color: #2861e9;
// //         }

// //         .report-table-icon.stock {
// //           background: #e9f8ef;
// //           color: #0ba65a;
// //         }

// //         .report-table-heading h3 {
// //           margin: 0;
// //           color: #1b2947;
// //           font-size: 15px;
// //           font-weight: 750;
// //         }

// //         .report-table-heading p {
// //           margin: 5px 0 0;
// //           color: #71809a;
// //           font-size: 11px;
// //         }

// //         .report-count {
// //           flex: 0 0 auto;
// //           padding: 7px 12px;
// //           border-radius: 20px;
// //           background: #f0f4fa;
// //           color: #52627e;
// //           font-size: 11px;
// //           font-weight: 700;
// //         }

// //         .report-table-scroll {
// //           width: 100%;
// //           overflow-x: auto;
// //         }

// //         .report-table {
// //           width: 100%;
// //           min-width: 650px;
// //           border-collapse: collapse;
// //           text-align: left;
// //         }

// //         .report-table th {
// //           padding: 14px 18px;
// //           background: #f7f9fc;
// //           color: #65748e;
// //           font-size: 10px;
// //           font-weight: 750;
// //           letter-spacing: .55px;
// //           text-transform: uppercase;
// //           white-space: nowrap;
// //         }

// //         .report-table td {
// //           padding: 15px 18px;
// //           border-top: 1px solid #edf0f5;
// //           color: #293955;
// //           font-size: 12px;
// //           font-weight: 500;
// //           white-space: nowrap;
// //         }

// //         .report-table tbody tr {
// //           transition: background .15s ease;
// //         }

// //         .report-table tbody tr:hover {
// //           background: #f8faff;
// //         }

// //         .report-table .report-muted {
// //           color: #8290a6;
// //         }

// //         .report-voucher {
// //           display: inline-flex;
// //           align-items: center;
// //           padding: 6px 10px;
// //           border: 1px solid #dce6ff;
// //           border-radius: 7px;
// //           background: #f1f5ff;
// //           color: #2458c7;
// //           font-size: 11px;
// //           font-weight: 750;
// //         }

// //         .report-voucher-btn {
// //           cursor: pointer;
// //           font-family: inherit;
// //           transition: .15s ease;
// //         }

// //         .report-voucher-btn:hover {
// //           background: #e3ebff;
// //           border-color: #2458db;
// //           text-decoration: underline;
// //         }

// //         .report-voucher-btn:focus-visible {
// //           outline: 3px solid rgba(36, 88, 219, .35);
// //           outline-offset: 2px;
// //         }

// //         .report-product-name {
// //           color: #1d2c49 !important;
// //           font-weight: 700 !important;
// //         }

// //         .report-qty {
// //           display: inline-flex;
// //           justify-content: flex-end;
// //           min-width: 76px;
// //           padding: 7px 11px;
// //           border-radius: 7px;
// //           background: #f0f4fb;
// //           color: #243958;
// //           font-weight: 750;
// //         }

// //         .report-number {
// //           text-align: right !important;
// //         }

// //         .report-table-state {
// //           padding: 4px 18px 18px;
// //         }

// //         /* ---------- Voucher card (modal) ---------- */
// //         .vm-backdrop {
// //           position: fixed;
// //           inset: 0;
// //           z-index: 1000;
// //           display: grid;
// //           place-items: center;
// //           padding: 16px;
// //           background: rgba(15, 23, 42, .45);
// //           animation: vmFade .15s ease;
// //         }

// //         @keyframes vmFade {
// //           from { opacity: 0; }
// //           to { opacity: 1; }
// //         }

// //         .vm-card {
// //           width: 100%;
// //           max-width: 560px;
// //           max-height: 90vh;
// //           display: flex;
// //           flex-direction: column;
// //           background: #fff;
// //           border-radius: 16px;
// //           overflow: hidden;
// //           box-shadow: 0 20px 50px rgba(15, 23, 42, .25);
// //         }

// //         .vm-head {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 12px;
// //           padding: 18px 22px;
// //           border-bottom: 1px solid #e5eaf1;
// //         }

// //         .vm-title {
// //           display: flex;
// //           align-items: center;
// //           gap: 12px;
// //           min-width: 0;
// //         }

// //         .vm-icon {
// //           flex: 0 0 42px;
// //           width: 42px;
// //           height: 42px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 11px;
// //           background: #edf2ff;
// //           color: #2861e9;
// //         }

// //         .vm-title h3 {
// //           margin: 0;
// //           font-size: 16px;
// //           font-weight: 750;
// //           color: #1b2947;
// //         }

// //         .vm-title p {
// //           margin: 4px 0 0;
// //           font-size: 12px;
// //           color: #71809a;
// //         }

// //         .vm-close {
// //           width: 34px;
// //           height: 34px;
// //           display: grid;
// //           place-items: center;
// //           border: 0;
// //           border-radius: 9px;
// //           background: #f1f5fa;
// //           color: #52627e;
// //           cursor: pointer;
// //         }

// //         .vm-close:hover {
// //           background: #e5edfa;
// //           color: #2458db;
// //         }

// //         .vm-body {
// //           padding: 20px 22px;
// //           overflow-y: auto;
// //         }

// //         .vm-label {
// //           display: block;
// //           margin-bottom: 8px;
// //           font-size: 12px;
// //           font-weight: 700;
// //           color: #52627e;
// //         }

// //         .vm-input {
// //           width: 100%;
// //           height: 42px;
// //           padding: 0 12px;
// //           border: 1px solid #d9e1ed;
// //           border-radius: 9px;
// //           font-size: 13px;
// //           color: #253653;
// //           background: #fff;
// //           outline: none;
// //         }

// //         .vm-input:focus {
// //           border-color: #3972ed;
// //           box-shadow: 0 0 0 3px rgba(57, 114, 237, .1);
// //         }

// //         .vm-meta {
// //           display: grid;
// //           grid-template-columns: 1fr 1fr;
// //           gap: 16px;
// //           margin-bottom: 20px;
// //         }

// //         .vm-value {
// //           font-size: 14px;
// //           font-weight: 700;
// //           color: #1b2947;
// //         }

// //         .vm-lines {
// //           border: 1px solid #e5eaf1;
// //           border-radius: 12px;
// //           overflow: hidden;
// //         }

// //         .vm-line {
// //           display: grid;
// //           grid-template-columns: 1fr 150px;
// //           align-items: center;
// //           gap: 12px;
// //           padding: 12px 16px;
// //           border-top: 1px solid #edf0f5;
// //           font-size: 13px;
// //           color: #293955;
// //         }

// //         .vm-line:first-child {
// //           border-top: 0;
// //         }

// //         .vm-line-head {
// //           background: #f7f9fc;
// //           color: #65748e;
// //           font-size: 10px;
// //           font-weight: 750;
// //           letter-spacing: .55px;
// //           text-transform: uppercase;
// //         }

// //         .vm-line b {
// //           font-weight: 700;
// //           color: #1d2c49;
// //         }

// //         .vm-qty-wrap {
// //           display: flex;
// //           align-items: center;
// //           gap: 8px;
// //           justify-content: flex-end;
// //         }

// //         .vm-qty-wrap .vm-input {
// //           height: 36px;
// //           text-align: right;
// //         }

// //         .vm-unit {
// //           font-size: 12px;
// //           color: #71809a;
// //           white-space: nowrap;
// //         }

// //         .vm-foot {
// //           display: flex;
// //           justify-content: flex-end;
// //           gap: 10px;
// //           padding: 14px 22px;
// //           border-top: 1px solid #e5eaf1;
// //         }

// //         .vm-btn {
// //           min-height: 40px;
// //           padding: 0 18px;
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 8px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 9px;
// //           background: #fff;
// //           color: #52627e;
// //           font-size: 13px;
// //           font-weight: 650;
// //           cursor: pointer;
// //         }

// //         .vm-btn:hover {
// //           background: #f6f8fc;
// //           color: #2458db;
// //         }

// //         .vm-btn.primary {
// //           background: #2458db;
// //           border-color: #2458db;
// //           color: #fff;
// //         }

// //         .vm-btn.primary:hover {
// //           background: #1747c2;
// //         }

// //         .vm-btn:disabled {
// //           opacity: .6;
// //           cursor: not-allowed;
// //         }

// //         @media (max-width: 1100px) {
// //           .report-summary-grid {
// //             gap: 14px;
// //           }

// //           .report-stat {
// //             padding: 18px 16px;
// //             gap: 12px;
// //           }
// //         }

// //         @media (max-width: 700px) {
// //           .reports-heading {
// //             align-items: flex-start;
// //           }

// //           .reports-actions {
// //             width: 100%;
// //           }

// //           .reports-actions .report-btn {
// //             flex: 1;
// //             padding: 0 10px;
// //           }

// //           .report-filter-panel {
// //             padding: 17px;
// //           }

// //           .report-filter-fields {
// //             grid-template-columns: 1fr;
// //             gap: 14px;
// //           }

// //           .report-summary-grid {
// //             grid-template-columns: 1fr;
// //             gap: 12px;
// //           }

// //           .report-stat {
// //             min-height: 0;
// //             padding: 16px 14px;
// //             gap: 12px;
// //           }

// //           .report-stat-icon {
// //             width: 39px;
// //             height: 39px;
// //             flex-basis: 39px;
// //           }

// //           .report-stat-value {
// //             font-size: 24px;
// //           }

// //           .report-table-head {
// //             padding: 14px;
// //           }

// //           .report-filter-footer {
// //             flex-wrap: wrap;
// //           }

// //           .vm-meta {
// //             grid-template-columns: 1fr;
// //           }

// //           .vm-line {
// //             grid-template-columns: 1fr;
// //             gap: 8px;
// //           }

// //           .vm-qty-wrap {
// //             justify-content: flex-start;
// //           }
// //         }
// // .report-clickable-row {
// //   cursor: pointer;
// //   transition: background .15s ease;
// // }

// // .report-clickable-row:hover {
// //   background: #edf3ff !important;
// // }

// // .report-clickable-row:focus-visible {
// //   outline: 2px solid #2458db;
// //   outline-offset: -2px;
// // }
// //       `}</style>

// //       <div className="reports-page">
// //         <div className="reports-heading">
// //           <div>
// //             <h1>Reports</h1>
// //             <p className="reports-subtitle">
// //               Business overview · {isoLabel(applied.from)} to {isoLabel(applied.to)}
// //             </p>
// //           </div>

// //           <div className="reports-actions">
// //             <button
// //               type="button"
// //               className="report-btn report-filter-btn"
// //               onClick={() => setFiltersOpen((open) => !open)}
// //               aria-expanded={filtersOpen}
// //             >
// //               <SlidersHorizontal size={16} />
// //               Filters
// //               {filtersOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
// //             </button>

// //             <button
// //               type="button"
// //               className="report-btn report-export-btn"
// //               onClick={exportCsv}
// //               disabled={loading || Boolean(error)}
// //             >
// //               <Download size={16} />
// //               Export CSV
// //             </button>
// //           </div>
// //         </div>

// //         {filtersOpen && (
// //           <section className="report-filter-panel">
// //             <div className="report-filter-title">
// //               <div>
// //                 <h3>Report filters</h3>
// //                 <p>Choose a period and product to view your report</p>
// //               </div>

// //               <button
// //                 type="button"
// //                 className="report-close"
// //                 onClick={() => setFiltersOpen(false)}
// //                 aria-label="Close filters"
// //               >
// //                 <X size={18} />
// //               </button>
// //             </div>

// //             <div>
// //               <span className="report-field-label">Quick period</span>

// //               <div className="report-quick-ranges">
// //                 {QUICK_RANGES.map((r) => (
// //                   <button
// //                     key={r.key}
// //                     type="button"
// //                     className={draft.range === r.key ? 'active' : ''}
// //                     onClick={() => pickRange(r.key)}
// //                   >
// //                     {r.label}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="report-filter-fields">
// //               <div>
// //                 <label className="report-field-label" htmlFor="r-from">
// //                   From date
// //                 </label>
// //                 <input
// //                   id="r-from"
// //                   type="date"
// //                   value={draft.from}
// //                   disabled={!custom}
// //                   onChange={(e) =>
// //                     setDraft((d) => ({ ...d, from: e.target.value }))
// //                   }
// //                 />
// //               </div>

// //               <div>
// //                 <label className="report-field-label" htmlFor="r-to">
// //                   To date
// //                 </label>
// //                 <input
// //                   id="r-to"
// //                   type="date"
// //                   value={draft.to}
// //                   disabled={!custom}
// //                   onChange={(e) =>
// //                     setDraft((d) => ({ ...d, to: e.target.value }))
// //                   }
// //                 />
// //               </div>

// //               <div>
// //                 <label className="report-field-label" htmlFor="r-product">
// //                   Product
// //                 </label>
// //                 <select
// //                   id="r-product"
// //                   value={draft.productId}
// //                   onChange={(e) => pickProduct(e.target.value)}
// //                 >
// //                   <option value="">All products</option>
// //                   {products.map((p) => (
// //                     <option key={p.id} value={p.id}>
// //                       {p.product_name}
// //                     </option>
// //                   ))}
// //                 </select>
// //               </div>
// //             </div>

// //             <div className="report-filter-footer">
// //               <button
// //                 type="button"
// //                 className="report-reset-btn"
// //                 onClick={reset}
// //               >
// //                 <RotateCcw size={14} />
// //                 Reset
// //               </button>

// //               <button
// //                 type="button"
// //                 className="report-btn report-generate-btn"
// //                 onClick={generate}
// //               >
// //                 <Search size={15} />
// //                 submit
// //               </button>
// //             </div>
// //           </section>
// //         )}

// //         <div className="report-summary-grid">
// //           <div className="report-stat">
// //             <div className="report-stat-icon blue">
// //               <Receipt size={24} />
// //             </div>
// //             <div className="report-stat-content">
// //               <div className="report-stat-label">Total vouchers</div>
// //               <div className="report-stat-value">{totalVouchers}</div>
// //               <div className="report-stat-note">
// //                 {isoLabel(applied.from)} – {isoLabel(applied.to)}
// //               </div>
// //             </div>
// //           </div>

// //           <div className="report-stat">
// //             <div className="report-stat-icon purple">
// //               <FileText size={24} />
// //             </div>
// //             <div className="report-stat-content">
// //               <div className="report-stat-label">Billed entries</div>
// //               <div className="report-stat-value">{billed.length}</div>
// //               <div className="report-stat-note">Product line entries</div>
// //             </div>
// //           </div>

// //           <button
// //             type="button"
// //             className="report-stat report-stat-link"
// //             onClick={scrollToStock}
// //             aria-label="Products in stock. Click to view the stock remaining table"
// //           >
// //             <div className="report-stat-icon green">
// //               <Package size={24} />
// //             </div>
// //             <div className="report-stat-content">
// //               <div className="report-stat-label">Products in stock</div>
// //               <div className="report-stat-value">{stock.length}</div>
// //               <div className="report-stat-note">
// //                 Products with remaining stock
// //               </div>
// //               <span className="report-stat-hint">
// //                 View stock <ChevronDown size={13} />
// //               </span>
// //             </div>
// //           </button>
// //         </div>

// //         <div className="report-tables">
// //           <section className="report-table-card">
// //             <div className="report-table-head">
// //               <div className="report-table-heading">
// //                 <div className="report-table-icon">
// //                   <FileText size={22} />
// //                 </div>
// //                 <div>
// //                   <h3>Billed Details</h3>
// //                   <p>
// //                     {isoLabel(applied.from)} – {isoLabel(applied.to)} · {productLabel}
// //                   </p>
// //                 </div>
// //               </div>

// //               <span className="report-count">
// //                 {billed.length} {billed.length === 1 ? 'entry' : 'entries'}
// //               </span>
// //             </div>

// //             <div className="report-table-scroll">
// //               <table className="report-table">
// //                 <thead>
// //                   <tr>
// //                     <th style={{ width: 65 }}>S.No</th>
// //                     <th>Voucher ID</th>
// //                     <th>Date</th>
// //                     <th>Product</th>
// //                     <th className="report-number">Billed Quantity</th>
// //                   </tr>
// //                 </thead>

// //                 <tbody>
// //                  {billed.map((r, i) => (
// //   <tr
// //     key={`${r.voucher_id}-${r.product_id}-${i}`}
// //     className="report-clickable-row"
// //     onClick={() => setOpenVoucherId(r.voucher_id)}
// //     onKeyDown={(e) => {
// //       if (e.key === 'Enter' || e.key === ' ') {
// //         e.preventDefault()
// //         setOpenVoucherId(r.voucher_id)
// //       }
// //     }}
// //     tabIndex={0}
// //     role="button"
// //     aria-label={`View voucher ${formatVoucher(r.voucher_number)}`}
// //     title="Click to view voucher details"
// //   >
// //     <td className="report-muted">{i + 1}</td>
// //     <td>
// //       <span className="report-voucher">
// //         {formatVoucher(r.voucher_number)}
// //       </span>
// //     </td>
// //     <td className="report-muted">{formatDate(r.voucher_date)}</td>
// //     <td className="report-product-name">{r.product_name}</td>
// //     <td className="report-number">
// //       <span className="report-qty">
// //         {formatQtyWithUnit(r.quantity, r.unit_name)}
// //       </span>
// //     </td>
// //   </tr>
// // ))}
// //                 </tbody>
// //               </table>
// //             </div>

// //             <div className="report-table-state">
// //               <TableState
// //                 loading={loading}
// //                 error={error}
// //                 empty={!loading && !error && billed.length === 0}
// //                 emptyText="No billings found for the selected filters."
// //                 onRetry={reload}
// //               />
// //             </div>
// //           </section>

// //           <section className="report-table-card stock-card" ref={stockRef}>
// //             <div className="report-table-head">
// //               <div className="report-table-heading">
// //                 <div className="report-table-icon stock">
// //                   <Package size={22} />
// //                 </div>
// //                 <div>
// //                   <h3>Stock Remaining</h3>
// //                   <p>Available stock as on {todayLabel}</p>
// //                 </div>
// //               </div>

// //               <span className="report-count">
// //                 {stock.length} {stock.length === 1 ? 'product' : 'products'}
// //               </span>
// //             </div>

// //             <div className="report-table-scroll">
// //               <table className="report-table" style={{ minWidth: 450 }}>
// //                 <thead>
// //                   <tr>
// //                     <th style={{ width: 65 }}>S.No</th>
// //                     <th>Product</th>
// //                     <th className="report-number">Remaining Quantity</th>
// //                   </tr>
// //                 </thead>

// //                 <tbody>
// //                   {stock.map((s, i) => (
// //                     <tr key={s.product_id}>
// //                       <td className="report-muted">{i + 1}</td>
// //                       <td className="report-product-name">{s.product_name}</td>
// //                       <td className="report-number">
// //                         <span className="report-qty">
// //                           {formatQtyWithUnit(
// //                             s.remaining_stock,
// //                             unitName[s.unit_id],
// //                           )}
// //                         </span>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>

// //             <div className="report-table-state">
// //               <TableState
// //                 loading={loading}
// //                 error={error}
// //                 empty={!loading && !error && stock.length === 0}
// //                 emptyText="No stock to show."
// //                 onRetry={reload}
// //               />
// //             </div>
// //           </section>
// //         </div>

// //         {openVoucher && (
// //           <VoucherCard
// //             key={openVoucher.voucher_id}
// //             voucher={openVoucher}
// //             onClose={() => setOpenVoucherId(null)}
// //             onSaved={reload}
// //           />
// //         )}
// //       </div>
// //     </>
// //   )
// // }








// // import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// // import {
// //   Download,
// //   RotateCcw,
// //   Search,
// //   SlidersHorizontal,
// //   X,
// //   Receipt,
// //   FileText,
// //   Package,
// //   Pencil,
// //   Printer,
// //   Save,
// //   ChevronDown,
// //   ChevronUp,
// // } from 'lucide-react'

// // import TableState from '../components/TableState'
// // import useAsyncData from '../hooks/useAsyncData'
// // import useToast from '../hooks/useToast'
// // import { getVoucherDetails } from '../services/reportsService'
// // import { updateVoucher } from '../services/vouchersService'
// // import { getStock } from '../services/stockService'
// // import { getProducts } from '../services/productsService'
// // import { getUnits } from '../services/unitsService'
// // import { getErrorMessage } from '../services/api'
// // import { QUICK_RANGES, getRange } from '../utils/dateRanges'
// // import { formatDate, formatQtyWithUnit, formatVoucher } from '../utils/format'
// // import {
// //   PAPER_SIZES,
// //   downloadVoucherPdf,
// //   getPaperSize,
// //   setPaperSize,
// //   totalsByUnit,
// // } from '../utils/voucherPdf'

// // const loadLookups = () => Promise.all([getProducts(), getUnits()])

// // const initialFilters = () => ({
// //   range: 'today',
// //   ...getRange('today'),
// //   productId: '',
// // })

// // const isoLabel = (iso) => (iso ? formatDate(`${iso}T00:00:00`) : '')

// // const toInputDate = (d) => (d ? String(d).slice(0, 10) : '')

// // const lineTotals = (lines) =>
// //   totalsByUnit(lines.map((l) => ({ quantity: l.quantity, unit: l.unit_name })))

// // const itemsLabel = (lines) => {
// //   const names = lines.map((l) => l.product_name)
// //   const head = names.slice(0, 2).join(', ')
// //   return names.length > 2 ? `${head} +${names.length - 2} more` : head
// // }

// // function csvCell(value) {
// //   const s = String(value ?? '')
// //   return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
// // }

// // /* ------------------------------------------------------------------ */
// // /* Voucher details / edit / print card                                 */
// // /* voucher: { voucher_id, voucher_number, voucher_date, lines: [...] } */
// // /* ------------------------------------------------------------------ */
// // function VoucherCard({ voucher, onClose, onSaved }) {
// //   const toast = useToast()
// //   const [editing, setEditing] = useState(false)
// //   const [saving, setSaving] = useState(false)
// //   const [printing, setPrinting] = useState(false)
// //   const [paper, setPaper] = useState(getPaperSize)
// //   const [date, setDate] = useState(toInputDate(voucher.voucher_date))
// //   const [qty, setQty] = useState(() =>
// //     voucher.lines.map((l) => String(l.quantity)),
// //   )

// //   const busy = saving || printing

// //   useEffect(() => {
// //     const onKey = (e) => {
// //       if (e.key === 'Escape' && !busy) onClose()
// //     }
// //     window.addEventListener('keydown', onKey)
// //     return () => window.removeEventListener('keydown', onKey)
// //   }, [onClose, busy])

// //   const cancelEdit = () => {
// //     setDate(toInputDate(voucher.voucher_date))
// //     setQty(voucher.lines.map((l) => String(l.quantity)))
// //     setEditing(false)
// //   }

// //   const save = async () => {
// //     if (!date) return toast.error('Voucher date is required.')

// //     if (
// //       qty.some((q) => q === '' || Number.isNaN(Number(q)) || Number(q) <= 0)
// //     ) {
// //       return toast.error('Every quantity must be greater than zero.')
// //     }

// //     setSaving(true)

// //     try {
// //       await updateVoucher(voucher.voucher_id, {
// //         voucher_date: date,
// //         items: voucher.lines.map((l, i) => ({
// //           product_id: l.product_id,
// //           quantity: Number(qty[i]),
// //         })),
// //       })

// //       toast.success('Voucher updated.')
// //       onSaved?.()
// //       onClose()
// //     } catch (err) {
// //       toast.error(getErrorMessage(err) || 'Could not update the voucher.')
// //     } finally {
// //       setSaving(false)
// //     }
// //   }

// //   const print = async () => {
// //     setPrinting(true)
// //     try {
// //       await downloadVoucherPdf({
// //         voucherNumber: voucher.voucher_number,
// //         date: voucher.voucher_date,
// //         items: voucher.lines.map((l) => ({
// //           name: l.product_name,
// //           quantity: Number(l.quantity),
// //           unit: l.unit_name,
// //         })),
// //         paper,
// //       })
// //     } catch (err) {
// //       toast.error(err?.message || 'Could not create the PDF.')
// //     } finally {
// //       setPrinting(false)
// //     }
// //   }

// //   const changePaper = (value) => {
// //     setPaper(value)
// //     setPaperSize(value)
// //   }

// //   const liveTotals = totalsByUnit(
// //     voucher.lines.map((l, i) => ({
// //       quantity: editing ? Number(qty[i]) || 0 : l.quantity,
// //       unit: l.unit_name,
// //     })),
// //   )

// //   return (
// //     <div
// //       className="vm-backdrop"
// //       onMouseDown={(e) => {
// //         if (e.target === e.currentTarget && !busy) onClose()
// //       }}
// //     >
// //       <div
// //         className="vm-card"
// //         role="dialog"
// //         aria-modal="true"
// //         aria-label="Voucher details"
// //       >
// //         <div className="vm-head">
// //           <div className="vm-title">
// //             <div className="vm-icon">
// //               <Receipt size={20} />
// //             </div>
// //             <div>
// //               <h3>Voucher {formatVoucher(voucher.voucher_number)}</h3>
// //               <p>{editing ? 'Editing voucher' : 'Voucher details'}</p>
// //             </div>
// //           </div>

// //           <button
// //             type="button"
// //             className="vm-close"
// //             onClick={onClose}
// //             aria-label="Close"
// //             disabled={busy}
// //           >
// //             <X size={18} />
// //           </button>
// //         </div>

// //         <div className="vm-body">
// //           <div className="vm-meta">
// //             <div>
// //               <span className="vm-label">Voucher ID</span>
// //               <div className="vm-value">
// //                 {formatVoucher(voucher.voucher_number)}
// //               </div>
// //             </div>

// //             <div>
// //               <label className="vm-label" htmlFor="vm-date">
// //                 Date
// //               </label>
// //               {editing ? (
// //                 <input
// //                   id="vm-date"
// //                   type="date"
// //                   className="vm-input"
// //                   value={date}
// //                   onChange={(e) => setDate(e.target.value)}
// //                 />
// //               ) : (
// //                 <div className="vm-value">{formatDate(voucher.voucher_date)}</div>
// //               )}
// //             </div>
// //           </div>

// //           <div className="vm-lines">
// //             <div className="vm-line vm-line-head">
// //               <span>Product</span>
// //               <span style={{ textAlign: 'right' }}>Billed Quantity</span>
// //             </div>

// //             {voucher.lines.map((l, i) => (
// //               <div className="vm-line" key={`${l.product_id}-${i}`}>
// //                 <b>{l.product_name}</b>

// //                 {editing ? (
// //                   <div className="vm-qty-wrap">
// //                     <input
// //                       type="number"
// //                       min="0"
// //                       step="any"
// //                       className="vm-input"
// //                       value={qty[i]}
// //                       aria-label={`Quantity for ${l.product_name}`}
// //                       onChange={(e) =>
// //                         setQty((q) =>
// //                           q.map((v, j) => (j === i ? e.target.value : v)),
// //                         )
// //                       }
// //                     />
// //                     <span className="vm-unit">{l.unit_name}</span>
// //                   </div>
// //                 ) : (
// //                   <span style={{ textAlign: 'right', fontWeight: 700 }}>
// //                     {formatQtyWithUnit(l.quantity, l.unit_name)}
// //                   </span>
// //                 )}
// //               </div>
// //             ))}

// //             <div className="vm-line vm-line-total">
// //               <b>Total</b>
// //               <span style={{ textAlign: 'right', fontWeight: 750 }}>
// //                 {liveTotals.join(' + ')}
// //               </span>
// //             </div>
// //           </div>
// //         </div>

// //         <div className="vm-foot">
// //           {editing ? (
// //             <>
// //               <button
// //                 type="button"
// //                 className="vm-btn"
// //                 onClick={cancelEdit}
// //                 disabled={saving}
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 type="button"
// //                 className="vm-btn primary"
// //                 onClick={save}
// //                 disabled={saving}
// //               >
// //                 <Save size={15} />
// //                 {saving ? 'Saving…' : 'Update'}
// //               </button>
// //             </>
// //           ) : (
// //             <>
// //               <div className="vm-print">
// //                 <select
// //                   className="vm-select"
// //                   value={paper}
// //                   onChange={(e) => changePaper(e.target.value)}
// //                   aria-label="Paper size"
// //                   disabled={printing}
// //                 >
// //                   {Object.entries(PAPER_SIZES).map(([key, p]) => (
// //                     <option key={key} value={key}>
// //                       {p.label}
// //                     </option>
// //                   ))}
// //                 </select>
// //                 <button
// //                   type="button"
// //                   className="vm-btn"
// //                   onClick={print}
// //                   disabled={printing}
// //                 >
// //                   <Printer size={15} />
// //                   {printing ? 'Preparing…' : 'Print voucher'}
// //                 </button>
// //               </div>

// //               <button type="button" className="vm-btn" onClick={onClose}>
// //                 Close
// //               </button>
// //               <button
// //                 type="button"
// //                 className="vm-btn primary"
// //                 onClick={() => setEditing(true)}
// //               >
// //                 <Pencil size={15} />
// //                 Edit
// //               </button>
// //             </>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }

// // export default function Reports() {
// //   const toast = useToast()

// //   const [draft, setDraft] = useState(initialFilters)
// //   const [applied, setApplied] = useState(initialFilters)
// //   const [filtersOpen, setFiltersOpen] = useState(false)
// //   const [openVoucherId, setOpenVoucherId] = useState(null)
// //   const stockRef = useRef(null)

// //   const { data: lookups } = useAsyncData(loadLookups)
// //   const [products, units] = lookups ?? [[], []]

// //   const unitName = useMemo(
// //     () => Object.fromEntries(units.map((u) => [u.id, u.unit_name])),
// //     [units],
// //   )

// //   // Load every line of every voucher in the period. The product filter is applied
// //   // below, so a voucher always keeps ALL its lines (needed for edit and print).
// //   const loadReport = useCallback(
// //     () =>
// //       Promise.all([
// //         getVoucherDetails({
// //           startDate: applied.from,
// //           endDate: applied.to,
// //         }),
// //         getStock(),
// //       ]),
// //     [applied.from, applied.to],
// //   )

// //   const { data, loading, error, reload } = useAsyncData(loadReport)

// //   const [billed, stockAll] = data ?? [[], []]

// //   const stock = useMemo(
// //     () =>
// //       stockAll
// //         .filter(
// //           (s) =>
// //             !applied.productId ||
// //             String(s.product_id) === String(applied.productId),
// //         )
// //         .filter((s) => Number(s.remaining_stock) > 0),
// //     [stockAll, applied.productId],
// //   )

// //   // One entry per voucher, with all its lines.
// //   const vouchers = useMemo(() => {
// //     const map = new Map()

// //     billed.forEach((r) => {
// //       if (!map.has(r.voucher_id)) {
// //         map.set(r.voucher_id, {
// //           voucher_id: r.voucher_id,
// //           voucher_number: r.voucher_number,
// //           voucher_date: r.voucher_date,
// //           lines: [],
// //         })
// //       }
// //       map.get(r.voucher_id).lines.push(r)
// //     })

// //     return [...map.values()]
// //   }, [billed])

// //   // Product filter: vouchers that contain the chosen product.
// //   const shownVouchers = useMemo(
// //     () =>
// //       !applied.productId
// //         ? vouchers
// //         : vouchers.filter((v) =>
// //             v.lines.some(
// //               (l) => String(l.product_id) === String(applied.productId),
// //             ),
// //           ),
// //     [vouchers, applied.productId],
// //   )

// //   const shownLines = useMemo(
// //     () => shownVouchers.flatMap((v) => v.lines),
// //     [shownVouchers],
// //   )

// //   const productLabel = applied.productId
// //     ? (() => {
// //         const p = products.find((x) => String(x.id) === String(applied.productId))
// //         return p
// //           ? `${p.product_name} (${unitName[p.unit_id] ?? ''})`
// //           : 'Selected product'
// //       })()
// //     : 'All products'

// //   const openVoucher = useMemo(
// //     () =>
// //       openVoucherId == null
// //         ? null
// //         : vouchers.find((v) => v.voucher_id === openVoucherId) ?? null,
// //     [vouchers, openVoucherId],
// //   )

// //   const pickRange = (key) => {
// //     if (key === 'custom') {
// //       setDraft((d) => ({ ...d, range: 'custom' }))
// //       return
// //     }

// //     const next = {
// //       ...draft,
// //       range: key,
// //       ...getRange(key),
// //     }

// //     setDraft(next)
// //     setApplied(next)
// //   }

// //   const pickProduct = (productId) => {
// //     setDraft((d) => ({ ...d, productId }))
// //   }

// //   const generate = () => {
// //     if (!draft.from || !draft.to) {
// //       return toast.error('Choose both a start and end date.')
// //     }

// //     if (draft.from > draft.to) {
// //       return toast.error('Start date cannot be later than end date.')
// //     }

// //     setApplied(draft)
// //     setFiltersOpen(false)
// //   }

// //   const reset = () => {
// //     const fresh = initialFilters()
// //     setDraft(fresh)
// //     setApplied(fresh)
// //   }

// //   const exportCsv = () => {
// //     if (!shownLines.length && !stock.length) {
// //       return toast.info('There is no data to export.')
// //     }

// //     const lines = [
// //       `Mothys Inventory Report`,
// //       `Period,${applied.from} to ${applied.to}`,
// //       `Product,${csvCell(productLabel)}`,
// //       '',
// //       'Billed Details',
// //       'S.No,Voucher,Voucher Date,Product,Unit,Billed Quantity',
// //       ...shownLines.map((r, i) =>
// //         [
// //           i + 1,
// //           formatVoucher(r.voucher_number),
// //           formatDate(r.voucher_date),
// //           r.product_name,
// //           r.unit_name,
// //           Number(r.quantity),
// //         ]
// //           .map(csvCell)
// //           .join(','),
// //       ),
// //       '',
// //       `Stock Remaining,As on ${formatDate(new Date())}`,
// //       'S.No,Product,Unit,Remaining Quantity',
// //       ...stock.map((s, i) =>
// //         [
// //           i + 1,
// //           s.product_name,
// //           unitName[s.unit_id] ?? '',
// //           Number(s.remaining_stock),
// //         ]
// //           .map(csvCell)
// //           .join(','),
// //       ),
// //     ]

// //     const blob = new Blob(['\uFEFF' + lines.join('\n')], {
// //       type: 'text/csv;charset=utf-8',
// //     })

// //     const url = URL.createObjectURL(blob)
// //     const a = document.createElement('a')

// //     a.href = url
// //     a.download = `mothys-report-${applied.from}-to-${applied.to}.csv`
// //     a.click()

// //     URL.revokeObjectURL(url)
// //   }

// //   const scrollToStock = () =>
// //     stockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// //   const custom = draft.range === 'custom'
// //   const todayLabel = formatDate(new Date())

// //   return (
// //     <>
// //       <style>{`
// //         .reports-page {
// //           width: 100%;
// //           color: var(--text, #17233f);
// //         }

// //         .reports-page * {
// //           box-sizing: border-box;
// //         }

// //         .reports-heading {
// //           display: flex;
// //           justify-content: space-between;
// //           align-items: center;
// //           gap: 16px;
// //           flex-wrap: wrap;
// //           margin-bottom: 24px;
// //         }

// //         .reports-heading h1 {
// //           margin: 0;
// //           font-size: 28px;
// //           font-weight: 750;
// //           letter-spacing: -0.7px;
// //           color: #17233f;
// //         }

// //         .reports-subtitle {
// //           margin: 7px 0 0;
// //           color: #64748b;
// //           font-size: 13px;
// //         }

// //         .reports-actions {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //         }

// //         .reports-page .report-btn {
// //           min-height: 44px;
// //           display: inline-flex;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 9px;
// //           padding: 0 18px;
// //           border-radius: 10px;
// //           font-size: 13px;
// //           font-weight: 650;
// //           cursor: pointer;
// //           transition: .2s ease;
// //         }

// //         .reports-page .report-filter-btn {
// //           background: #fff;
// //           color: #1e3155;
// //           border: 1px solid #d7dfeb;
// //         }

// //         .reports-page .report-filter-btn:hover {
// //           border-color: #2563eb;
// //           color: #2563eb;
// //           background: #f8faff;
// //         }

// //         .reports-page .report-export-btn,
// //         .reports-page .report-generate-btn {
// //           background: #2458db;
// //           color: #fff;
// //           border: 1px solid #2458db;
// //           box-shadow: 0 3px 8px rgba(36, 88, 219, .15);
// //         }

// //         .reports-page .report-export-btn:hover,
// //         .reports-page .report-generate-btn:hover {
// //           background: #1747c2;
// //           border-color: #1747c2;
// //           transform: translateY(-1px);
// //         }

// //         .reports-page .report-export-btn:disabled {
// //           opacity: .55;
// //           cursor: not-allowed;
// //           transform: none;
// //         }

// //         .report-filter-panel {
// //           background: #fff;
// //           border: 1px solid #dce3ee;
// //           border-radius: 15px;
// //           padding: 23px 24px;
// //           margin-bottom: 24px;
// //           box-shadow: 0 5px 18px rgba(22, 39, 72, .045);
// //           animation: reportSlide .18s ease;
// //         }

// //         @keyframes reportSlide {
// //           from { opacity: 0; transform: translateY(-5px); }
// //           to { opacity: 1; transform: translateY(0); }
// //         }

// //         .report-filter-title {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 12px;
// //           margin-bottom: 22px;
// //         }

// //         .report-filter-title h3 {
// //           margin: 0;
// //           color: #1c2b49;
// //           font-size: 16px;
// //           font-weight: 750;
// //         }

// //         .report-filter-title p {
// //           margin: 5px 0 0;
// //           font-size: 12px;
// //           color: #71809a;
// //         }

// //         .report-close {
// //           width: 34px;
// //           height: 34px;
// //           display: grid;
// //           place-items: center;
// //           border: 0;
// //           border-radius: 9px;
// //           background: #f1f5fa;
// //           color: #52627e;
// //           cursor: pointer;
// //         }

// //         .report-close:hover {
// //           background: #e5edfa;
// //           color: #2458db;
// //         }

// //         .report-field-label {
// //           display: block;
// //           margin-bottom: 9px;
// //           font-size: 12px;
// //           font-weight: 700;
// //           color: #52627e;
// //         }

// //         .report-quick-ranges {
// //           display: flex;
// //           flex-wrap: wrap;
// //           gap: 8px;
// //           margin-bottom: 21px;
// //         }

// //         .report-quick-ranges button {
// //           min-height: 37px;
// //           padding: 0 15px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 8px;
// //           background: #fff;
// //           color: #53627c;
// //           font-size: 12px;
// //           font-weight: 600;
// //           cursor: pointer;
// //           transition: .18s ease;
// //         }

// //         .report-quick-ranges button:hover {
// //           border-color: #8eabed;
// //           color: #2458db;
// //           background: #f7f9ff;
// //         }

// //         .report-quick-ranges button.active {
// //           border-color: #2458db;
// //           background: #edf3ff;
// //           color: #2458db;
// //           box-shadow: inset 0 0 0 1px #2458db;
// //         }

// //         .report-filter-fields {
// //           display: grid;
// //           grid-template-columns: repeat(3, minmax(0, 1fr));
// //           gap: 18px;
// //         }

// //         .report-filter-fields input,
// //         .report-filter-fields select {
// //           width: 100%;
// //           height: 44px;
// //           padding: 0 12px;
// //           border: 1px solid #d9e1ed;
// //           border-radius: 9px;
// //           outline: none;
// //           background: #fff;
// //           color: #253653;
// //           font-size: 13px;
// //         }

// //         .report-filter-fields input:focus,
// //         .report-filter-fields select:focus {
// //           border-color: #3972ed;
// //           box-shadow: 0 0 0 3px rgba(57, 114, 237, .10);
// //         }

// //         .report-filter-fields input:disabled {
// //           background: #f4f6fa;
// //           color: #9aa6b8;
// //           cursor: not-allowed;
// //         }

// //         .report-filter-footer {
// //           display: flex;
// //           align-items: center;
// //           justify-content: flex-end;
// //           gap: 10px;
// //           border-top: 1px solid #edf0f5;
// //           margin-top: 22px;
// //           padding-top: 17px;
// //         }

// //         .report-reset-btn {
// //           min-height: 40px;
// //           padding: 0 15px;
// //           display: inline-flex;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 7px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 9px;
// //           background: #fff;
// //           color: #52627e;
// //           font-size: 12px;
// //           font-weight: 650;
// //           cursor: pointer;
// //         }

// //         .report-reset-btn:hover {
// //           background: #f6f8fc;
// //           color: #2458db;
// //         }

// //         .report-generate-btn {
// //           min-height: 40px !important;
// //           padding: 0 17px !important;
// //           border-radius: 9px !important;
// //           font-size: 12px !important;
// //         }

// //         .report-summary-grid {
// //           display: grid;
// //           grid-template-columns: repeat(3, minmax(0, 1fr));
// //           gap: 20px;
// //           margin-bottom: 24px;
// //         }

// //         .report-stat {
// //           min-width: 0;
// //           min-height: 145px;
// //           display: flex;
// //           align-items: flex-start;
// //           gap: 15px;
// //           padding: 22px 20px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 14px;
// //           background: #fff;
// //           box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
// //         }

// //         .report-stat-link {
// //           width: 100%;
// //           font: inherit;
// //           color: inherit;
// //           text-align: left;
// //           cursor: pointer;
// //           transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
// //         }

// //         .report-stat-link:hover {
// //           border-color: #2458db;
// //           box-shadow: 0 8px 22px rgba(36, 88, 219, .12);
// //           transform: translateY(-2px);
// //         }

// //         .report-stat-link:focus-visible {
// //           outline: 3px solid rgba(36, 88, 219, .35);
// //           outline-offset: 2px;
// //         }

// //         .report-stat-hint {
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 4px;
// //           margin-top: 8px;
// //           color: #2458db;
// //           font-size: 11px;
// //           font-weight: 700;
// //         }

// //         .report-table-card.stock-card {
// //           scroll-margin-top: 16px;
// //         }

// //         .report-stat-icon {
// //           flex: 0 0 52px;
// //           width: 52px;
// //           height: 52px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 13px;
// //         }

// //         .report-stat-icon.blue {
// //           background: #eaf0ff;
// //           color: #2861e9;
// //         }

// //         .report-stat-icon.purple {
// //           background: #f1eaff;
// //           color: #8b42f6;
// //         }

// //         .report-stat-icon.orange {
// //           background: #fff2e6;
// //           color: #ec850d;
// //         }

// //         .report-stat-icon.green {
// //           background: #e7f7ee;
// //           color: #0caa58;
// //         }

// //         .report-stat-content {
// //           min-width: 0;
// //         }

// //         .report-stat-label {
// //           color: #64718a;
// //           font-size: 12px;
// //           font-weight: 650;
// //           line-height: 1.5;
// //         }

// //         .report-stat-value {
// //           margin-top: 5px;
// //           color: #1b2947;
// //           font-size: 29px;
// //           font-weight: 780;
// //           line-height: 1.15;
// //           letter-spacing: -.6px;
// //         }

// //         .report-stat-note {
// //           margin-top: 8px;
// //           color: #74819a;
// //           font-size: 11px;
// //           line-height: 1.5;
// //         }

// //         .report-tables {
// //           display: grid;
// //           grid-template-columns: 1fr;
// //           gap: 22px;
// //         }

// //         .report-table-card {
// //           min-width: 0;
// //           overflow: hidden;
// //           border: 1px solid #dce3ed;
// //           border-radius: 14px;
// //           background: #fff;
// //           box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
// //         }

// //         .report-table-head {
// //           min-height: 82px;
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 14px;
// //           padding: 17px 22px;
// //           border-bottom: 1px solid #e5eaf1;
// //         }

// //         .report-table-heading {
// //           display: flex;
// //           align-items: center;
// //           gap: 13px;
// //           min-width: 0;
// //         }

// //         .report-table-icon {
// //           flex: 0 0 44px;
// //           width: 44px;
// //           height: 44px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 11px;
// //           background: #edf2ff;
// //           color: #2861e9;
// //         }

// //         .report-table-icon.stock {
// //           background: #e9f8ef;
// //           color: #0ba65a;
// //         }

// //         .report-table-heading h3 {
// //           margin: 0;
// //           color: #1b2947;
// //           font-size: 15px;
// //           font-weight: 750;
// //         }

// //         .report-table-heading p {
// //           margin: 5px 0 0;
// //           color: #71809a;
// //           font-size: 11px;
// //         }

// //         .report-count {
// //           flex: 0 0 auto;
// //           padding: 7px 12px;
// //           border-radius: 20px;
// //           background: #f0f4fa;
// //           color: #52627e;
// //           font-size: 11px;
// //           font-weight: 700;
// //         }

// //         .report-table-scroll {
// //           width: 100%;
// //           overflow-x: auto;
// //         }

// //         .report-table {
// //           width: 100%;
// //           min-width: 620px;
// //           border-collapse: collapse;
// //           text-align: left;
// //         }

// //         .report-table th {
// //           padding: 14px 18px;
// //           background: #f7f9fc;
// //           color: #65748e;
// //           font-size: 10px;
// //           font-weight: 750;
// //           letter-spacing: .55px;
// //           text-transform: uppercase;
// //           white-space: nowrap;
// //         }

// //         .report-table td {
// //           padding: 15px 18px;
// //           border-top: 1px solid #edf0f5;
// //           color: #293955;
// //           font-size: 12px;
// //           font-weight: 500;
// //           white-space: nowrap;
// //         }

// //         .report-table tbody tr {
// //           transition: background .15s ease;
// //         }

// //         .report-table tbody tr:hover {
// //           background: #f8faff;
// //         }

// //         .report-table .report-muted {
// //           color: #8290a6;
// //         }

// //         .report-voucher {
// //           display: inline-flex;
// //           align-items: center;
// //           padding: 6px 10px;
// //           border: 1px solid #dce6ff;
// //           border-radius: 7px;
// //           background: #f1f5ff;
// //           color: #2458c7;
// //           font-size: 11px;
// //           font-weight: 750;
// //         }

// //         .report-items {
// //           display: inline-block;
// //           max-width: 320px;
// //           overflow: hidden;
// //           text-overflow: ellipsis;
// //           vertical-align: middle;
// //         }

// //         .report-product-name {
// //           color: #1d2c49 !important;
// //           font-weight: 700 !important;
// //         }

// //         .report-qty {
// //           display: inline-flex;
// //           justify-content: flex-end;
// //           min-width: 76px;
// //           padding: 7px 11px;
// //           border-radius: 7px;
// //           background: #f0f4fb;
// //           color: #243958;
// //           font-weight: 750;
// //         }

// //         .report-number {
// //           text-align: right !important;
// //         }

// //         .report-table-state {
// //           padding: 4px 18px 18px;
// //         }

// //         .report-clickable-row {
// //           cursor: pointer;
// //           transition: background .15s ease;
// //         }

// //         .report-clickable-row:hover {
// //           background: #edf3ff !important;
// //         }

// //         .report-clickable-row:focus-visible {
// //           outline: 2px solid #2458db;
// //           outline-offset: -2px;
// //         }

// //         /* ---------- Voucher card (modal) ---------- */
// //         .vm-backdrop {
// //           position: fixed;
// //           inset: 0;
// //           z-index: 1000;
// //           display: grid;
// //           place-items: center;
// //           padding: 16px;
// //           background: rgba(15, 23, 42, .45);
// //           animation: vmFade .15s ease;
// //         }

// //         @keyframes vmFade {
// //           from { opacity: 0; }
// //           to { opacity: 1; }
// //         }

// //         .vm-card {
// //           width: 100%;
// //           max-width: 560px;
// //           max-height: 90vh;
// //           display: flex;
// //           flex-direction: column;
// //           background: #fff;
// //           border-radius: 16px;
// //           overflow: hidden;
// //           box-shadow: 0 20px 50px rgba(15, 23, 42, .25);
// //         }

// //         .vm-head {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 12px;
// //           padding: 18px 22px;
// //           border-bottom: 1px solid #e5eaf1;
// //         }

// //         .vm-title {
// //           display: flex;
// //           align-items: center;
// //           gap: 12px;
// //           min-width: 0;
// //         }

// //         .vm-icon {
// //           flex: 0 0 42px;
// //           width: 42px;
// //           height: 42px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 11px;
// //           background: #edf2ff;
// //           color: #2861e9;
// //         }

// //         .vm-title h3 {
// //           margin: 0;
// //           font-size: 16px;
// //           font-weight: 750;
// //           color: #1b2947;
// //         }

// //         .vm-title p {
// //           margin: 4px 0 0;
// //           font-size: 12px;
// //           color: #71809a;
// //         }

// //         .vm-close {
// //           width: 34px;
// //           height: 34px;
// //           display: grid;
// //           place-items: center;
// //           border: 0;
// //           border-radius: 9px;
// //           background: #f1f5fa;
// //           color: #52627e;
// //           cursor: pointer;
// //         }

// //         .vm-close:hover {
// //           background: #e5edfa;
// //           color: #2458db;
// //         }

// //         .vm-body {
// //           padding: 20px 22px;
// //           overflow-y: auto;
// //         }

// //         .vm-label {
// //           display: block;
// //           margin-bottom: 8px;
// //           font-size: 12px;
// //           font-weight: 700;
// //           color: #52627e;
// //         }

// //         .vm-input {
// //           width: 100%;
// //           height: 42px;
// //           padding: 0 12px;
// //           border: 1px solid #d9e1ed;
// //           border-radius: 9px;
// //           font-size: 13px;
// //           color: #253653;
// //           background: #fff;
// //           outline: none;
// //         }

// //         .vm-input:focus {
// //           border-color: #3972ed;
// //           box-shadow: 0 0 0 3px rgba(57, 114, 237, .1);
// //         }

// //         .vm-meta {
// //           display: grid;
// //           grid-template-columns: 1fr 1fr;
// //           gap: 16px;
// //           margin-bottom: 20px;
// //         }

// //         .vm-value {
// //           font-size: 14px;
// //           font-weight: 700;
// //           color: #1b2947;
// //         }

// //         .vm-lines {
// //           border: 1px solid #e5eaf1;
// //           border-radius: 12px;
// //           overflow: hidden;
// //         }

// //         .vm-line {
// //           display: grid;
// //           grid-template-columns: 1fr 150px;
// //           align-items: center;
// //           gap: 12px;
// //           padding: 12px 16px;
// //           border-top: 1px solid #edf0f5;
// //           font-size: 13px;
// //           color: #293955;
// //         }

// //         .vm-line:first-child {
// //           border-top: 0;
// //         }

// //         .vm-line-head {
// //           background: #f7f9fc;
// //           color: #65748e;
// //           font-size: 10px;
// //           font-weight: 750;
// //           letter-spacing: .55px;
// //           text-transform: uppercase;
// //         }

// //         .vm-line-total {
// //           background: #f7f9fc;
// //         }

// //         .vm-line b {
// //           font-weight: 700;
// //           color: #1d2c49;
// //         }

// //         .vm-qty-wrap {
// //           display: flex;
// //           align-items: center;
// //           gap: 8px;
// //           justify-content: flex-end;
// //         }

// //         .vm-qty-wrap .vm-input {
// //           height: 36px;
// //           text-align: right;
// //         }

// //         .vm-unit {
// //           font-size: 12px;
// //           color: #71809a;
// //           white-space: nowrap;
// //         }

// //         .vm-foot {
// //           display: flex;
// //           flex-wrap: wrap;
// //           justify-content: flex-end;
// //           align-items: center;
// //           gap: 10px;
// //           padding: 14px 22px;
// //           border-top: 1px solid #e5eaf1;
// //         }

// //         .vm-print {
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 8px;
// //           margin-right: auto;
// //         }

// //         .vm-select {
// //           height: 40px;
// //           padding: 0 8px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 9px;
// //           background: #fff;
// //           color: #253653;
// //           font-size: 13px;
// //           font-weight: 600;
// //         }

// //         .vm-btn {
// //           min-height: 40px;
// //           padding: 0 18px;
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 8px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 9px;
// //           background: #fff;
// //           color: #52627e;
// //           font-size: 13px;
// //           font-weight: 650;
// //           cursor: pointer;
// //         }

// //         .vm-btn:hover {
// //           background: #f6f8fc;
// //           color: #2458db;
// //         }

// //         .vm-btn.primary {
// //           background: #2458db;
// //           border-color: #2458db;
// //           color: #fff;
// //         }

// //         .vm-btn.primary:hover {
// //           background: #1747c2;
// //         }

// //         .vm-btn:disabled {
// //           opacity: .6;
// //           cursor: not-allowed;
// //         }

// //         @media (max-width: 1100px) {
// //           .report-summary-grid {
// //             gap: 14px;
// //           }

// //           .report-stat {
// //             padding: 18px 16px;
// //             gap: 12px;
// //           }
// //         }

// //         @media (max-width: 700px) {
// //           .reports-heading {
// //             align-items: flex-start;
// //           }

// //           .reports-actions {
// //             width: 100%;
// //           }

// //           .reports-actions .report-btn {
// //             flex: 1;
// //             padding: 0 10px;
// //           }

// //           .report-filter-panel {
// //             padding: 17px;
// //           }

// //           .report-filter-fields {
// //             grid-template-columns: 1fr;
// //             gap: 14px;
// //           }

// //           .report-summary-grid {
// //             grid-template-columns: 1fr;
// //             gap: 12px;
// //           }

// //           .report-stat {
// //             min-height: 0;
// //             padding: 16px 14px;
// //             gap: 12px;
// //           }

// //           .report-stat-icon {
// //             width: 39px;
// //             height: 39px;
// //             flex-basis: 39px;
// //           }

// //           .report-stat-value {
// //             font-size: 24px;
// //           }

// //           .report-table-head {
// //             padding: 14px;
// //           }

// //           .report-filter-footer {
// //             flex-wrap: wrap;
// //           }

// //           .vm-meta {
// //             grid-template-columns: 1fr;
// //           }

// //           .vm-line {
// //             grid-template-columns: 1fr;
// //             gap: 8px;
// //           }

// //           .vm-qty-wrap {
// //             justify-content: flex-start;
// //           }

// //           .vm-print {
// //             width: 100%;
// //             margin-right: 0;
// //           }

// //           .vm-print .vm-btn {
// //             flex: 1;
// //             justify-content: center;
// //           }
// //         }
// //       `}</style>

// //       <div className="reports-page">
// //         <div className="reports-heading">
// //           <div>
// //             <h1>Reports</h1>
// //             <p className="reports-subtitle">
// //               Business overview · {isoLabel(applied.from)} to {isoLabel(applied.to)}
// //             </p>
// //           </div>

// //           <div className="reports-actions">
// //             <button
// //               type="button"
// //               className="report-btn report-filter-btn"
// //               onClick={() => setFiltersOpen((open) => !open)}
// //               aria-expanded={filtersOpen}
// //             >
// //               <SlidersHorizontal size={16} />
// //               Filters
// //               {filtersOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
// //             </button>

// //             <button
// //               type="button"
// //               className="report-btn report-export-btn"
// //               onClick={exportCsv}
// //               disabled={loading || Boolean(error)}
// //             >
// //               <Download size={16} />
// //               Export CSV
// //             </button>
// //           </div>
// //         </div>

// //         {filtersOpen && (
// //           <section className="report-filter-panel">
// //             <div className="report-filter-title">
// //               <div>
// //                 <h3>Report filters</h3>
// //                 <p>Choose a period and product to view your report</p>
// //               </div>

// //               <button
// //                 type="button"
// //                 className="report-close"
// //                 onClick={() => setFiltersOpen(false)}
// //                 aria-label="Close filters"
// //               >
// //                 <X size={18} />
// //               </button>
// //             </div>

// //             <div>
// //               <span className="report-field-label">Quick period</span>

// //               <div className="report-quick-ranges">
// //                 {QUICK_RANGES.map((r) => (
// //                   <button
// //                     key={r.key}
// //                     type="button"
// //                     className={draft.range === r.key ? 'active' : ''}
// //                     onClick={() => pickRange(r.key)}
// //                   >
// //                     {r.label}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="report-filter-fields">
// //               <div>
// //                 <label className="report-field-label" htmlFor="r-from">
// //                   From date
// //                 </label>
// //                 <input
// //                   id="r-from"
// //                   type="date"
// //                   value={draft.from}
// //                   disabled={!custom}
// //                   onChange={(e) =>
// //                     setDraft((d) => ({ ...d, from: e.target.value }))
// //                   }
// //                 />
// //               </div>

// //               <div>
// //                 <label className="report-field-label" htmlFor="r-to">
// //                   To date
// //                 </label>
// //                 <input
// //                   id="r-to"
// //                   type="date"
// //                   value={draft.to}
// //                   disabled={!custom}
// //                   onChange={(e) =>
// //                     setDraft((d) => ({ ...d, to: e.target.value }))
// //                   }
// //                 />
// //               </div>

// //               <div>
// //                 <label className="report-field-label" htmlFor="r-product">
// //                   Product
// //                 </label>
// //                 <select
// //                   id="r-product"
// //                   value={draft.productId}
// //                   onChange={(e) => pickProduct(e.target.value)}
// //                 >
// //                   <option value="">All products</option>
// //                   {products.map((p) => (
// //                     <option key={p.id} value={p.id}>
// //                       {p.product_name} ({unitName[p.unit_id] ?? '—'})
// //                     </option>
// //                   ))}
// //                 </select>
// //               </div>
// //             </div>

// //             <div className="report-filter-footer">
// //               <button
// //                 type="button"
// //                 className="report-reset-btn"
// //                 onClick={reset}
// //               >
// //                 <RotateCcw size={14} />
// //                 Reset
// //               </button>

// //               <button
// //                 type="button"
// //                 className="report-btn report-generate-btn"
// //                 onClick={generate}
// //               >
// //                 <Search size={15} />
// //                 submit
// //               </button>
// //             </div>
// //           </section>
// //         )}

// //         <div className="report-summary-grid">
// //           <div className="report-stat">
// //             <div className="report-stat-icon blue">
// //               <Receipt size={24} />
// //             </div>
// //             <div className="report-stat-content">
// //               <div className="report-stat-label">Total vouchers</div>
// //               <div className="report-stat-value">{shownVouchers.length}</div>
// //               <div className="report-stat-note">
// //                 {isoLabel(applied.from)} – {isoLabel(applied.to)}
// //               </div>
// //             </div>
// //           </div>

// //           <div className="report-stat">
// //             <div className="report-stat-icon purple">
// //               <FileText size={24} />
// //             </div>
// //             <div className="report-stat-content">
// //               <div className="report-stat-label">Billed entries</div>
// //               <div className="report-stat-value">{shownLines.length}</div>
// //               <div className="report-stat-note">Product line entries</div>
// //             </div>
// //           </div>

// //           <button
// //             type="button"
// //             className="report-stat report-stat-link"
// //             onClick={scrollToStock}
// //             aria-label="Products in stock. Click to view the stock remaining table"
// //           >
// //             <div className="report-stat-icon green">
// //               <Package size={24} />
// //             </div>
// //             <div className="report-stat-content">
// //               <div className="report-stat-label">Products in stock</div>
// //               <div className="report-stat-value">{stock.length}</div>
// //               <div className="report-stat-note">
// //                 Products with remaining stock
// //               </div>
// //               <span className="report-stat-hint">
// //                 View stock <ChevronDown size={13} />
// //               </span>
// //             </div>
// //           </button>
// //         </div>

// //         <div className="report-tables">
// //           <section className="report-table-card">
// //             <div className="report-table-head">
// //               <div className="report-table-heading">
// //                 <div className="report-table-icon">
// //                   <FileText size={22} />
// //                 </div>
// //                 <div>
// //                   <h3>Billed Details</h3>
// //                   <p>
// //                     {isoLabel(applied.from)} – {isoLabel(applied.to)} · {productLabel}
// //                   </p>
// //                 </div>
// //               </div>

// //               <span className="report-count">
// //                 {shownVouchers.length}{' '}
// //                 {shownVouchers.length === 1 ? 'voucher' : 'vouchers'}
// //               </span>
// //             </div>

// //             <div className="report-table-scroll">
// //               <table className="report-table">
// //                 <thead>
// //                   <tr>
// //                     <th style={{ width: 65 }}>S.No</th>
// //                     <th>Voucher ID</th>
// //                     <th>Date</th>
// //                     <th>Products</th>
// //                     <th className="report-number">Total Quantity</th>
// //                   </tr>
// //                 </thead>

// //                 <tbody>
// //                   {shownVouchers.map((v, i) => (
// //                     <tr
// //                       key={v.voucher_id}
// //                       className="report-clickable-row"
// //                       onClick={() => setOpenVoucherId(v.voucher_id)}
// //                       onKeyDown={(e) => {
// //                         if (e.key === 'Enter' || e.key === ' ') {
// //                           e.preventDefault()
// //                           setOpenVoucherId(v.voucher_id)
// //                         }
// //                       }}
// //                       tabIndex={0}
// //                       aria-label={`View voucher ${formatVoucher(v.voucher_number)}`}
// //                       title="Click to view, edit or print this voucher"
// //                     >
// //                       <td className="report-muted">{i + 1}</td>
// //                       <td>
// //                         <span className="report-voucher">
// //                           {formatVoucher(v.voucher_number)}
// //                         </span>
// //                       </td>
// //                       <td className="report-muted">{formatDate(v.voucher_date)}</td>
// //                       <td className="report-product-name">
// //                         <span className="report-items">{itemsLabel(v.lines)}</span>
// //                       </td>
// //                       <td className="report-number">
// //                         <span className="report-qty">
// //                           {lineTotals(v.lines).join(' + ')}
// //                         </span>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>

// //             <div className="report-table-state">
// //               <TableState
// //                 loading={loading}
// //                 error={error}
// //                 empty={!loading && !error && shownVouchers.length === 0}
// //                 emptyText="No billings found for the selected filters."
// //                 onRetry={reload}
// //               />
// //             </div>
// //           </section>

// //           <section className="report-table-card stock-card" ref={stockRef}>
// //             <div className="report-table-head">
// //               <div className="report-table-heading">
// //                 <div className="report-table-icon stock">
// //                   <Package size={22} />
// //                 </div>
// //                 <div>
// //                   <h3>Stock Remaining</h3>
// //                   <p>Available stock as on {todayLabel}</p>
// //                 </div>
// //               </div>

// //               <span className="report-count">
// //                 {stock.length} {stock.length === 1 ? 'product' : 'products'}
// //               </span>
// //             </div>

// //             <div className="report-table-scroll">
// //               <table className="report-table" style={{ minWidth: 450 }}>
// //                 <thead>
// //                   <tr>
// //                     <th style={{ width: 65 }}>S.No</th>
// //                     <th>Product</th>
// //                     <th className="report-number">Remaining Quantity</th>
// //                   </tr>
// //                 </thead>

// //                 <tbody>
// //                   {stock.map((s, i) => (
// //                     <tr key={s.product_id}>
// //                       <td className="report-muted">{i + 1}</td>
// //                       <td className="report-product-name">{s.product_name}</td>
// //                       <td className="report-number">
// //                         <span className="report-qty">
// //                           {formatQtyWithUnit(
// //                             s.remaining_stock,
// //                             unitName[s.unit_id],
// //                           )}
// //                         </span>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>

// //             <div className="report-table-state">
// //               <TableState
// //                 loading={loading}
// //                 error={error}
// //                 empty={!loading && !error && stock.length === 0}
// //                 emptyText="No stock to show."
// //                 onRetry={reload}
// //               />
// //             </div>
// //           </section>
// //         </div>

// //         {openVoucher && (
// //           <VoucherCard
// //             key={openVoucher.voucher_id}
// //             voucher={openVoucher}
// //             onClose={() => setOpenVoucherId(null)}
// //             onSaved={reload}
// //           />
// //         )}
// //       </div>
// //     </>
// //   )
// // }




// // import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// // import {
// //   Download,
// //   RotateCcw,
// //   Search,
// //   SlidersHorizontal,
// //   X,
// //   Receipt,
// //   FileText,
// //   Package,
// //   Pencil,
// //   Printer,
// //   Save,
// //   ChevronDown,
// //   ChevronUp,
// // } from 'lucide-react'

// // import TableState from '../components/TableState'
// // import useAsyncData from '../hooks/useAsyncData'
// // import useToast from '../hooks/useToast'
// // import { getVoucherDetails } from '../services/reportsService'
// // import { updateVoucher } from '../services/vouchersService'
// // import { getStock } from '../services/stockService'
// // import { getProducts } from '../services/productsService'
// // import { getUnits } from '../services/unitsService'
// // import { getErrorMessage } from '../services/api'
// // import { QUICK_RANGES, getRange } from '../utils/dateRanges'
// // import { formatDate, formatQtyWithUnit, formatVoucher } from '../utils/format'
// // import PdfActionsModal from '../components/PdfActionsModal'
// // import { buildVoucherPdf, getPaperSize, totalsByUnit } from '../utils/voucherPdf'

// // const loadLookups = () => Promise.all([getProducts(), getUnits()])

// // const initialFilters = () => ({
// //   range: 'today',
// //   ...getRange('today'),
// //   productId: '',
// // })

// // const isoLabel = (iso) => (iso ? formatDate(`${iso}T00:00:00`) : '')

// // const toInputDate = (d) => (d ? String(d).slice(0, 10) : '')

// // const lineTotals = (lines) =>
// //   totalsByUnit(lines.map((l) => ({ quantity: l.quantity, unit: l.unit_name })))

// // const itemsLabel = (lines) => {
// //   const names = lines.map((l) => l.product_name)
// //   const head = names.slice(0, 2).join(', ')
// //   return names.length > 2 ? `${head} +${names.length - 2} more` : head
// // }

// // function csvCell(value) {
// //   const s = String(value ?? '')
// //   return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
// // }

// // /* ------------------------------------------------------------------ */
// // /* Voucher details / edit / print card                                 */
// // /* voucher: { voucher_id, voucher_number, voucher_date, lines: [...] } */
// // /* ------------------------------------------------------------------ */
// // function VoucherCard({ voucher, onClose, onSaved }) {
// //   const toast = useToast()
// //   const [editing, setEditing] = useState(false)
// //   const [saving, setSaving] = useState(false)
// //   const [printOpen, setPrintOpen] = useState(false)
// //   const [date, setDate] = useState(toInputDate(voucher.voucher_date))
// //   const [qty, setQty] = useState(() =>
// //     voucher.lines.map((l) => String(l.quantity)),
// //   )

// //   // While the print popup is open it handles Esc / outside clicks itself.
// //   const busy = saving || printOpen

// //   useEffect(() => {
// //     const onKey = (e) => {
// //       if (e.key === 'Escape' && !busy) onClose()
// //     }
// //     window.addEventListener('keydown', onKey)
// //     return () => window.removeEventListener('keydown', onKey)
// //   }, [onClose, busy])

// //   const cancelEdit = () => {
// //     setDate(toInputDate(voucher.voucher_date))
// //     setQty(voucher.lines.map((l) => String(l.quantity)))
// //     setEditing(false)
// //   }

// //   const save = async () => {
// //     if (!date) return toast.error('Voucher date is required.')

// //     if (
// //       qty.some((q) => q === '' || Number.isNaN(Number(q)) || Number(q) <= 0)
// //     ) {
// //       return toast.error('Every quantity must be greater than zero.')
// //     }

// //     setSaving(true)

// //     try {
// //       await updateVoucher(voucher.voucher_id, {
// //         voucher_date: date,
// //         items: voucher.lines.map((l, i) => ({
// //           product_id: l.product_id,
// //           quantity: Number(qty[i]),
// //         })),
// //       })

// //       toast.success('Voucher updated.')
// //       onSaved?.()
// //       onClose()
// //     } catch (err) {
// //       toast.error(getErrorMessage(err) || 'Could not update the voucher.')
// //     } finally {
// //       setSaving(false)
// //     }
// //   }

// //   // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
// //   const buildPdf = () =>
// //     buildVoucherPdf({
// //       voucherNumber: voucher.voucher_number,
// //       date: voucher.voucher_date,
// //       items: voucher.lines.map((l) => ({
// //         name: l.product_name,
// //         quantity: Number(l.quantity),
// //         unit: l.unit_name,
// //       })),
// //       paper: getPaperSize(),
// //     })

// //   const liveTotals = totalsByUnit(
// //     voucher.lines.map((l, i) => ({
// //       quantity: editing ? Number(qty[i]) || 0 : l.quantity,
// //       unit: l.unit_name,
// //     })),
// //   )

// //   return (
// //     <div
// //       className="vm-backdrop"
// //       onMouseDown={(e) => {
// //         if (e.target === e.currentTarget && !busy) onClose()
// //       }}
// //     >
// //       <div
// //         className="vm-card"
// //         role="dialog"
// //         aria-modal="true"
// //         aria-label="Voucher details"
// //       >
// //         <div className="vm-head">
// //           <div className="vm-title">
// //             <div className="vm-icon">
// //               <Receipt size={20} />
// //             </div>
// //             <div>
// //               <h3>Voucher {formatVoucher(voucher.voucher_number)}</h3>
// //               <p>{editing ? 'Editing voucher' : 'Voucher details'}</p>
// //             </div>
// //           </div>

// //           <button
// //             type="button"
// //             className="vm-close"
// //             onClick={onClose}
// //             aria-label="Close"
// //             disabled={busy}
// //           >
// //             <X size={18} />
// //           </button>
// //         </div>

// //         <div className="vm-body">
// //           <div className="vm-meta">
// //             <div>
// //               <span className="vm-label">Voucher ID</span>
// //               <div className="vm-value">
// //                 {formatVoucher(voucher.voucher_number)}
// //               </div>
// //             </div>

// //             <div>
// //               <label className="vm-label" htmlFor="vm-date">
// //                 Date
// //               </label>
// //               {editing ? (
// //                 <input
// //                   id="vm-date"
// //                   type="date"
// //                   className="vm-input"
// //                   value={date}
// //                   onChange={(e) => setDate(e.target.value)}
// //                 />
// //               ) : (
// //                 <div className="vm-value">{formatDate(voucher.voucher_date)}</div>
// //               )}
// //             </div>
// //           </div>

// //           <div className="vm-lines">
// //             <div className="vm-line vm-line-head">
// //               <span>Product</span>
// //               <span style={{ textAlign: 'right' }}>Billed Quantity</span>
// //             </div>

// //             {voucher.lines.map((l, i) => (
// //               <div className="vm-line" key={`${l.product_id}-${i}`}>
// //                 <b>{l.product_name}</b>

// //                 {editing ? (
// //                   <div className="vm-qty-wrap">
// //                     <input
// //                       type="number"
// //                       min="0"
// //                       step="any"
// //                       className="vm-input"
// //                       value={qty[i]}
// //                       aria-label={`Quantity for ${l.product_name}`}
// //                       onChange={(e) =>
// //                         setQty((q) =>
// //                           q.map((v, j) => (j === i ? e.target.value : v)),
// //                         )
// //                       }
// //                     />
// //                     <span className="vm-unit">{l.unit_name}</span>
// //                   </div>
// //                 ) : (
// //                   <span style={{ textAlign: 'right', fontWeight: 700 }}>
// //                     {formatQtyWithUnit(l.quantity, l.unit_name)}
// //                   </span>
// //                 )}
// //               </div>
// //             ))}

// //             <div className="vm-line vm-line-total">
// //               <b>Total</b>
// //               <span style={{ textAlign: 'right', fontWeight: 750 }}>
// //                 {liveTotals.join(' + ')}
// //               </span>
// //             </div>
// //           </div>
// //         </div>

// //         <div className="vm-foot">
// //           {editing ? (
// //             <>
// //               <button
// //                 type="button"
// //                 className="vm-btn"
// //                 onClick={cancelEdit}
// //                 disabled={saving}
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 type="button"
// //                 className="vm-btn primary"
// //                 onClick={save}
// //                 disabled={saving}
// //               >
// //                 <Save size={15} />
// //                 {saving ? 'Saving…' : 'Update'}
// //               </button>
// //             </>
// //           ) : (
// //             <>
// //               <div className="vm-print">
// //                 <button
// //                   type="button"
// //                   className="vm-btn"
// //                   onClick={() => setPrintOpen(true)}
// //                   aria-label="Print voucher"
// //                   title="Print / download / share voucher"
// //                 >
// //                   <Printer size={17} />
// //                 </button>
// //               </div>

// //               <button type="button" className="vm-btn" onClick={onClose}>
// //                 Close
// //               </button>
// //               <button
// //                 type="button"
// //                 className="vm-btn primary"
// //                 onClick={() => setEditing(true)}
// //               >
// //                 <Pencil size={15} />
// //                 Edit
// //               </button>
// //             </>
// //           )}
// //         </div>
// //       </div>

// //       {printOpen && (
// //         <PdfActionsModal
// //           title={`Print voucher ${formatVoucher(voucher.voucher_number)}`}
// //           build={buildPdf}
// //           onClose={() => setPrintOpen(false)}
// //         />
// //       )}
// //     </div>
// //   )
// // }

// // export default function Reports() {
// //   const toast = useToast()

// //   const [draft, setDraft] = useState(initialFilters)
// //   const [applied, setApplied] = useState(initialFilters)
// //   const [filtersOpen, setFiltersOpen] = useState(false)
// //   const [openVoucherId, setOpenVoucherId] = useState(null)
// //   const stockRef = useRef(null)

// //   const { data: lookups } = useAsyncData(loadLookups)
// //   const [products, units] = lookups ?? [[], []]

// //   const unitName = useMemo(
// //     () => Object.fromEntries(units.map((u) => [u.id, u.unit_name])),
// //     [units],
// //   )

// //   // Load every line of every voucher in the period. The product filter is applied
// //   // below, so a voucher always keeps ALL its lines (needed for edit and print).
// //   const loadReport = useCallback(
// //     () =>
// //       Promise.all([
// //         getVoucherDetails({
// //           startDate: applied.from,
// //           endDate: applied.to,
// //         }),
// //         getStock(),
// //       ]),
// //     [applied.from, applied.to],
// //   )

// //   const { data, loading, error, reload } = useAsyncData(loadReport)

// //   const [billed, stockAll] = data ?? [[], []]

// //   const stock = useMemo(
// //     () =>
// //       stockAll
// //         .filter(
// //           (s) =>
// //             !applied.productId ||
// //             String(s.product_id) === String(applied.productId),
// //         )
// //         .filter((s) => Number(s.remaining_stock) > 0),
// //     [stockAll, applied.productId],
// //   )

// //   // One entry per voucher, with all its lines.
// //   const vouchers = useMemo(() => {
// //     const map = new Map()

// //     billed.forEach((r) => {
// //       if (!map.has(r.voucher_id)) {
// //         map.set(r.voucher_id, {
// //           voucher_id: r.voucher_id,
// //           voucher_number: r.voucher_number,
// //           voucher_date: r.voucher_date,
// //           lines: [],
// //         })
// //       }
// //       map.get(r.voucher_id).lines.push(r)
// //     })

// //     return [...map.values()]
// //   }, [billed])

// //   // Product filter: vouchers that contain the chosen product.
// //   const shownVouchers = useMemo(
// //     () =>
// //       !applied.productId
// //         ? vouchers
// //         : vouchers.filter((v) =>
// //             v.lines.some(
// //               (l) => String(l.product_id) === String(applied.productId),
// //             ),
// //           ),
// //     [vouchers, applied.productId],
// //   )

// //   const shownLines = useMemo(
// //     () => shownVouchers.flatMap((v) => v.lines),
// //     [shownVouchers],
// //   )

// //   const productLabel = applied.productId
// //     ? (() => {
// //         const p = products.find((x) => String(x.id) === String(applied.productId))
// //         return p
// //           ? `${p.product_name} (${unitName[p.unit_id] ?? ''})`
// //           : 'Selected product'
// //       })()
// //     : 'All products'

// //   const openVoucher = useMemo(
// //     () =>
// //       openVoucherId == null
// //         ? null
// //         : vouchers.find((v) => v.voucher_id === openVoucherId) ?? null,
// //     [vouchers, openVoucherId],
// //   )

// //   const pickRange = (key) => {
// //     if (key === 'custom') {
// //       setDraft((d) => ({ ...d, range: 'custom' }))
// //       return
// //     }

// //     const next = {
// //       ...draft,
// //       range: key,
// //       ...getRange(key),
// //     }

// //     setDraft(next)
// //     setApplied(next)
// //   }

// //   const pickProduct = (productId) => {
// //     setDraft((d) => ({ ...d, productId }))
// //   }

// //   const generate = () => {
// //     if (!draft.from || !draft.to) {
// //       return toast.error('Choose both a start and end date.')
// //     }

// //     if (draft.from > draft.to) {
// //       return toast.error('Start date cannot be later than end date.')
// //     }

// //     setApplied(draft)
// //     setFiltersOpen(false)
// //   }

// //   const reset = () => {
// //     const fresh = initialFilters()
// //     setDraft(fresh)
// //     setApplied(fresh)
// //   }

// //   const exportCsv = () => {
// //     if (!shownLines.length && !stock.length) {
// //       return toast.info('There is no data to export.')
// //     }

// //     const lines = [
// //       `Mothys Inventory Report`,
// //       `Period,${applied.from} to ${applied.to}`,
// //       `Product,${csvCell(productLabel)}`,
// //       '',
// //       'Billed Details',
// //       'S.No,Voucher,Voucher Date,Product,Unit,Billed Quantity',
// //       ...shownLines.map((r, i) =>
// //         [
// //           i + 1,
// //           formatVoucher(r.voucher_number),
// //           formatDate(r.voucher_date),
// //           r.product_name,
// //           r.unit_name,
// //           Number(r.quantity),
// //         ]
// //           .map(csvCell)
// //           .join(','),
// //       ),
// //       '',
// //       `Stock Remaining,As on ${formatDate(new Date())}`,
// //       'S.No,Product,Unit,Remaining Quantity',
// //       ...stock.map((s, i) =>
// //         [
// //           i + 1,
// //           s.product_name,
// //           unitName[s.unit_id] ?? '',
// //           Number(s.remaining_stock),
// //         ]
// //           .map(csvCell)
// //           .join(','),
// //       ),
// //     ]

// //     const blob = new Blob(['\uFEFF' + lines.join('\n')], {
// //       type: 'text/csv;charset=utf-8',
// //     })

// //     const url = URL.createObjectURL(blob)
// //     const a = document.createElement('a')

// //     a.href = url
// //     a.download = `mothys-report-${applied.from}-to-${applied.to}.csv`
// //     a.click()

// //     URL.revokeObjectURL(url)
// //   }

// //   const scrollToStock = () =>
// //     stockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

// //   const custom = draft.range === 'custom'
// //   const todayLabel = formatDate(new Date())

// //   return (
// //     <>
// //       <style>{`
// //         .reports-page {
// //           width: 100%;
// //           color: var(--text, #17233f);
// //         }

// //         .reports-page * {
// //           box-sizing: border-box;
// //         }

// //         .reports-heading {
// //           display: flex;
// //           justify-content: space-between;
// //           align-items: center;
// //           gap: 16px;
// //           flex-wrap: wrap;
// //           margin-bottom: 24px;
// //         }

// //         .reports-heading h1 {
// //           margin: 0;
// //           font-size: 28px;
// //           font-weight: 750;
// //           letter-spacing: -0.7px;
// //           color: #17233f;
// //         }

// //         .reports-subtitle {
// //           margin: 7px 0 0;
// //           color: #64748b;
// //           font-size: 13px;
// //         }

// //         .reports-actions {
// //           display: flex;
// //           align-items: center;
// //           gap: 10px;
// //         }

// //         .reports-page .report-btn {
// //           min-height: 44px;
// //           display: inline-flex;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 9px;
// //           padding: 0 18px;
// //           border-radius: 10px;
// //           font-size: 13px;
// //           font-weight: 650;
// //           cursor: pointer;
// //           transition: .2s ease;
// //         }

// //         .reports-page .report-filter-btn {
// //           background: #fff;
// //           color: #1e3155;
// //           border: 1px solid #d7dfeb;
// //         }

// //         .reports-page .report-filter-btn:hover {
// //           border-color: #2563eb;
// //           color: #2563eb;
// //           background: #f8faff;
// //         }

// //         .reports-page .report-export-btn,
// //         .reports-page .report-generate-btn {
// //           background: #2458db;
// //           color: #fff;
// //           border: 1px solid #2458db;
// //           box-shadow: 0 3px 8px rgba(36, 88, 219, .15);
// //         }

// //         .reports-page .report-export-btn:hover,
// //         .reports-page .report-generate-btn:hover {
// //           background: #1747c2;
// //           border-color: #1747c2;
// //           transform: translateY(-1px);
// //         }

// //         .reports-page .report-export-btn:disabled {
// //           opacity: .55;
// //           cursor: not-allowed;
// //           transform: none;
// //         }

// //         .report-filter-panel {
// //           background: #fff;
// //           border: 1px solid #dce3ee;
// //           border-radius: 15px;
// //           padding: 23px 24px;
// //           margin-bottom: 24px;
// //           box-shadow: 0 5px 18px rgba(22, 39, 72, .045);
// //           animation: reportSlide .18s ease;
// //         }

// //         @keyframes reportSlide {
// //           from { opacity: 0; transform: translateY(-5px); }
// //           to { opacity: 1; transform: translateY(0); }
// //         }

// //         .report-filter-title {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 12px;
// //           margin-bottom: 22px;
// //         }

// //         .report-filter-title h3 {
// //           margin: 0;
// //           color: #1c2b49;
// //           font-size: 16px;
// //           font-weight: 750;
// //         }

// //         .report-filter-title p {
// //           margin: 5px 0 0;
// //           font-size: 12px;
// //           color: #71809a;
// //         }

// //         .report-close {
// //           width: 34px;
// //           height: 34px;
// //           display: grid;
// //           place-items: center;
// //           border: 0;
// //           border-radius: 9px;
// //           background: #f1f5fa;
// //           color: #52627e;
// //           cursor: pointer;
// //         }

// //         .report-close:hover {
// //           background: #e5edfa;
// //           color: #2458db;
// //         }

// //         .report-field-label {
// //           display: block;
// //           margin-bottom: 9px;
// //           font-size: 12px;
// //           font-weight: 700;
// //           color: #52627e;
// //         }

// //         .report-quick-ranges {
// //           display: flex;
// //           flex-wrap: wrap;
// //           gap: 8px;
// //           margin-bottom: 21px;
// //         }

// //         .report-quick-ranges button {
// //           min-height: 37px;
// //           padding: 0 15px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 8px;
// //           background: #fff;
// //           color: #53627c;
// //           font-size: 12px;
// //           font-weight: 600;
// //           cursor: pointer;
// //           transition: .18s ease;
// //         }

// //         .report-quick-ranges button:hover {
// //           border-color: #8eabed;
// //           color: #2458db;
// //           background: #f7f9ff;
// //         }

// //         .report-quick-ranges button.active {
// //           border-color: #2458db;
// //           background: #edf3ff;
// //           color: #2458db;
// //           box-shadow: inset 0 0 0 1px #2458db;
// //         }

// //         .report-filter-fields {
// //           display: grid;
// //           grid-template-columns: repeat(3, minmax(0, 1fr));
// //           gap: 18px;
// //         }

// //         .report-filter-fields input,
// //         .report-filter-fields select {
// //           width: 100%;
// //           height: 44px;
// //           padding: 0 12px;
// //           border: 1px solid #d9e1ed;
// //           border-radius: 9px;
// //           outline: none;
// //           background: #fff;
// //           color: #253653;
// //           font-size: 13px;
// //         }

// //         .report-filter-fields input:focus,
// //         .report-filter-fields select:focus {
// //           border-color: #3972ed;
// //           box-shadow: 0 0 0 3px rgba(57, 114, 237, .10);
// //         }

// //         .report-filter-fields input:disabled {
// //           background: #f4f6fa;
// //           color: #9aa6b8;
// //           cursor: not-allowed;
// //         }

// //         .report-filter-footer {
// //           display: flex;
// //           align-items: center;
// //           justify-content: flex-end;
// //           gap: 10px;
// //           border-top: 1px solid #edf0f5;
// //           margin-top: 22px;
// //           padding-top: 17px;
// //         }

// //         .report-reset-btn {
// //           min-height: 40px;
// //           padding: 0 15px;
// //           display: inline-flex;
// //           align-items: center;
// //           justify-content: center;
// //           gap: 7px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 9px;
// //           background: #fff;
// //           color: #52627e;
// //           font-size: 12px;
// //           font-weight: 650;
// //           cursor: pointer;
// //         }

// //         .report-reset-btn:hover {
// //           background: #f6f8fc;
// //           color: #2458db;
// //         }

// //         .report-generate-btn {
// //           min-height: 40px !important;
// //           padding: 0 17px !important;
// //           border-radius: 9px !important;
// //           font-size: 12px !important;
// //         }

// //         .report-summary-grid {
// //           display: grid;
// //           grid-template-columns: repeat(3, minmax(0, 1fr));
// //           gap: 20px;
// //           margin-bottom: 24px;
// //         }

// //         .report-stat {
// //           min-width: 0;
// //           min-height: 145px;
// //           display: flex;
// //           align-items: flex-start;
// //           gap: 15px;
// //           padding: 22px 20px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 14px;
// //           background: #fff;
// //           box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
// //         }

// //         .report-stat-link {
// //           width: 100%;
// //           font: inherit;
// //           color: inherit;
// //           text-align: left;
// //           cursor: pointer;
// //           transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
// //         }

// //         .report-stat-link:hover {
// //           border-color: #2458db;
// //           box-shadow: 0 8px 22px rgba(36, 88, 219, .12);
// //           transform: translateY(-2px);
// //         }

// //         .report-stat-link:focus-visible {
// //           outline: 3px solid rgba(36, 88, 219, .35);
// //           outline-offset: 2px;
// //         }

// //         .report-stat-hint {
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 4px;
// //           margin-top: 8px;
// //           color: #2458db;
// //           font-size: 11px;
// //           font-weight: 700;
// //         }

// //         .report-table-card.stock-card {
// //           scroll-margin-top: 16px;
// //         }

// //         .report-stat-icon {
// //           flex: 0 0 52px;
// //           width: 52px;
// //           height: 52px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 13px;
// //         }

// //         .report-stat-icon.blue {
// //           background: #eaf0ff;
// //           color: #2861e9;
// //         }

// //         .report-stat-icon.purple {
// //           background: #f1eaff;
// //           color: #8b42f6;
// //         }

// //         .report-stat-icon.orange {
// //           background: #fff2e6;
// //           color: #ec850d;
// //         }

// //         .report-stat-icon.green {
// //           background: #e7f7ee;
// //           color: #0caa58;
// //         }

// //         .report-stat-content {
// //           min-width: 0;
// //         }

// //         .report-stat-label {
// //           color: #64718a;
// //           font-size: 12px;
// //           font-weight: 650;
// //           line-height: 1.5;
// //         }

// //         .report-stat-value {
// //           margin-top: 5px;
// //           color: #1b2947;
// //           font-size: 29px;
// //           font-weight: 780;
// //           line-height: 1.15;
// //           letter-spacing: -.6px;
// //         }

// //         .report-stat-note {
// //           margin-top: 8px;
// //           color: #74819a;
// //           font-size: 11px;
// //           line-height: 1.5;
// //         }

// //         .report-tables {
// //           display: grid;
// //           grid-template-columns: 1fr;
// //           gap: 22px;
// //         }

// //         .report-table-card {
// //           min-width: 0;
// //           overflow: hidden;
// //           border: 1px solid #dce3ed;
// //           border-radius: 14px;
// //           background: #fff;
// //           box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
// //         }

// //         .report-table-head {
// //           min-height: 82px;
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 14px;
// //           padding: 17px 22px;
// //           border-bottom: 1px solid #e5eaf1;
// //         }

// //         .report-table-heading {
// //           display: flex;
// //           align-items: center;
// //           gap: 13px;
// //           min-width: 0;
// //         }

// //         .report-table-icon {
// //           flex: 0 0 44px;
// //           width: 44px;
// //           height: 44px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 11px;
// //           background: #edf2ff;
// //           color: #2861e9;
// //         }

// //         .report-table-icon.stock {
// //           background: #e9f8ef;
// //           color: #0ba65a;
// //         }

// //         .report-table-heading h3 {
// //           margin: 0;
// //           color: #1b2947;
// //           font-size: 15px;
// //           font-weight: 750;
// //         }

// //         .report-table-heading p {
// //           margin: 5px 0 0;
// //           color: #71809a;
// //           font-size: 11px;
// //         }

// //         .report-count {
// //           flex: 0 0 auto;
// //           padding: 7px 12px;
// //           border-radius: 20px;
// //           background: #f0f4fa;
// //           color: #52627e;
// //           font-size: 11px;
// //           font-weight: 700;
// //         }

// //         .report-table-scroll {
// //           width: 100%;
// //           overflow-x: auto;
// //         }

// //         .report-table {
// //           width: 100%;
// //           min-width: 620px;
// //           border-collapse: collapse;
// //           text-align: left;
// //         }

// //         .report-table th {
// //           padding: 14px 18px;
// //           background: #f7f9fc;
// //           color: #65748e;
// //           font-size: 10px;
// //           font-weight: 750;
// //           letter-spacing: .55px;
// //           text-transform: uppercase;
// //           white-space: nowrap;
// //         }

// //         .report-table td {
// //           padding: 15px 18px;
// //           border-top: 1px solid #edf0f5;
// //           color: #293955;
// //           font-size: 12px;
// //           font-weight: 500;
// //           white-space: nowrap;
// //         }

// //         .report-table tbody tr {
// //           transition: background .15s ease;
// //         }

// //         .report-table tbody tr:hover {
// //           background: #f8faff;
// //         }

// //         .report-table .report-muted {
// //           color: #8290a6;
// //         }

// //         .report-voucher {
// //           display: inline-flex;
// //           align-items: center;
// //           padding: 6px 10px;
// //           border: 1px solid #dce6ff;
// //           border-radius: 7px;
// //           background: #f1f5ff;
// //           color: #2458c7;
// //           font-size: 11px;
// //           font-weight: 750;
// //         }

// //         .report-items {
// //           display: inline-block;
// //           max-width: 320px;
// //           overflow: hidden;
// //           text-overflow: ellipsis;
// //           vertical-align: middle;
// //         }

// //         .report-product-name {
// //           color: #1d2c49 !important;
// //           font-weight: 700 !important;
// //         }

// //         .report-qty {
// //           display: inline-flex;
// //           justify-content: flex-end;
// //           min-width: 76px;
// //           padding: 7px 11px;
// //           border-radius: 7px;
// //           background: #f0f4fb;
// //           color: #243958;
// //           font-weight: 750;
// //         }

// //         .report-number {
// //           text-align: right !important;
// //         }

// //         .report-table-state {
// //           padding: 4px 18px 18px;
// //         }

// //         .report-clickable-row {
// //           cursor: pointer;
// //           transition: background .15s ease;
// //         }

// //         .report-clickable-row:hover {
// //           background: #edf3ff !important;
// //         }

// //         .report-clickable-row:focus-visible {
// //           outline: 2px solid #2458db;
// //           outline-offset: -2px;
// //         }

// //         /* ---------- Voucher card (modal) ---------- */
// //         .vm-backdrop {
// //           position: fixed;
// //           inset: 0;
// //           z-index: 1000;
// //           display: grid;
// //           place-items: center;
// //           padding: 16px;
// //           background: rgba(15, 23, 42, .45);
// //           animation: vmFade .15s ease;
// //         }

// //         @keyframes vmFade {
// //           from { opacity: 0; }
// //           to { opacity: 1; }
// //         }

// //         .vm-card {
// //           width: 100%;
// //           max-width: 560px;
// //           max-height: 90vh;
// //           display: flex;
// //           flex-direction: column;
// //           background: #fff;
// //           border-radius: 16px;
// //           overflow: hidden;
// //           box-shadow: 0 20px 50px rgba(15, 23, 42, .25);
// //         }

// //         .vm-head {
// //           display: flex;
// //           align-items: center;
// //           justify-content: space-between;
// //           gap: 12px;
// //           padding: 18px 22px;
// //           border-bottom: 1px solid #e5eaf1;
// //         }

// //         .vm-title {
// //           display: flex;
// //           align-items: center;
// //           gap: 12px;
// //           min-width: 0;
// //         }

// //         .vm-icon {
// //           flex: 0 0 42px;
// //           width: 42px;
// //           height: 42px;
// //           display: grid;
// //           place-items: center;
// //           border-radius: 11px;
// //           background: #edf2ff;
// //           color: #2861e9;
// //         }

// //         .vm-title h3 {
// //           margin: 0;
// //           font-size: 16px;
// //           font-weight: 750;
// //           color: #1b2947;
// //         }

// //         .vm-title p {
// //           margin: 4px 0 0;
// //           font-size: 12px;
// //           color: #71809a;
// //         }

// //         .vm-close {
// //           width: 34px;
// //           height: 34px;
// //           display: grid;
// //           place-items: center;
// //           border: 0;
// //           border-radius: 9px;
// //           background: #f1f5fa;
// //           color: #52627e;
// //           cursor: pointer;
// //         }

// //         .vm-close:hover {
// //           background: #e5edfa;
// //           color: #2458db;
// //         }

// //         .vm-body {
// //           padding: 20px 22px;
// //           overflow-y: auto;
// //         }

// //         .vm-label {
// //           display: block;
// //           margin-bottom: 8px;
// //           font-size: 12px;
// //           font-weight: 700;
// //           color: #52627e;
// //         }

// //         .vm-input {
// //           width: 100%;
// //           height: 42px;
// //           padding: 0 12px;
// //           border: 1px solid #d9e1ed;
// //           border-radius: 9px;
// //           font-size: 13px;
// //           color: #253653;
// //           background: #fff;
// //           outline: none;
// //         }

// //         .vm-input:focus {
// //           border-color: #3972ed;
// //           box-shadow: 0 0 0 3px rgba(57, 114, 237, .1);
// //         }

// //         .vm-meta {
// //           display: grid;
// //           grid-template-columns: 1fr 1fr;
// //           gap: 16px;
// //           margin-bottom: 20px;
// //         }

// //         .vm-value {
// //           font-size: 14px;
// //           font-weight: 700;
// //           color: #1b2947;
// //         }

// //         .vm-lines {
// //           border: 1px solid #e5eaf1;
// //           border-radius: 12px;
// //           overflow: hidden;
// //         }

// //         .vm-line {
// //           display: grid;
// //           grid-template-columns: 1fr 150px;
// //           align-items: center;
// //           gap: 12px;
// //           padding: 12px 16px;
// //           border-top: 1px solid #edf0f5;
// //           font-size: 13px;
// //           color: #293955;
// //         }

// //         .vm-line:first-child {
// //           border-top: 0;
// //         }

// //         .vm-line-head {
// //           background: #f7f9fc;
// //           color: #65748e;
// //           font-size: 10px;
// //           font-weight: 750;
// //           letter-spacing: .55px;
// //           text-transform: uppercase;
// //         }

// //         .vm-line-total {
// //           background: #f7f9fc;
// //         }

// //         .vm-line b {
// //           font-weight: 700;
// //           color: #1d2c49;
// //         }

// //         .vm-qty-wrap {
// //           display: flex;
// //           align-items: center;
// //           gap: 8px;
// //           justify-content: flex-end;
// //         }

// //         .vm-qty-wrap .vm-input {
// //           height: 36px;
// //           text-align: right;
// //         }

// //         .vm-unit {
// //           font-size: 12px;
// //           color: #71809a;
// //           white-space: nowrap;
// //         }

// //         .vm-foot {
// //           display: flex;
// //           flex-wrap: wrap;
// //           justify-content: flex-end;
// //           align-items: center;
// //           gap: 10px;
// //           padding: 14px 22px;
// //           border-top: 1px solid #e5eaf1;
// //         }

// //         .vm-print {
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 8px;
// //           margin-right: auto;
// //         }

// //         .vm-select {
// //           height: 40px;
// //           padding: 0 8px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 9px;
// //           background: #fff;
// //           color: #253653;
// //           font-size: 13px;
// //           font-weight: 600;
// //         }

// //         .vm-btn {
// //           min-height: 40px;
// //           padding: 0 18px;
// //           display: inline-flex;
// //           align-items: center;
// //           gap: 8px;
// //           border: 1px solid #dce3ed;
// //           border-radius: 9px;
// //           background: #fff;
// //           color: #52627e;
// //           font-size: 13px;
// //           font-weight: 650;
// //           cursor: pointer;
// //         }

// //         .vm-btn:hover {
// //           background: #f6f8fc;
// //           color: #2458db;
// //         }

// //         .vm-btn.primary {
// //           background: #2458db;
// //           border-color: #2458db;
// //           color: #fff;
// //         }

// //         .vm-btn.primary:hover {
// //           background: #1747c2;
// //         }

// //         .vm-btn:disabled {
// //           opacity: .6;
// //           cursor: not-allowed;
// //         }

// //         @media (max-width: 1100px) {
// //           .report-summary-grid {
// //             gap: 14px;
// //           }

// //           .report-stat {
// //             padding: 18px 16px;
// //             gap: 12px;
// //           }
// //         }

// //         @media (max-width: 700px) {
// //           .reports-heading {
// //             align-items: flex-start;
// //           }

// //           .reports-actions {
// //             width: 100%;
// //           }

// //           .reports-actions .report-btn {
// //             flex: 1;
// //             padding: 0 10px;
// //           }

// //           .report-filter-panel {
// //             padding: 17px;
// //           }

// //           .report-filter-fields {
// //             grid-template-columns: 1fr;
// //             gap: 14px;
// //           }

// //           .report-summary-grid {
// //             grid-template-columns: 1fr;
// //             gap: 12px;
// //           }

// //           .report-stat {
// //             min-height: 0;
// //             padding: 16px 14px;
// //             gap: 12px;
// //           }

// //           .report-stat-icon {
// //             width: 39px;
// //             height: 39px;
// //             flex-basis: 39px;
// //           }

// //           .report-stat-value {
// //             font-size: 24px;
// //           }

// //           .report-table-head {
// //             padding: 14px;
// //           }

// //           .report-filter-footer {
// //             flex-wrap: wrap;
// //           }

// //           .vm-meta {
// //             grid-template-columns: 1fr;
// //           }

// //           .vm-line {
// //             grid-template-columns: 1fr;
// //             gap: 8px;
// //           }

// //           .vm-qty-wrap {
// //             justify-content: flex-start;
// //           }

// //           .vm-print {
// //             width: 100%;
// //             margin-right: 0;
// //           }

// //           .vm-print .vm-btn {
// //             flex: 1;
// //             justify-content: center;
// //           }
// //         }
// //       `}</style>

// //       <div className="reports-page">
// //         <div className="reports-heading">
// //           <div>
// //             <h1>Reports</h1>
// //             <p className="reports-subtitle">
// //               Business overview · {isoLabel(applied.from)} to {isoLabel(applied.to)}
// //             </p>
// //           </div>

// //           <div className="reports-actions">
// //             <button
// //               type="button"
// //               className="report-btn report-filter-btn"
// //               onClick={() => setFiltersOpen((open) => !open)}
// //               aria-expanded={filtersOpen}
// //             >
// //               <SlidersHorizontal size={16} />
// //               Filters
// //               {filtersOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
// //             </button>

// //             <button
// //               type="button"
// //               className="report-btn report-export-btn"
// //               onClick={exportCsv}
// //               disabled={loading || Boolean(error)}
// //             >
// //               <Download size={16} />
// //               Export CSV
// //             </button>
// //           </div>
// //         </div>

// //         {filtersOpen && (
// //           <section className="report-filter-panel">
// //             <div className="report-filter-title">
// //               <div>
// //                 <h3>Report filters</h3>
// //                 <p>Choose a period and product to view your report</p>
// //               </div>

// //               <button
// //                 type="button"
// //                 className="report-close"
// //                 onClick={() => setFiltersOpen(false)}
// //                 aria-label="Close filters"
// //               >
// //                 <X size={18} />
// //               </button>
// //             </div>

// //             <div>
// //               <span className="report-field-label">Quick period</span>

// //               <div className="report-quick-ranges">
// //                 {QUICK_RANGES.map((r) => (
// //                   <button
// //                     key={r.key}
// //                     type="button"
// //                     className={draft.range === r.key ? 'active' : ''}
// //                     onClick={() => pickRange(r.key)}
// //                   >
// //                     {r.label}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="report-filter-fields">
// //               <div>
// //                 <label className="report-field-label" htmlFor="r-from">
// //                   From date
// //                 </label>
// //                 <input
// //                   id="r-from"
// //                   type="date"
// //                   value={draft.from}
// //                   disabled={!custom}
// //                   onChange={(e) =>
// //                     setDraft((d) => ({ ...d, from: e.target.value }))
// //                   }
// //                 />
// //               </div>

// //               <div>
// //                 <label className="report-field-label" htmlFor="r-to">
// //                   To date
// //                 </label>
// //                 <input
// //                   id="r-to"
// //                   type="date"
// //                   value={draft.to}
// //                   disabled={!custom}
// //                   onChange={(e) =>
// //                     setDraft((d) => ({ ...d, to: e.target.value }))
// //                   }
// //                 />
// //               </div>

// //               <div>
// //                 <label className="report-field-label" htmlFor="r-product">
// //                   Product
// //                 </label>
// //                 <select
// //                   id="r-product"
// //                   value={draft.productId}
// //                   onChange={(e) => pickProduct(e.target.value)}
// //                 >
// //                   <option value="">All products</option>
// //                   {products.map((p) => (
// //                     <option key={p.id} value={p.id}>
// //                       {p.product_name} ({unitName[p.unit_id] ?? '—'})
// //                     </option>
// //                   ))}
// //                 </select>
// //               </div>
// //             </div>

// //             <div className="report-filter-footer">
// //               <button
// //                 type="button"
// //                 className="report-reset-btn"
// //                 onClick={reset}
// //               >
// //                 <RotateCcw size={14} />
// //                 Reset
// //               </button>

// //               <button
// //                 type="button"
// //                 className="report-btn report-generate-btn"
// //                 onClick={generate}
// //               >
// //                 <Search size={15} />
// //                 submit
// //               </button>
// //             </div>
// //           </section>
// //         )}

// //         <div className="report-summary-grid">
// //           <div className="report-stat">
// //             <div className="report-stat-icon blue">
// //               <Receipt size={24} />
// //             </div>
// //             <div className="report-stat-content">
// //               <div className="report-stat-label">Total vouchers</div>
// //               <div className="report-stat-value">{shownVouchers.length}</div>
// //               <div className="report-stat-note">
// //                 {isoLabel(applied.from)} – {isoLabel(applied.to)}
// //               </div>
// //             </div>
// //           </div>

// //           <div className="report-stat">
// //             <div className="report-stat-icon purple">
// //               <FileText size={24} />
// //             </div>
// //             <div className="report-stat-content">
// //               <div className="report-stat-label">Billed entries</div>
// //               <div className="report-stat-value">{shownLines.length}</div>
// //               <div className="report-stat-note">Product line entries</div>
// //             </div>
// //           </div>

// //           <button
// //             type="button"
// //             className="report-stat report-stat-link"
// //             onClick={scrollToStock}
// //             aria-label="Products in stock. Click to view the stock remaining table"
// //           >
// //             <div className="report-stat-icon green">
// //               <Package size={24} />
// //             </div>
// //             <div className="report-stat-content">
// //               <div className="report-stat-label">Products in stock</div>
// //               <div className="report-stat-value">{stock.length}</div>
// //               <div className="report-stat-note">
// //                 Products with remaining stock
// //               </div>
// //               <span className="report-stat-hint">
// //                 View stock <ChevronDown size={13} />
// //               </span>
// //             </div>
// //           </button>
// //         </div>

// //         <div className="report-tables">
// //           <section className="report-table-card">
// //             <div className="report-table-head">
// //               <div className="report-table-heading">
// //                 <div className="report-table-icon">
// //                   <FileText size={22} />
// //                 </div>
// //                 <div>
// //                   <h3>Billed Details</h3>
// //                   <p>
// //                     {isoLabel(applied.from)} – {isoLabel(applied.to)} · {productLabel}
// //                   </p>
// //                 </div>
// //               </div>

// //               <span className="report-count">
// //                 {shownVouchers.length}{' '}
// //                 {shownVouchers.length === 1 ? 'voucher' : 'vouchers'}
// //               </span>
// //             </div>

// //             <div className="report-table-scroll">
// //               <table className="report-table">
// //                 <thead>
// //                   <tr>
// //                     <th style={{ width: 65 }}>S.No</th>
// //                     <th>Voucher ID</th>
// //                     <th>Date</th>
// //                     <th>Products</th>
// //                     <th className="report-number">Total Quantity</th>
// //                   </tr>
// //                 </thead>

// //                 <tbody>
// //                   {shownVouchers.map((v, i) => (
// //                     <tr
// //                       key={v.voucher_id}
// //                       className="report-clickable-row"
// //                       onClick={() => setOpenVoucherId(v.voucher_id)}
// //                       onKeyDown={(e) => {
// //                         if (e.key === 'Enter' || e.key === ' ') {
// //                           e.preventDefault()
// //                           setOpenVoucherId(v.voucher_id)
// //                         }
// //                       }}
// //                       tabIndex={0}
// //                       aria-label={`View voucher ${formatVoucher(v.voucher_number)}`}
// //                       title="Click to view, edit or print this voucher"
// //                     >
// //                       <td className="report-muted">{i + 1}</td>
// //                       <td>
// //                         <span className="report-voucher">
// //                           {formatVoucher(v.voucher_number)}
// //                         </span>
// //                       </td>
// //                       <td className="report-muted">{formatDate(v.voucher_date)}</td>
// //                       <td className="report-product-name">
// //                         <span className="report-items">{itemsLabel(v.lines)}</span>
// //                       </td>
// //                       <td className="report-number">
// //                         <span className="report-qty">
// //                           {lineTotals(v.lines).join(' + ')}
// //                         </span>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>

// //             <div className="report-table-state">
// //               <TableState
// //                 loading={loading}
// //                 error={error}
// //                 empty={!loading && !error && shownVouchers.length === 0}
// //                 emptyText="No billings found for the selected filters."
// //                 onRetry={reload}
// //               />
// //             </div>
// //           </section>

// //           <section className="report-table-card stock-card" ref={stockRef}>
// //             <div className="report-table-head">
// //               <div className="report-table-heading">
// //                 <div className="report-table-icon stock">
// //                   <Package size={22} />
// //                 </div>
// //                 <div>
// //                   <h3>Stock Remaining</h3>
// //                   <p>Available stock as on {todayLabel}</p>
// //                 </div>
// //               </div>

// //               <span className="report-count">
// //                 {stock.length} {stock.length === 1 ? 'product' : 'products'}
// //               </span>
// //             </div>

// //             <div className="report-table-scroll">
// //               <table className="report-table" style={{ minWidth: 450 }}>
// //                 <thead>
// //                   <tr>
// //                     <th style={{ width: 65 }}>S.No</th>
// //                     <th>Product</th>
// //                     <th className="report-number">Remaining Quantity</th>
// //                   </tr>
// //                 </thead>

// //                 <tbody>
// //                   {stock.map((s, i) => (
// //                     <tr key={s.product_id}>
// //                       <td className="report-muted">{i + 1}</td>
// //                       <td className="report-product-name">{s.product_name}</td>
// //                       <td className="report-number">
// //                         <span className="report-qty">
// //                           {formatQtyWithUnit(
// //                             s.remaining_stock,
// //                             unitName[s.unit_id],
// //                           )}
// //                         </span>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>

// //             <div className="report-table-state">
// //               <TableState
// //                 loading={loading}
// //                 error={error}
// //                 empty={!loading && !error && stock.length === 0}
// //                 emptyText="No stock to show."
// //                 onRetry={reload}
// //               />
// //             </div>
// //           </section>
// //         </div>

// //         {openVoucher && (
// //           <VoucherCard
// //             key={openVoucher.voucher_id}
// //             voucher={openVoucher}
// //             onClose={() => setOpenVoucherId(null)}
// //             onSaved={reload}
// //           />
// //         )}
// //       </div>
// //     </>
// //   )
// // }






// import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import {
//   Download,
//   RotateCcw,
//   Search,
//   SlidersHorizontal,
//   X,
//   Receipt,
//   FileText,
//   Package,
//   Pencil,
//   Printer,
//   Save,
//   ChevronDown,
//   ChevronUp,
// } from 'lucide-react'

// import TableState from '../components/TableState'
// import useAsyncData from '../hooks/useAsyncData'
// import useToast from '../hooks/useToast'
// import { getVoucherDetails } from '../services/reportsService'
// import { updateVoucher } from '../services/vouchersService'
// import { getStock } from '../services/stockService'
// import { getProducts } from '../services/productsService'
// import { getUnits } from '../services/unitsService'
// import { getErrorMessage } from '../services/api'
// import { QUICK_RANGES, getRange } from '../utils/dateRanges'
// import { formatDate, formatQtyWithUnit, formatVoucher } from '../utils/format'
// import PdfActionsModal from '../components/PdfActionsModal'
// import { buildVoucherPdf, getPaperSize } from '../utils/voucherPdf'

// const loadLookups = () => Promise.all([getProducts(), getUnits()])

// const initialFilters = () => ({
//   range: 'today',
//   ...getRange('today'),
//   productId: '',
// })

// const isoLabel = (iso) => (iso ? formatDate(`${iso}T00:00:00`) : '')

// const toInputDate = (d) => (d ? String(d).slice(0, 10) : '')

// const itemsLabel = (lines) => {
//   const names = lines.map((l) => l.product_name)
//   const head = names.slice(0, 2).join(', ')
//   return names.length > 2 ? `${head} +${names.length - 2} more` : head
// }

// function csvCell(value) {
//   const s = String(value ?? '')
//   return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
// }

// /* ------------------------------------------------------------------ */
// /* Voucher details / edit / print card                                 */
// /* voucher: { voucher_id, voucher_number, voucher_date, lines: [...] } */
// /* ------------------------------------------------------------------ */
// function VoucherCard({ voucher, onClose, onSaved }) {
//   const toast = useToast()
//   const [editing, setEditing] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [printOpen, setPrintOpen] = useState(false)
//   const [date, setDate] = useState(toInputDate(voucher.voucher_date))
//   const [qty, setQty] = useState(() =>
//     voucher.lines.map((l) => String(l.quantity)),
//   )

//   // While the print popup is open it handles Esc / outside clicks itself.
//   const busy = saving || printOpen

//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.key === 'Escape' && !busy) onClose()
//     }
//     window.addEventListener('keydown', onKey)
//     return () => window.removeEventListener('keydown', onKey)
//   }, [onClose, busy])

//   const cancelEdit = () => {
//     setDate(toInputDate(voucher.voucher_date))
//     setQty(voucher.lines.map((l) => String(l.quantity)))
//     setEditing(false)
//   }

//   const save = async () => {
//     if (!date) return toast.error('Voucher date is required.')

//     if (
//       qty.some((q) => q === '' || Number.isNaN(Number(q)) || Number(q) <= 0)
//     ) {
//       return toast.error('Every quantity must be greater than zero.')
//     }

//     setSaving(true)

//     try {
//       await updateVoucher(voucher.voucher_id, {
//         voucher_date: date,
//         items: voucher.lines.map((l, i) => ({
//           product_id: l.product_id,
//           quantity: Number(qty[i]),
//         })),
//       })

//       toast.success('Voucher updated.')
//       onSaved?.()
//       onClose()
//     } catch (err) {
//       toast.error(getErrorMessage(err) || 'Could not update the voucher.')
//     } finally {
//       setSaving(false)
//     }
//   }

//   // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
//   const buildPdf = () =>
//     buildVoucherPdf({
//       voucherNumber: voucher.voucher_number,
//       date: voucher.voucher_date,
//       items: voucher.lines.map((l) => ({
//         name: l.product_name,
//         quantity: Number(l.quantity),
//         unit: l.unit_name,
//       })),
//       paper: getPaperSize(),
//     })

//   return (
//     <div
//       className="vm-backdrop"
//       onMouseDown={(e) => {
//         if (e.target === e.currentTarget && !busy) onClose()
//       }}
//     >
//       <div
//         className="vm-card"
//         role="dialog"
//         aria-modal="true"
//         aria-label="Voucher details"
//       >
//         <div className="vm-head">
//           <div className="vm-title">
//             <div className="vm-icon">
//               <Receipt size={20} />
//             </div>
//             <div>
//               <h3>Voucher {formatVoucher(voucher.voucher_number)}</h3>
//               <p>{editing ? 'Editing voucher' : 'Voucher details'}</p>
//             </div>
//           </div>

//           <button
//             type="button"
//             className="vm-close"
//             onClick={onClose}
//             aria-label="Close"
//             disabled={busy}
//           >
//             <X size={18} />
//           </button>
//         </div>

//         <div className="vm-body">
//           <div className="vm-meta">
//             <div>
//               <span className="vm-label">Voucher ID</span>
//               <div className="vm-value">
//                 {formatVoucher(voucher.voucher_number)}
//               </div>
//             </div>

//             <div>
//               <label className="vm-label" htmlFor="vm-date">
//                 Date
//               </label>
//               {editing ? (
//                 <input
//                   id="vm-date"
//                   type="date"
//                   className="vm-input"
//                   value={date}
//                   onChange={(e) => setDate(e.target.value)}
//                 />
//               ) : (
//                 <div className="vm-value">{formatDate(voucher.voucher_date)}</div>
//               )}
//             </div>
//           </div>

//           <div className="vm-lines">
//             <div className="vm-line vm-line-head">
//               <span>Product</span>
//               <span style={{ textAlign: 'right' }}>Billed Quantity</span>
//             </div>

//             {voucher.lines.map((l, i) => (
//               <div className="vm-line" key={`${l.product_id}-${i}`}>
//                 <b>{l.product_name}</b>

//                 {editing ? (
//                   <div className="vm-qty-wrap">
//                     <input
//                       type="number"
//                       min="0"
//                       step="any"
//                       className="vm-input"
//                       value={qty[i]}
//                       aria-label={`Quantity for ${l.product_name}`}
//                       onChange={(e) =>
//                         setQty((q) =>
//                           q.map((v, j) => (j === i ? e.target.value : v)),
//                         )
//                       }
//                     />
//                     <span className="vm-unit">{l.unit_name}</span>
//                   </div>
//                 ) : (
//                   <span style={{ textAlign: 'right', fontWeight: 700 }}>
//                     {formatQtyWithUnit(l.quantity, l.unit_name)}
//                   </span>
//                 )}
//               </div>
//             ))}

//             <div className="vm-line vm-line-total">
//               <b>Total Items</b>
//               <span style={{ textAlign: 'right', fontWeight: 750 }}>
//                 {voucher.lines.length}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="vm-foot">
//           {editing ? (
//             <>
//               <button
//                 type="button"
//                 className="vm-btn"
//                 onClick={cancelEdit}
//                 disabled={saving}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 className="vm-btn primary"
//                 onClick={save}
//                 disabled={saving}
//               >
//                 <Save size={15} />
//                 {saving ? 'Saving…' : 'Update'}
//               </button>
//             </>
//           ) : (
//             <>
//               <div className="vm-print">
//                 <button
//                   type="button"
//                   className="vm-btn"
//                   onClick={() => setPrintOpen(true)}
//                   aria-label="Print voucher"
//                   title="Print / download / share voucher"
//                 >
//                   <Printer size={17} />
//                 </button>
//               </div>

//               <button type="button" className="vm-btn" onClick={onClose}>
//                 Close
//               </button>
//               <button
//                 type="button"
//                 className="vm-btn primary"
//                 onClick={() => setEditing(true)}
//               >
//                 <Pencil size={15} />
//                 Edit
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {printOpen && (
//         <PdfActionsModal
//           title={`Print voucher ${formatVoucher(voucher.voucher_number)}`}
//           build={buildPdf}
//           onClose={() => setPrintOpen(false)}
//         />
//       )}
//     </div>
//   )
// }

// export default function Reports() {
//   const toast = useToast()

//   const [draft, setDraft] = useState(initialFilters)
//   const [applied, setApplied] = useState(initialFilters)
//   const [filtersOpen, setFiltersOpen] = useState(false)
//   const [openVoucherId, setOpenVoucherId] = useState(null)
//   const stockRef = useRef(null)

//   const { data: lookups } = useAsyncData(loadLookups)
//   const [products, units] = lookups ?? [[], []]

//   const unitName = useMemo(
//     () => Object.fromEntries(units.map((u) => [u.id, u.unit_name])),
//     [units],
//   )

//   // Load every line of every voucher in the period. The product filter is applied
//   // below, so a voucher always keeps ALL its lines (needed for edit and print).
//   const loadReport = useCallback(
//     () =>
//       Promise.all([
//         getVoucherDetails({
//           startDate: applied.from,
//           endDate: applied.to,
//         }),
//         getStock(),
//       ]),
//     [applied.from, applied.to],
//   )

//   const { data, loading, error, reload } = useAsyncData(loadReport)

//   const [billed, stockAll] = data ?? [[], []]

//   const stock = useMemo(
//     () =>
//       stockAll
//         .filter(
//           (s) =>
//             !applied.productId ||
//             String(s.product_id) === String(applied.productId),
//         )
//         .filter((s) => Number(s.remaining_stock) > 0),
//     [stockAll, applied.productId],
//   )

//   // The stock table shows the same product in ONE row, its units separated by " / ".
//   const stockGroups = useMemo(() => {
//     const groups = []
//     const index = {}

//     stock.forEach((s) => {
//       if (!(s.product_id in index)) {
//         index[s.product_id] = groups.length
//         groups.push({
//           productId: s.product_id,
//           name: s.product_name,
//           lines: [],
//         })
//       }
//       groups[index[s.product_id]].lines.push(s)
//     })

//     return groups
//   }, [stock])

//   // One entry per voucher, with all its lines.
//   const vouchers = useMemo(() => {
//     const map = new Map()

//     billed.forEach((r) => {
//       if (!map.has(r.voucher_id)) {
//         map.set(r.voucher_id, {
//           voucher_id: r.voucher_id,
//           voucher_number: r.voucher_number,
//           voucher_date: r.voucher_date,
//           lines: [],
//         })
//       }
//       map.get(r.voucher_id).lines.push(r)
//     })

//     return [...map.values()]
//   }, [billed])

//   // Product filter: vouchers that contain the chosen product.
//   const shownVouchers = useMemo(
//     () =>
//       !applied.productId
//         ? vouchers
//         : vouchers.filter((v) =>
//             v.lines.some(
//               (l) => String(l.product_id) === String(applied.productId),
//             ),
//           ),
//     [vouchers, applied.productId],
//   )

//   const shownLines = useMemo(
//     () => shownVouchers.flatMap((v) => v.lines),
//     [shownVouchers],
//   )

//   const productLabel = applied.productId
//     ? (() => {
//         const p = products.find((x) => String(x.id) === String(applied.productId))
//         return p
//           ? `${p.product_name} (${unitName[p.unit_id] ?? ''})`
//           : 'Selected product'
//       })()
//     : 'All products'

//   const openVoucher = useMemo(
//     () =>
//       openVoucherId == null
//         ? null
//         : vouchers.find((v) => v.voucher_id === openVoucherId) ?? null,
//     [vouchers, openVoucherId],
//   )

//   const pickRange = (key) => {
//     if (key === 'custom') {
//       setDraft((d) => ({ ...d, range: 'custom' }))
//       return
//     }

//     const next = {
//       ...draft,
//       range: key,
//       ...getRange(key),
//     }

//     setDraft(next)
//     setApplied(next)
//   }

//   const pickProduct = (productId) => {
//     setDraft((d) => ({ ...d, productId }))
//   }

//   const generate = () => {
//     if (!draft.from || !draft.to) {
//       return toast.error('Choose both a start and end date.')
//     }

//     if (draft.from > draft.to) {
//       return toast.error('Start date cannot be later than end date.')
//     }

//     setApplied(draft)
//     setFiltersOpen(false)
//   }

//   const reset = () => {
//     const fresh = initialFilters()
//     setDraft(fresh)
//     setApplied(fresh)
//   }

//   const exportCsv = () => {
//     if (!shownLines.length && !stock.length) {
//       return toast.info('There is no data to export.')
//     }

//     const lines = [
//       `Mothys Inventory Report`,
//       `Period,${applied.from} to ${applied.to}`,
//       `Product,${csvCell(productLabel)}`,
//       '',
//       'Billed Details',
//       'S.No,Voucher,Voucher Date,Product,Unit,Billed Quantity',
//       ...shownLines.map((r, i) =>
//         [
//           i + 1,
//           formatVoucher(r.voucher_number),
//           formatDate(r.voucher_date),
//           r.product_name,
//           r.unit_name,
//           Number(r.quantity),
//         ]
//           .map(csvCell)
//           .join(','),
//       ),
//       '',
//       `Stock Remaining,As on ${formatDate(new Date())}`,
//       'S.No,Product,Unit,Remaining Quantity',
//       ...stock.map((s, i) =>
//         [
//           i + 1,
//           s.product_name,
//           unitName[s.unit_id] ?? '',
//           Number(s.remaining_stock),
//         ]
//           .map(csvCell)
//           .join(','),
//       ),
//     ]

//     const blob = new Blob(['\uFEFF' + lines.join('\n')], {
//       type: 'text/csv;charset=utf-8',
//     })

//     const url = URL.createObjectURL(blob)
//     const a = document.createElement('a')

//     a.href = url
//     a.download = `mothys-report-${applied.from}-to-${applied.to}.csv`
//     a.click()

//     URL.revokeObjectURL(url)
//   }

//   const scrollToStock = () =>
//     stockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

//   const custom = draft.range === 'custom'
//   const todayLabel = formatDate(new Date())

//   return (
//     <>
//       <style>{`
//         .reports-page {
//           width: 100%;
//           color: var(--text, #17233f);
//         }

//         .reports-page * {
//           box-sizing: border-box;
//         }

//         .reports-heading {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 16px;
//           flex-wrap: wrap;
//           margin-bottom: 24px;
//         }

//         .reports-heading h1 {
//           margin: 0;
//           font-size: 28px;
//           font-weight: 750;
//           letter-spacing: -0.7px;
//           color: #17233f;
//         }

//         .reports-subtitle {
//           margin: 7px 0 0;
//           color: #64748b;
//           font-size: 13px;
//         }

//         .reports-actions {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//         }

//         .reports-page .report-btn {
//           min-height: 44px;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 9px;
//           padding: 0 18px;
//           border-radius: 10px;
//           font-size: 13px;
//           font-weight: 650;
//           cursor: pointer;
//           transition: .2s ease;
//         }

//         .reports-page .report-filter-btn {
//           background: #fff;
//           color: #1e3155;
//           border: 1px solid #d7dfeb;
//         }

//         .reports-page .report-filter-btn:hover {
//           border-color: #2563eb;
//           color: #2563eb;
//           background: #f8faff;
//         }

//         .reports-page .report-export-btn,
//         .reports-page .report-generate-btn {
//           background: #2458db;
//           color: #fff;
//           border: 1px solid #2458db;
//           box-shadow: 0 3px 8px rgba(36, 88, 219, .15);
//         }

//         .reports-page .report-export-btn:hover,
//         .reports-page .report-generate-btn:hover {
//           background: #1747c2;
//           border-color: #1747c2;
//           transform: translateY(-1px);
//         }

//         .reports-page .report-export-btn:disabled {
//           opacity: .55;
//           cursor: not-allowed;
//           transform: none;
//         }

//         .report-filter-panel {
//           background: #fff;
//           border: 1px solid #dce3ee;
//           border-radius: 15px;
//           padding: 23px 24px;
//           margin-bottom: 24px;
//           box-shadow: 0 5px 18px rgba(22, 39, 72, .045);
//           animation: reportSlide .18s ease;
//         }

//         @keyframes reportSlide {
//           from { opacity: 0; transform: translateY(-5px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         .report-filter-title {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           margin-bottom: 22px;
//         }

//         .report-filter-title h3 {
//           margin: 0;
//           color: #1c2b49;
//           font-size: 16px;
//           font-weight: 750;
//         }

//         .report-filter-title p {
//           margin: 5px 0 0;
//           font-size: 12px;
//           color: #71809a;
//         }

//         .report-close {
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

//         .report-close:hover {
//           background: #e5edfa;
//           color: #2458db;
//         }

//         .report-field-label {
//           display: block;
//           margin-bottom: 9px;
//           font-size: 12px;
//           font-weight: 700;
//           color: #52627e;
//         }

//         .report-quick-ranges {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 8px;
//           margin-bottom: 21px;
//         }

//         .report-quick-ranges button {
//           min-height: 37px;
//           padding: 0 15px;
//           border: 1px solid #dce3ed;
//           border-radius: 8px;
//           background: #fff;
//           color: #53627c;
//           font-size: 12px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: .18s ease;
//         }

//         .report-quick-ranges button:hover {
//           border-color: #8eabed;
//           color: #2458db;
//           background: #f7f9ff;
//         }

//         .report-quick-ranges button.active {
//           border-color: #2458db;
//           background: #edf3ff;
//           color: #2458db;
//           box-shadow: inset 0 0 0 1px #2458db;
//         }

//         .report-filter-fields {
//           display: grid;
//           grid-template-columns: repeat(3, minmax(0, 1fr));
//           gap: 18px;
//         }

//         .report-filter-fields input,
//         .report-filter-fields select {
//           width: 100%;
//           height: 44px;
//           padding: 0 12px;
//           border: 1px solid #d9e1ed;
//           border-radius: 9px;
//           outline: none;
//           background: #fff;
//           color: #253653;
//           font-size: 13px;
//         }

//         .report-filter-fields input:focus,
//         .report-filter-fields select:focus {
//           border-color: #3972ed;
//           box-shadow: 0 0 0 3px rgba(57, 114, 237, .10);
//         }

//         .report-filter-fields input:disabled {
//           background: #f4f6fa;
//           color: #9aa6b8;
//           cursor: not-allowed;
//         }

//         .report-filter-footer {
//           display: flex;
//           align-items: center;
//           justify-content: flex-end;
//           gap: 10px;
//           border-top: 1px solid #edf0f5;
//           margin-top: 22px;
//           padding-top: 17px;
//         }

//         .report-reset-btn {
//           min-height: 40px;
//           padding: 0 15px;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 7px;
//           border: 1px solid #dce3ed;
//           border-radius: 9px;
//           background: #fff;
//           color: #52627e;
//           font-size: 12px;
//           font-weight: 650;
//           cursor: pointer;
//         }

//         .report-reset-btn:hover {
//           background: #f6f8fc;
//           color: #2458db;
//         }

//         .report-generate-btn {
//           min-height: 40px !important;
//           padding: 0 17px !important;
//           border-radius: 9px !important;
//           font-size: 12px !important;
//         }

//         .report-summary-grid {
//           display: grid;
//           grid-template-columns: repeat(3, minmax(0, 1fr));
//           gap: 20px;
//           margin-bottom: 24px;
//         }

//         .report-stat {
//           min-width: 0;
//           min-height: 145px;
//           display: flex;
//           align-items: flex-start;
//           gap: 15px;
//           padding: 22px 20px;
//           border: 1px solid #dce3ed;
//           border-radius: 14px;
//           background: #fff;
//           box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
//         }

//         .report-stat-link {
//           width: 100%;
//           font: inherit;
//           color: inherit;
//           text-align: left;
//           cursor: pointer;
//           transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
//         }

//         .report-stat-link:hover {
//           border-color: #2458db;
//           box-shadow: 0 8px 22px rgba(36, 88, 219, .12);
//           transform: translateY(-2px);
//         }

//         .report-stat-link:focus-visible {
//           outline: 3px solid rgba(36, 88, 219, .35);
//           outline-offset: 2px;
//         }

//         .report-stat-hint {
//           display: inline-flex;
//           align-items: center;
//           gap: 4px;
//           margin-top: 8px;
//           color: #2458db;
//           font-size: 11px;
//           font-weight: 700;
//         }

//         .report-table-card.stock-card {
//           scroll-margin-top: 16px;
//         }

//         .report-stat-icon {
//           flex: 0 0 52px;
//           width: 52px;
//           height: 52px;
//           display: grid;
//           place-items: center;
//           border-radius: 13px;
//         }

//         .report-stat-icon.blue {
//           background: #eaf0ff;
//           color: #2861e9;
//         }

//         .report-stat-icon.purple {
//           background: #f1eaff;
//           color: #8b42f6;
//         }

//         .report-stat-icon.orange {
//           background: #fff2e6;
//           color: #ec850d;
//         }

//         .report-stat-icon.green {
//           background: #e7f7ee;
//           color: #0caa58;
//         }

//         .report-stat-content {
//           min-width: 0;
//         }

//         .report-stat-label {
//           color: #64718a;
//           font-size: 12px;
//           font-weight: 650;
//           line-height: 1.5;
//         }

//         .report-stat-value {
//           margin-top: 5px;
//           color: #1b2947;
//           font-size: 29px;
//           font-weight: 780;
//           line-height: 1.15;
//           letter-spacing: -.6px;
//         }

//         .report-stat-note {
//           margin-top: 8px;
//           color: #74819a;
//           font-size: 11px;
//           line-height: 1.5;
//         }

//         .report-tables {
//           display: grid;
//           grid-template-columns: 1fr;
//           gap: 22px;
//         }

//         .report-table-card {
//           min-width: 0;
//           overflow: hidden;
//           border: 1px solid #dce3ed;
//           border-radius: 14px;
//           background: #fff;
//           box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
//         }

//         .report-table-head {
//           min-height: 82px;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 14px;
//           padding: 17px 22px;
//           border-bottom: 1px solid #e5eaf1;
//         }

//         .report-table-heading {
//           display: flex;
//           align-items: center;
//           gap: 13px;
//           min-width: 0;
//         }

//         .report-table-icon {
//           flex: 0 0 44px;
//           width: 44px;
//           height: 44px;
//           display: grid;
//           place-items: center;
//           border-radius: 11px;
//           background: #edf2ff;
//           color: #2861e9;
//         }

//         .report-table-icon.stock {
//           background: #e9f8ef;
//           color: #0ba65a;
//         }

//         .report-table-heading h3 {
//           margin: 0;
//           color: #1b2947;
//           font-size: 15px;
//           font-weight: 750;
//         }

//         .report-table-heading p {
//           margin: 5px 0 0;
//           color: #71809a;
//           font-size: 11px;
//         }

//         .report-count {
//           flex: 0 0 auto;
//           padding: 7px 12px;
//           border-radius: 20px;
//           background: #f0f4fa;
//           color: #52627e;
//           font-size: 11px;
//           font-weight: 700;
//         }

//         .report-table-scroll {
//           width: 100%;
//           overflow-x: auto;
//         }

//         .report-table {
//           width: 100%;
//           min-width: 620px;
//           border-collapse: collapse;
//           text-align: left;
//         }

//         .report-table th {
//           padding: 14px 18px;
//           background: #f7f9fc;
//           color: #65748e;
//           font-size: 10px;
//           font-weight: 750;
//           letter-spacing: .55px;
//           text-transform: uppercase;
//           white-space: nowrap;
//         }

//         .report-table td {
//           padding: 15px 18px;
//           border-top: 1px solid #edf0f5;
//           color: #293955;
//           font-size: 12px;
//           font-weight: 500;
//           white-space: nowrap;
//         }

//         .report-table tbody tr {
//           transition: background .15s ease;
//         }

//         .report-table tbody tr:hover {
//           background: #f8faff;
//         }

//         .report-table .report-muted {
//           color: #8290a6;
//         }

//         .report-voucher {
//           display: inline-flex;
//           align-items: center;
//           padding: 6px 10px;
//           border: 1px solid #dce6ff;
//           border-radius: 7px;
//           background: #f1f5ff;
//           color: #2458c7;
//           font-size: 11px;
//           font-weight: 750;
//         }

//         .report-items {
//           display: inline-block;
//           max-width: 320px;
//           overflow: hidden;
//           text-overflow: ellipsis;
//           vertical-align: middle;
//         }

//         .report-product-name {
//           color: #1d2c49 !important;
//           font-weight: 700 !important;
//         }

//         .report-qty {
//           display: inline-flex;
//           justify-content: flex-end;
//           min-width: 76px;
//           padding: 7px 11px;
//           border-radius: 7px;
//           background: #f0f4fb;
//           color: #243958;
//           font-weight: 750;
//         }

//         .report-number {
//           text-align: right !important;
//         }

//         .report-table-state {
//           padding: 4px 18px 18px;
//         }

//         .report-clickable-row {
//           cursor: pointer;
//           transition: background .15s ease;
//         }

//         .report-clickable-row:hover {
//           background: #edf3ff !important;
//         }

//         .report-clickable-row:focus-visible {
//           outline: 2px solid #2458db;
//           outline-offset: -2px;
//         }

//         /* ---------- Voucher card (modal) ---------- */
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

//         .vm-input {
//           width: 100%;
//           height: 42px;
//           padding: 0 12px;
//           border: 1px solid #d9e1ed;
//           border-radius: 9px;
//           font-size: 13px;
//           color: #253653;
//           background: #fff;
//           outline: none;
//         }

//         .vm-input:focus {
//           border-color: #3972ed;
//           box-shadow: 0 0 0 3px rgba(57, 114, 237, .1);
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

//         .vm-qty-wrap {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           justify-content: flex-end;
//         }

//         .vm-qty-wrap .vm-input {
//           height: 36px;
//           text-align: right;
//         }

//         .vm-unit {
//           font-size: 12px;
//           color: #71809a;
//           white-space: nowrap;
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

//         .vm-select {
//           height: 40px;
//           padding: 0 8px;
//           border: 1px solid #dce3ed;
//           border-radius: 9px;
//           background: #fff;
//           color: #253653;
//           font-size: 13px;
//           font-weight: 600;
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

//         .vm-btn:disabled {
//           opacity: .6;
//           cursor: not-allowed;
//         }

//         @media (max-width: 1100px) {
//           .report-summary-grid {
//             gap: 14px;
//           }

//           .report-stat {
//             padding: 18px 16px;
//             gap: 12px;
//           }
//         }

//         @media (max-width: 700px) {
//           .reports-heading {
//             align-items: flex-start;
//           }

//           .reports-actions {
//             width: 100%;
//           }

//           .reports-actions .report-btn {
//             flex: 1;
//             padding: 0 10px;
//           }

//           .report-filter-panel {
//             padding: 17px;
//           }

//           .report-filter-fields {
//             grid-template-columns: 1fr;
//             gap: 14px;
//           }

//           .report-summary-grid {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .report-stat {
//             min-height: 0;
//             padding: 16px 14px;
//             gap: 12px;
//           }

//           .report-stat-icon {
//             width: 39px;
//             height: 39px;
//             flex-basis: 39px;
//           }

//           .report-stat-value {
//             font-size: 24px;
//           }

//           .report-table-head {
//             padding: 14px;
//           }

//           .report-filter-footer {
//             flex-wrap: wrap;
//           }

//           .vm-meta {
//             grid-template-columns: 1fr;
//           }

//           .vm-line {
//             grid-template-columns: 1fr;
//             gap: 8px;
//           }

//           .vm-qty-wrap {
//             justify-content: flex-start;
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

//       <div className="reports-page">
//         <div className="reports-heading">
//           <div>
//             <h1>Reports</h1>
//             <p className="reports-subtitle">
//               Business overview · {isoLabel(applied.from)} to {isoLabel(applied.to)}
//             </p>
//           </div>

//           <div className="reports-actions">
//             <button
//               type="button"
//               className="report-btn report-filter-btn"
//               onClick={() => setFiltersOpen((open) => !open)}
//               aria-expanded={filtersOpen}
//             >
//               <SlidersHorizontal size={16} />
//               Filters
//               {filtersOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
//             </button>

//             <button
//               type="button"
//               className="report-btn report-export-btn"
//               onClick={exportCsv}
//               disabled={loading || Boolean(error)}
//             >
//               <Download size={16} />
//               Export CSV
//             </button>
//           </div>
//         </div>

//         {filtersOpen && (
//           <section className="report-filter-panel">
//             <div className="report-filter-title">
//               <div>
//                 <h3>Report filters</h3>
//                 <p>Choose a period and product to view your report</p>
//               </div>

//               <button
//                 type="button"
//                 className="report-close"
//                 onClick={() => setFiltersOpen(false)}
//                 aria-label="Close filters"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             <div>
//               <span className="report-field-label">Quick period</span>

//               <div className="report-quick-ranges">
//                 {QUICK_RANGES.map((r) => (
//                   <button
//                     key={r.key}
//                     type="button"
//                     className={draft.range === r.key ? 'active' : ''}
//                     onClick={() => pickRange(r.key)}
//                   >
//                     {r.label}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="report-filter-fields">
//               <div>
//                 <label className="report-field-label" htmlFor="r-from">
//                   From date
//                 </label>
//                 <input
//                   id="r-from"
//                   type="date"
//                   value={draft.from}
//                   disabled={!custom}
//                   onChange={(e) =>
//                     setDraft((d) => ({ ...d, from: e.target.value }))
//                   }
//                 />
//               </div>

//               <div>
//                 <label className="report-field-label" htmlFor="r-to">
//                   To date
//                 </label>
//                 <input
//                   id="r-to"
//                   type="date"
//                   value={draft.to}
//                   disabled={!custom}
//                   onChange={(e) =>
//                     setDraft((d) => ({ ...d, to: e.target.value }))
//                   }
//                 />
//               </div>

//               <div>
//                 <label className="report-field-label" htmlFor="r-product">
//                   Product
//                 </label>
//                 <select
//                   id="r-product"
//                   value={draft.productId}
//                   onChange={(e) => pickProduct(e.target.value)}
//                 >
//                   <option value="">All products</option>
//                   {products.map((p) => (
//                     <option key={p.id} value={p.id}>
//                       {p.product_name} ({unitName[p.unit_id] ?? '—'})
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div className="report-filter-footer">
//               <button
//                 type="button"
//                 className="report-reset-btn"
//                 onClick={reset}
//               >
//                 <RotateCcw size={14} />
//                 Reset
//               </button>

//               <button
//                 type="button"
//                 className="report-btn report-generate-btn"
//                 onClick={generate}
//               >
//                 <Search size={15} />
//                 submit
//               </button>
//             </div>
//           </section>
//         )}

//         <div className="report-summary-grid">
//           <div className="report-stat">
//             <div className="report-stat-icon blue">
//               <Receipt size={24} />
//             </div>
//             <div className="report-stat-content">
//               <div className="report-stat-label">Total vouchers</div>
//               <div className="report-stat-value">{shownVouchers.length}</div>
//               <div className="report-stat-note">
//                 {isoLabel(applied.from)} – {isoLabel(applied.to)}
//               </div>
//             </div>
//           </div>

//           <div className="report-stat">
//             <div className="report-stat-icon purple">
//               <FileText size={24} />
//             </div>
//             <div className="report-stat-content">
//               <div className="report-stat-label">Billed entries</div>
//               <div className="report-stat-value">{shownLines.length}</div>
//               <div className="report-stat-note">Product line entries</div>
//             </div>
//           </div>

//           <button
//             type="button"
//             className="report-stat report-stat-link"
//             onClick={scrollToStock}
//             aria-label="Products in stock. Click to view the stock remaining table"
//           >
//             <div className="report-stat-icon green">
//               <Package size={24} />
//             </div>
//             <div className="report-stat-content">
//               <div className="report-stat-label">Products in stock</div>
//               <div className="report-stat-value">{stockGroups.length}</div>
//               <div className="report-stat-note">
//                 Products with remaining stock
//               </div>
//               <span className="report-stat-hint">
//                 View stock <ChevronDown size={13} />
//               </span>
//             </div>
//           </button>
//         </div>

//         <div className="report-tables">
//           <section className="report-table-card">
//             <div className="report-table-head">
//               <div className="report-table-heading">
//                 <div className="report-table-icon">
//                   <FileText size={22} />
//                 </div>
//                 <div>
//                   <h3>Billed Details</h3>
//                   <p>
//                     {isoLabel(applied.from)} – {isoLabel(applied.to)} · {productLabel}
//                   </p>
//                 </div>
//               </div>

//               <span className="report-count">
//                 {shownVouchers.length}{' '}
//                 {shownVouchers.length === 1 ? 'voucher' : 'vouchers'}
//               </span>
//             </div>

//             <div className="report-table-scroll">
//               <table className="report-table">
//                 <thead>
//                   <tr>
//                     <th style={{ width: 65 }}>S.No</th>
//                     <th>Voucher ID</th>
//                     <th>Date</th>
//                     <th>Products</th>
//                     <th className="report-number">Total Items</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {shownVouchers.map((v, i) => (
//                     <tr
//                       key={v.voucher_id}
//                       className="report-clickable-row"
//                       onClick={() => setOpenVoucherId(v.voucher_id)}
//                       onKeyDown={(e) => {
//                         if (e.key === 'Enter' || e.key === ' ') {
//                           e.preventDefault()
//                           setOpenVoucherId(v.voucher_id)
//                         }
//                       }}
//                       tabIndex={0}
//                       aria-label={`View voucher ${formatVoucher(v.voucher_number)}`}
//                       title="Click to view, edit or print this voucher"
//                     >
//                       <td className="report-muted">{i + 1}</td>
//                       <td>
//                         <span className="report-voucher">
//                           {formatVoucher(v.voucher_number)}
//                         </span>
//                       </td>
//                       <td className="report-muted">{formatDate(v.voucher_date)}</td>
//                       <td className="report-product-name">
//                         <span className="report-items">{itemsLabel(v.lines)}</span>
//                       </td>
//                       <td className="report-number">
//                         <span className="report-qty">{v.lines.length}</span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="report-table-state">
//               <TableState
//                 loading={loading}
//                 error={error}
//                 empty={!loading && !error && shownVouchers.length === 0}
//                 emptyText="No billings found for the selected filters."
//                 onRetry={reload}
//               />
//             </div>
//           </section>

//           <section className="report-table-card stock-card" ref={stockRef}>
//             <div className="report-table-head">
//               <div className="report-table-heading">
//                 <div className="report-table-icon stock">
//                   <Package size={22} />
//                 </div>
//                 <div>
//                   <h3>Stock Remaining</h3>
//                   <p>Available stock as on {todayLabel}</p>
//                 </div>
//               </div>

//               <span className="report-count">
//                 {stockGroups.length}{' '}
//                 {stockGroups.length === 1 ? 'product' : 'products'}
//               </span>
//             </div>

//             <div className="report-table-scroll">
//               <table className="report-table" style={{ minWidth: 450 }}>
//                 <thead>
//                   <tr>
//                     <th style={{ width: 65 }}>S.No</th>
//                     <th>Product</th>
//                     <th className="report-number">Remaining Quantity</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {stockGroups.map((g, i) => (
//                     <tr key={g.productId}>
//                       <td className="report-muted">{i + 1}</td>
//                       <td className="report-product-name">{g.name}</td>
//                       <td className="report-number">
//                         <span className="report-qty">
//                           {g.lines
//                             .map((s) =>
//                               formatQtyWithUnit(
//                                 s.remaining_stock,
//                                 unitName[s.unit_id],
//                               ),
//                             )
//                             .join(' / ')}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="report-table-state">
//               <TableState
//                 loading={loading}
//                 error={error}
//                 empty={!loading && !error && stock.length === 0}
//                 emptyText="No stock to show."
//                 onRetry={reload}
//               />
//             </div>
//           </section>
//         </div>

//         {openVoucher && (
//           <VoucherCard
//             key={openVoucher.voucher_id}
//             voucher={openVoucher}
//             onClose={() => setOpenVoucherId(null)}
//             onSaved={reload}
//           />
//         )}
//       </div>
//     </>
//   )
// }


import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Download,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
  Receipt,
  FileText,
  Pencil,
  Printer,
  Save,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react'

import TableState from '../components/TableState'
import useAsyncData from '../hooks/useAsyncData'
import useToast from '../hooks/useToast'
import { getVoucherDetails } from '../services/reportsService'
import {
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from '../services/vouchersService'
import { getProducts } from '../services/productsService'
import { getUnits } from '../services/unitsService'
import { getStock } from '../services/stockService'
import { getErrorMessage } from '../services/api'
import { QUICK_RANGES, getRange } from '../utils/dateRanges'
import { formatDate, formatQtyWithUnit, formatVoucher } from '../utils/format'
import PdfActionsModal from '../components/PdfActionsModal'
import { buildVoucherPdf, getPaperSize } from '../utils/voucherPdf'

const loadLookups = () => Promise.all([getProducts(), getUnits()])

const NO_ROWS = []

const initialFilters = () => ({
  range: 'today',
  ...getRange('today'),
  productId: '',
})

const isoLabel = (iso) => (iso ? formatDate(`${iso}T00:00:00`) : '')

const toInputDate = (d) => (d ? String(d).slice(0, 10) : '')

const itemsLabel = (lines) => {
  const names = lines.map((l) => l.product_name)
  const head = names.slice(0, 2).join(', ')
  return names.length > 2 ? `${head} +${names.length - 2} more` : head
}

const isValidQty = (q) => q !== '' && Number.isFinite(Number(q)) && Number(q) > 0

const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals, same as Billing

// One entry = one product in one unit. Units are never converted.
const rowKey = (productId, unitId) => `${productId}:${unitId}`

function csvCell(value) {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/* ------------------------------------------------------------------ */
/* Delete confirmation popup                                           */
/* requireText: if given, the user must type it before deleting        */
/* ------------------------------------------------------------------ */
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  requireText,
  busy,
  progress,
  onConfirm,
  onCancel,
}) {
  const [typed, setTyped] = useState('')
  const allowed = !requireText || typed.trim().toUpperCase() === requireText

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, busy])

  return (
    <div
      className="vm-backdrop vm-backdrop-top"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel()
      }}
    >
      <div
        className="vm-card vm-card-small"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="vm-head">
          <div className="vm-title">
            <div className="vm-icon danger">
              <Trash2 size={20} />
            </div>
            <div>
              <h3>{title}</h3>
              <p>This action cannot be undone</p>
            </div>
          </div>
        </div>

        <div className="vm-body">
          <p className="vm-message">{message}</p>

          {requireText && (
            <div style={{ marginTop: 16 }}>
              <label className="vm-label" htmlFor="vm-confirm-text">
                Type {requireText} to confirm
              </label>
              <input
                id="vm-confirm-text"
                type="text"
                className="vm-input"
                value={typed}
                autoComplete="off"
                autoFocus
                disabled={busy}
                onChange={(e) => setTyped(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="vm-foot">
          <button
            type="button"
            className="vm-btn"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="vm-btn danger-solid"
            onClick={onConfirm}
            disabled={busy || !allowed}
          >
            <Trash2 size={15} />
            {busy ? progress || 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Create voucher card                                                 */
/* ------------------------------------------------------------------ */
function CreateVoucherCard({ products, unitName, onClose, onCreated }) {
  const toast = useToast()
  const [date, setDate] = useState(() => getRange('today').from)
  const [rows, setRows] = useState([{ key: 0, itemKey: '', quantity: '' }])
  const [saving, setSaving] = useState(false)
  const {
    data: stock,
    loading: stockLoading,
    error: stockError,
    reload: reloadStock,
  } = useAsyncData(getStock)

  // Only product + unit entries that still have stock (like the Billing page).
  const options = useMemo(() => {
    const productById = Object.fromEntries(products.map((p) => [p.id, p]))

    return (stock ?? [])
      .filter(
        (s) =>
          Number(s.remaining_stock) > 0 &&
          productById[s.product_id]?.is_active !== false,
      )
      .map((s) => {
        const unitId = s.unit_id ?? productById[s.product_id]?.unit_id
        return {
          key: rowKey(s.product_id, unitId),
          productId: s.product_id,
          unitId,
          name:
            s.product_name ??
            productById[s.product_id]?.product_name ??
            `#${s.product_id}`,
          unit: unitName[unitId] ?? '',
          available: Number(s.remaining_stock),
        }
      })
      .sort(
        (a, b) => a.name.localeCompare(b.name) || a.unit.localeCompare(b.unit),
      )
  }, [stock, products, unitName])

  const optionFor = (itemKey) => options.find((o) => o.key === itemKey)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const setRow = (key, changes) =>
    setRows((list) =>
      list.map((r) => (r.key === key ? { ...r, ...changes } : r)),
    )

  const addRow = () =>
    setRows((list) => [
      ...list,
      {
        key: Math.max(...list.map((r) => r.key)) + 1,
        itemKey: '',
        quantity: '',
      },
    ])

  const removeRow = (key) =>
    setRows((list) => list.filter((r) => r.key !== key))

  const save = async () => {
    if (!date) return toast.error('Voucher date is required.')

    if (rows.some((r) => !optionFor(r.itemKey))) {
      return toast.error('Choose a product and unit in every row.')
    }

    const invalid = rows.find(
      (r) => !QTY_RE.test(r.quantity.trim()) || Number(r.quantity) <= 0,
    )
    if (invalid) {
      return toast.error(
        `${optionFor(invalid.itemKey).name}: enter a quantity greater than 0 (up to 3 decimals).`,
      )
    }

    const over = rows.find(
      (r) => Number(r.quantity) > optionFor(r.itemKey).available,
    )
    if (over) {
      const o = optionFor(over.itemKey)
      return toast.error(
        `${o.name}: you can bill at most ${formatQtyWithUnit(o.available, o.unit)}.`,
      )
    }

    setSaving(true)

    try {
      await createVoucher({
        voucher_date: date,
        items: rows.map((r) => {
          const o = optionFor(r.itemKey)
          return {
            product_id: o.productId,
            unit_id: o.unitId,
            quantity: Number(r.quantity),
          }
        }),
      })

      toast.success('Voucher created.')
      onCreated(date)
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Could not create the voucher.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="vm-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <div
        className="vm-card vm-card-wide"
        role="dialog"
        aria-modal="true"
        aria-label="Create voucher"
      >
        <div className="vm-head">
          <div className="vm-title">
            <div className="vm-icon">
              <Plus size={20} />
            </div>
            <div>
              <h3>Create Voucher</h3>
              <p>Choose a date and add products</p>
            </div>
          </div>

          <button
            type="button"
            className="vm-close"
            onClick={onClose}
            aria-label="Close"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="vm-body">
          <div className="vm-meta">
            <div>
              <label className="vm-label" htmlFor="vc-date">
                Voucher date
              </label>
              <input
                id="vc-date"
                type="date"
                className="vm-input"
                value={date}
                disabled={saving}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="vm-lines">
            <div className="vm-line vm-line-create vm-line-head">
              <span>Product</span>
              <span>Quantity</span>
              <span />
            </div>

            {rows.map((r, i) => (
              <div className="vm-line vm-line-create" key={r.key}>
                <select
                  className="vm-input"
                  value={r.itemKey}
                  disabled={saving || stockLoading}
                  aria-label={`Product and unit in row ${i + 1}`}
                  onChange={(e) =>
                    setRow(r.key, { itemKey: e.target.value, quantity: '' })
                  }
                >
                  <option value="">
                    {stockLoading
                      ? 'Loading…'
                      : options.length
                        ? 'Select product'
                        : 'No stock available'}
                  </option>
                  {options.map((o) => (
                    <option
                      key={o.key}
                      value={o.key}
                      disabled={rows.some(
                        (x) => x.key !== r.key && x.itemKey === o.key,
                      )}
                    >
                      {o.name} ({o.unit}) —{' '}
                      {formatQtyWithUnit(o.available, o.unit)} available
                    </option>
                  ))}
                </select>

                <div className="vm-qty-wrap">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="vm-input"
                    value={r.quantity}
                    placeholder="0"
                    disabled={saving}
                    aria-label={`Quantity in row ${i + 1}`}
                    onChange={(e) =>
                      setRow(r.key, { quantity: e.target.value })
                    }
                  />
                  <span className="vm-unit">
                    {optionFor(r.itemKey)?.unit ?? ''}
                  </span>
                </div>

                {/* <button
                  type="button"
                  className="vm-close"
                  onClick={() => removeRow(r.key)}
                  disabled={saving || rows.length === 1}
                  aria-label={`Remove row ${i + 1}`}
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button> */}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="vm-btn vm-add-row"
            onClick={addRow}
            disabled={saving || rows.length >= options.length}
          >
            <Plus size={15} />
            Add item
          </button>

          {stockError && (
            <TableState error={stockError} onRetry={reloadStock} />
          )}
        </div>

        <div className="vm-foot">
          <button
            type="button"
            className="vm-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="vm-btn primary"
            onClick={save}
            disabled={saving || stockLoading || Boolean(stockError)}
          >
            <Save size={15} />
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Voucher details / edit / print / delete card                        */
/* voucher: { voucher_id, voucher_number, voucher_date, lines: [...] } */
/* ------------------------------------------------------------------ */
function VoucherCard({ voucher, unitName, onClose, onSaved }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [date, setDate] = useState(toInputDate(voucher.voucher_date))
  const [qty, setQty] = useState(() =>
    voucher.lines.map((l) => String(l.quantity)),
  )

  // While a popup is open it handles Esc / outside clicks itself.
  const busy = saving || deleting || printOpen || confirmOpen

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  const cancelEdit = () => {
    setDate(toInputDate(voucher.voucher_date))
    setQty(voucher.lines.map((l) => String(l.quantity)))
    setEditing(false)
  }

  // Unit of a saved line: use its id, otherwise find it by unit name.
  const unitIdOf = (line) => {
    if (line.unit_id != null) return line.unit_id
    const match = Object.entries(unitName).find(
      ([, name]) => name === line.unit_name,
    )
    return match ? Number(match[0]) : undefined
  }

  const save = async () => {
    if (!date) return toast.error('Voucher date is required.')

    if (voucher.lines.some((l) => unitIdOf(l) === undefined)) {
      return toast.error('Units are still loading. Please try again.')
    }

    if (qty.some((q) => !isValidQty(q))) {
      return toast.error('Every quantity must be greater than zero.')
    }

    setSaving(true)

    try {
      await updateVoucher(voucher.voucher_id, {
        voucher_date: date,
        items: voucher.lines.map((l, i) => ({
          product_id: l.product_id,
          unit_id: unitIdOf(l),
          quantity: Number(qty[i]),
        })),
      })

      toast.success('Voucher updated.')
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Could not update the voucher.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)

    try {
      await deleteVoucher(voucher.voucher_id)

      toast.success('Voucher deleted.')
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Could not delete the voucher.')
    } finally {
      setDeleting(false)
    }
  }

  // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
  const buildPdf = () =>
    buildVoucherPdf({
      voucherNumber: voucher.voucher_number,
      date: voucher.voucher_date,
      items: voucher.lines.map((l) => ({
        name: l.product_name,
        quantity: Number(l.quantity),
        unit: l.unit_name,
      })),
      paper: getPaperSize(),
    })

  return (
    <div
      className="vm-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        className="vm-card"
        role="dialog"
        aria-modal="true"
        aria-label="Voucher details"
      >
        <div className="vm-head">
          <div className="vm-title">
            <div className="vm-icon">
              <Receipt size={20} />
            </div>
            <div>
              <h3>Voucher {formatVoucher(voucher.voucher_number)}</h3>
              <p>{editing ? 'Editing voucher' : 'Voucher details'}</p>
            </div>
          </div>

          <button
            type="button"
            className="vm-close"
            onClick={onClose}
            aria-label="Close"
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        <div className="vm-body">
          <div className="vm-meta">
            <div>
              <span className="vm-label">Voucher ID</span>
              <div className="vm-value">
                {formatVoucher(voucher.voucher_number)}
              </div>
            </div>

            <div>
              <label className="vm-label" htmlFor="vm-date">
                Date
              </label>
              {editing ? (
                <input
                  id="vm-date"
                  type="date"
                  className="vm-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              ) : (
                <div className="vm-value">{formatDate(voucher.voucher_date)}</div>
              )}
            </div>
          </div>

          <div className="vm-lines">
            <div className="vm-line vm-line-head">
              <span>Product</span>
              <span style={{ textAlign: 'right' }}>Billed Quantity</span>
            </div>

            {voucher.lines.map((l, i) => (
              <div className="vm-line" key={`${l.product_id}-${l.unit_name}-${i}`}>
                <b>{l.product_name}</b>

                {editing ? (
                  <div className="vm-qty-wrap">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="vm-input"
                      value={qty[i]}
                      aria-label={`Quantity for ${l.product_name}`}
                      onChange={(e) =>
                        setQty((q) =>
                          q.map((v, j) => (j === i ? e.target.value : v)),
                        )
                      }
                    />
                    <span className="vm-unit">{l.unit_name}</span>
                  </div>
                ) : (
                  <span style={{ textAlign: 'right', fontWeight: 700 }}>
                    {formatQtyWithUnit(l.quantity, l.unit_name)}
                  </span>
                )}
              </div>
            ))}

            <div className="vm-line vm-line-total">
              <b>Total Items</b>
              <span style={{ textAlign: 'right', fontWeight: 750 }}>
                {voucher.lines.length}
              </span>
            </div>
          </div>
        </div>

        <div className="vm-foot">
          {editing ? (
            <>
              <button
                type="button"
                className="vm-btn"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="vm-btn primary"
                onClick={save}
                disabled={saving}
              >
                <Save size={15} />
                {saving ? 'Saving…' : 'Update'}
              </button>
            </>
          ) : (
            <>
              <div className="vm-print">
                <button
                  type="button"
                  className="vm-btn"
                  onClick={() => setPrintOpen(true)}
                  aria-label="Print voucher"
                  title="Print / download / share voucher"
                >
                  <Printer size={17} />
                </button>
                <button
                  type="button"
                  className="vm-btn danger"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>

              <button type="button" className="vm-btn" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="vm-btn primary"
                onClick={() => setEditing(true)}
              >
                <Pencil size={15} />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {printOpen && (
        <PdfActionsModal
          title={`Print voucher ${formatVoucher(voucher.voucher_number)}`}
          build={buildPdf}
          onClose={() => setPrintOpen(false)}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          title={`Delete voucher ${formatVoucher(voucher.voucher_number)}?`}
          message={`This voucher dated ${formatDate(voucher.voucher_date)} with ${voucher.lines.length} item(s) will be permanently deleted.`}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={remove}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}

export default function Reports() {
  const toast = useToast()

  const [draft, setDraft] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openVoucherId, setOpenVoucherId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  // Vouchers waiting for "delete all" confirmation (null = popup closed)
  const [deleteList, setDeleteList] = useState(null)
  const [deletedCount, setDeletedCount] = useState(0)
  const [deletingAll, setDeletingAll] = useState(false)

  const { data: lookups } = useAsyncData(loadLookups)
  const [products, units] = lookups ?? [NO_ROWS, NO_ROWS]

  const unitName = useMemo(
    () => Object.fromEntries(units.map((u) => [u.id, u.unit_name])),
    [units],
  )

  // Load every line of every voucher in the period. The product filter is applied
  // below, so a voucher always keeps ALL its lines (needed for edit and print).
  const loadReport = useCallback(
    () =>
      getVoucherDetails({
        startDate: applied.from,
        endDate: applied.to,
      }),
    [applied.from, applied.to],
  )

  const { data, loading, error, reload } = useAsyncData(loadReport)

  const billed = data ?? NO_ROWS

  // One entry per voucher, with all its lines.
  const vouchers = useMemo(() => {
    const map = new Map()

    billed.forEach((r) => {
      if (!map.has(r.voucher_id)) {
        map.set(r.voucher_id, {
          voucher_id: r.voucher_id,
          voucher_number: r.voucher_number,
          voucher_date: r.voucher_date,
          lines: [],
        })
      }
      map.get(r.voucher_id).lines.push(r)
    })

    return [...map.values()]
  }, [billed])

  // Product filter: vouchers that contain the chosen product.
  const shownVouchers = useMemo(
    () =>
      !applied.productId
        ? vouchers
        : vouchers.filter((v) =>
            v.lines.some(
              (l) => String(l.product_id) === String(applied.productId),
            ),
          ),
    [vouchers, applied.productId],
  )

  const shownLines = useMemo(
    () => shownVouchers.flatMap((v) => v.lines),
    [shownVouchers],
  )

  const productLabel = applied.productId
    ? (() => {
        const p = products.find((x) => String(x.id) === String(applied.productId))
        return p ? p.product_name : 'Selected product'
      })()
    : 'All products'

  const openVoucher = useMemo(
    () =>
      openVoucherId == null
        ? null
        : vouchers.find((v) => v.voucher_id === openVoucherId) ?? null,
    [vouchers, openVoucherId],
  )

  const pickRange = (key) => {
    if (key === 'custom') {
      setDraft((d) => ({ ...d, range: 'custom' }))
      return
    }

    const next = {
      ...draft,
      range: key,
      ...getRange(key),
    }

    setDraft(next)
    setApplied(next)
  }

  const pickProduct = (productId) => {
    setDraft((d) => ({ ...d, productId }))
  }

  const generate = () => {
    if (!draft.from || !draft.to) {
      return toast.error('Choose both a start and end date.')
    }

    if (draft.from > draft.to) {
      return toast.error('Start date cannot be later than end date.')
    }

    setApplied(draft)
    setFiltersOpen(false)
  }

  const reset = () => {
    const fresh = initialFilters()
    setDraft(fresh)
    setApplied(fresh)
  }

  // After creating a voucher, make sure it is visible in the table.
  const handleCreated = (date) => {
    const inRange = date >= applied.from && date <= applied.to

    if (inRange && !applied.productId) {
      reload()
      return
    }

    const next = { range: 'custom', from: date, to: date, productId: '' }
    setDraft(next)
    setApplied(next)

    // Same dates as before: the loader will not re-run by itself.
    if (date === applied.from && date === applied.to) reload()
  }

  // Deletes the listed vouchers one by one.
  const deleteAll = async () => {
    setDeletingAll(true)
    setDeletedCount(0)

    let done = 0
    let failed = 0
    let firstError = null

    for (const v of deleteList) {
      try {
        await deleteVoucher(v.voucher_id)
        done += 1
        setDeletedCount(done)
      } catch (err) {
        failed += 1
        firstError = firstError ?? err
      }
    }

    if (failed) {
      toast.error(
        `${done} deleted, ${failed} failed. ${getErrorMessage(firstError) || ''}`.trim(),
      )
    } else {
      toast.success(`${done} ${done === 1 ? 'voucher' : 'vouchers'} deleted.`)
    }

    setDeletingAll(false)
    setDeleteList(null)
    reload()
  }

  const exportCsv = () => {
    if (!shownLines.length) {
      return toast.info('There is no data to export.')
    }

    const lines = [
      `Mothys Inventory Report`,
      `Period,${applied.from} to ${applied.to}`,
      `Product,${csvCell(productLabel)}`,
      '',
      'Billed Details',
      'S.No,Voucher ID,Product,Unit,Voucher Date,Billed Quantity',
      ...shownLines.map((r, i) =>
        [
          i + 1,
          formatVoucher(r.voucher_number),
          r.product_name,
          r.unit_name,
          formatDate(r.voucher_date),
          Number(r.quantity),
        ]
          .map(csvCell)
          .join(','),
      ),
    ]

    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    a.href = url
    a.download = `mothys-report-${applied.from}-to-${applied.to}.csv`
    a.click()

    URL.revokeObjectURL(url)
  }

  const custom = draft.range === 'custom'

  return (
    <>
      <style>{`
        .reports-page {
          width: 100%;
          color: var(--text, #17233f);
        }

        .reports-page * {
          box-sizing: border-box;
        }

        .reports-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .reports-heading h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 750;
          letter-spacing: -0.7px;
          color: #17233f;
        }

        .reports-subtitle {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .reports-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .reports-page .report-btn {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: .2s ease;
        }

        .reports-page .report-filter-btn {
          background: #fff;
          color: #1e3155;
          border: 1px solid #d7dfeb;
        }

        .reports-page .report-filter-btn:hover {
          border-color: #2563eb;
          color: #2563eb;
          background: #f8faff;
        }

        .reports-page .report-export-btn,
        .reports-page .report-create-btn,
        .reports-page .report-generate-btn {
          background: #2458db;
          color: #fff;
          border: 1px solid #2458db;
          box-shadow: 0 3px 8px rgba(36, 88, 219, .15);
        }

        .reports-page .report-export-btn:hover,
        .reports-page .report-create-btn:hover,
        .reports-page .report-generate-btn:hover {
          background: #1747c2;
          border-color: #1747c2;
          transform: translateY(-1px);
        }

        .reports-page .report-export-btn:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none;
        }

        .reports-page .report-delete-all-btn {
          min-height: 36px;
          padding: 0 13px;
          background: #fff;
          color: #c62828;
          border: 1px solid #f1c4c4;
          font-size: 12px;
        }

        .reports-page .report-delete-all-btn:hover {
          background: #fff3f3;
          border-color: #c62828;
        }

        .reports-page .report-delete-all-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .report-filter-panel {
          background: #fff;
          border: 1px solid #dce3ee;
          border-radius: 15px;
          padding: 23px 24px;
          margin-bottom: 24px;
          box-shadow: 0 5px 18px rgba(22, 39, 72, .045);
          animation: reportSlide .18s ease;
        }

        @keyframes reportSlide {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .report-filter-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
        }

        .report-filter-title h3 {
          margin: 0;
          color: #1c2b49;
          font-size: 16px;
          font-weight: 750;
        }

        .report-filter-title p {
          margin: 5px 0 0;
          font-size: 12px;
          color: #71809a;
        }

        .report-close {
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

        .report-close:hover {
          background: #e5edfa;
          color: #2458db;
        }

        .report-field-label {
          display: block;
          margin-bottom: 9px;
          font-size: 12px;
          font-weight: 700;
          color: #52627e;
        }

        .report-quick-ranges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 21px;
        }

        .report-quick-ranges button {
          min-height: 37px;
          padding: 0 15px;
          border: 1px solid #dce3ed;
          border-radius: 8px;
          background: #fff;
          color: #53627c;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: .18s ease;
        }

        .report-quick-ranges button:hover {
          border-color: #8eabed;
          color: #2458db;
          background: #f7f9ff;
        }

        .report-quick-ranges button.active {
          border-color: #2458db;
          background: #edf3ff;
          color: #2458db;
          box-shadow: inset 0 0 0 1px #2458db;
        }

        .report-filter-fields {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .report-filter-fields input,
        .report-filter-fields select {
          width: 100%;
          height: 44px;
          padding: 0 12px;
          border: 1px solid #d9e1ed;
          border-radius: 9px;
          outline: none;
          background: #fff;
          color: #253653;
          font-size: 13px;
        }

        .report-filter-fields input:focus,
        .report-filter-fields select:focus {
          border-color: #3972ed;
          box-shadow: 0 0 0 3px rgba(57, 114, 237, .10);
        }

        .report-filter-fields input:disabled {
          background: #f4f6fa;
          color: #9aa6b8;
          cursor: not-allowed;
        }

        .report-filter-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          border-top: 1px solid #edf0f5;
          margin-top: 22px;
          padding-top: 17px;
        }

        .report-reset-btn {
          min-height: 40px;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #dce3ed;
          border-radius: 9px;
          background: #fff;
          color: #52627e;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }

        .report-reset-btn:hover {
          background: #f6f8fc;
          color: #2458db;
        }

        .report-generate-btn {
          min-height: 40px !important;
          padding: 0 17px !important;
          border-radius: 9px !important;
          font-size: 12px !important;
        }

        .report-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .report-stat {
          min-width: 0;
          min-height: 145px;
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 22px 20px;
          border: 1px solid #dce3ed;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
        }

        .report-stat-icon {
          flex: 0 0 52px;
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 13px;
        }

        .report-stat-icon.blue {
          background: #eaf0ff;
          color: #2861e9;
        }

        .report-stat-icon.purple {
          background: #f1eaff;
          color: #8b42f6;
        }

        .report-stat-content {
          min-width: 0;
        }

        .report-stat-label {
          color: #64718a;
          font-size: 12px;
          font-weight: 650;
          line-height: 1.5;
        }

        .report-stat-value {
          margin-top: 5px;
          color: #1b2947;
          font-size: 29px;
          font-weight: 780;
          line-height: 1.15;
          letter-spacing: -.6px;
        }

        .report-stat-note {
          margin-top: 8px;
          color: #74819a;
          font-size: 11px;
          line-height: 1.5;
        }

        .report-table-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #dce3ed;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(22, 39, 72, .035);
        }

        .report-table-head {
          min-height: 82px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 17px 22px;
          border-bottom: 1px solid #e5eaf1;
        }

        .report-table-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .report-table-icon {
          flex: 0 0 44px;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #edf2ff;
          color: #2861e9;
        }

        .report-table-heading h3 {
          margin: 0;
          color: #1b2947;
          font-size: 15px;
          font-weight: 750;
        }

        .report-table-heading p {
          margin: 5px 0 0;
          color: #71809a;
          font-size: 11px;
        }

        .report-table-tools {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .report-count {
          flex: 0 0 auto;
          padding: 7px 12px;
          border-radius: 20px;
          background: #f0f4fa;
          color: #52627e;
          font-size: 11px;
          font-weight: 700;
        }

        .report-table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .report-table {
          width: 100%;
          min-width: 620px;
          border-collapse: collapse;
          text-align: left;
        }

        .report-table th {
          padding: 14px 18px;
          background: #f7f9fc;
          color: #65748e;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .55px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .report-table td {
          padding: 15px 18px;
          border-top: 1px solid #edf0f5;
          color: #293955;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }

        .report-table tbody tr {
          transition: background .15s ease;
        }

        .report-table tbody tr:hover {
          background: #f8faff;
        }

        .report-table .report-muted {
          color: #8290a6;
        }

        .report-voucher {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border: 1px solid #dce6ff;
          border-radius: 7px;
          background: #f1f5ff;
          color: #2458c7;
          font-size: 11px;
          font-weight: 750;
        }

        .report-items {
          display: inline-block;
          max-width: 320px;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
        }

        .report-product-name {
          color: #1d2c49 !important;
          font-weight: 700 !important;
        }

        .report-qty {
          display: inline-flex;
          justify-content: flex-end;
          min-width: 76px;
          padding: 7px 11px;
          border-radius: 7px;
          background: #f0f4fb;
          color: #243958;
          font-weight: 750;
        }

        .report-number {
          text-align: right !important;
        }

        .report-table-state {
          padding: 4px 18px 18px;
        }

        .report-clickable-row {
          cursor: pointer;
          transition: background .15s ease;
        }

        .report-clickable-row:hover {
          background: #edf3ff !important;
        }

        .report-clickable-row:focus-visible {
          outline: 2px solid #2458db;
          outline-offset: -2px;
        }

        /* ---------- Voucher card (modal) ---------- */
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

        .vm-backdrop-top {
          z-index: 1010;
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

        .vm-card-wide {
          max-width: 720px;
        }

        .vm-card-small {
          max-width: 430px;
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

        .vm-icon.danger {
          background: #fdecec;
          color: #c62828;
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

        .vm-close:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .vm-body {
          padding: 20px 22px;
          overflow-y: auto;
        }

        .vm-message {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #293955;
        }

        .vm-label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #52627e;
        }

        .vm-input {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #d9e1ed;
          border-radius: 9px;
          font-size: 13px;
          color: #253653;
          background: #fff;
          outline: none;
          box-sizing: border-box;
        }

        .vm-input:focus {
          border-color: #3972ed;
          box-shadow: 0 0 0 3px rgba(57, 114, 237, .1);
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
          flex-shrink: 0;
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

        .vm-line-create {
          grid-template-columns: minmax(0, 1fr) 150px 34px;
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

        .vm-qty-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
        }

        .vm-qty-wrap .vm-input {
          height: 36px;
          text-align: right;
          min-width: 0;
        }

        .vm-unit {
          font-size: 12px;
          color: #71809a;
          white-space: nowrap;
        }

        .vm-add-row {
          margin-top: 14px;
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
          justify-content: center;
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

        .vm-btn.danger {
          border-color: #f1c4c4;
          color: #c62828;
        }

        .vm-btn.danger:hover {
          background: #fff3f3;
        }

        .vm-btn.danger-solid {
          background: #c62828;
          border-color: #c62828;
          color: #fff;
        }

        .vm-btn.danger-solid:hover {
          background: #a91f1f;
        }

        .vm-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .report-summary-grid {
            gap: 14px;
          }

          .report-stat {
            padding: 18px 16px;
            gap: 12px;
          }
        }

        @media (max-width: 700px) {
          .reports-heading {
            align-items: flex-start;
          }

          .reports-actions {
            width: 100%;
          }

          .reports-actions .report-btn {
            flex: 1 1 130px;
            padding: 0 10px;
          }

          .report-filter-panel {
            padding: 17px;
          }

          .report-filter-fields {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .report-summary-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .report-stat {
            min-height: 0;
            padding: 16px 14px;
            gap: 12px;
          }

          .report-stat-icon {
            width: 39px;
            height: 39px;
            flex-basis: 39px;
          }

          .report-stat-value {
            font-size: 24px;
          }

          .report-table-head {
            padding: 14px;
          }

          .report-filter-footer {
            flex-wrap: wrap;
          }

          .vm-meta {
            grid-template-columns: 1fr;
          }

          .vm-line {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .vm-line-create.vm-line-head {
            display: none;
          }

          .vm-qty-wrap {
            justify-content: flex-start;
          }

          .vm-print {
            width: 100%;
            margin-right: 0;
          }

          .vm-print .vm-btn {
            flex: 1;
          }
        }
      `}</style>

      <div className="reports-page">
        <div className="reports-heading">
          <div>
            <h1>Reports</h1>
            <p className="reports-subtitle">
              Business overview · {isoLabel(applied.from)} to {isoLabel(applied.to)}
            </p>
          </div>

          <div className="reports-actions">
            <button
              type="button"
              className="report-btn report-create-btn"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={16} />
              Create Voucher
            </button>

            <button
              type="button"
              className="report-btn report-filter-btn"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={16} />
              Filters
              {filtersOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            <button
              type="button"
              className="report-btn report-export-btn"
              onClick={exportCsv}
              disabled={loading || Boolean(error)}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {filtersOpen && (
          <section className="report-filter-panel">
            <div className="report-filter-title">
              <div>
                <h3>Report filters</h3>
                <p>Choose a period and product to view your report</p>
              </div>

              <button
                type="button"
                className="report-close"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <span className="report-field-label">Quick period</span>

              <div className="report-quick-ranges">
                {QUICK_RANGES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    className={draft.range === r.key ? 'active' : ''}
                    onClick={() => pickRange(r.key)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="report-filter-fields">
              <div>
                <label className="report-field-label" htmlFor="r-from">
                  From date
                </label>
                <input
                  id="r-from"
                  type="date"
                  value={draft.from}
                  disabled={!custom}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, from: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="report-field-label" htmlFor="r-to">
                  To date
                </label>
                <input
                  id="r-to"
                  type="date"
                  value={draft.to}
                  disabled={!custom}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, to: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="report-field-label" htmlFor="r-product">
                  Product
                </label>
                <select
                  id="r-product"
                  value={draft.productId}
                  onChange={(e) => pickProduct(e.target.value)}
                >
                  <option value="">All products</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="report-filter-footer">
              <button
                type="button"
                className="report-reset-btn"
                onClick={reset}
              >
                <RotateCcw size={14} />
                Reset
              </button>

              <button
                type="button"
                className="report-btn report-generate-btn"
                onClick={generate}
              >
                <Search size={15} />
                Submit
              </button>
            </div>
          </section>
        )}

        <div className="report-summary-grid">
          <div className="report-stat">
            <div className="report-stat-icon blue">
              <Receipt size={24} />
            </div>
            <div className="report-stat-content">
              <div className="report-stat-label">Total vouchers</div>
              <div className="report-stat-value">{shownVouchers.length}</div>
              <div className="report-stat-note">
                {isoLabel(applied.from)} – {isoLabel(applied.to)}
              </div>
            </div>
          </div>

          <div className="report-stat">
            <div className="report-stat-icon purple">
              <FileText size={24} />
            </div>
            <div className="report-stat-content">
              <div className="report-stat-label">Billed entries</div>
              <div className="report-stat-value">{shownLines.length}</div>
              <div className="report-stat-note">Product line entries</div>
            </div>
          </div>
        </div>

        <section className="report-table-card">
          <div className="report-table-head">
            <div className="report-table-heading">
              <div className="report-table-icon">
                <FileText size={22} />
              </div>
              <div>
                <h3>Billed Details</h3>
                <p>
                  {isoLabel(applied.from)} – {isoLabel(applied.to)} · {productLabel}
                </p>
              </div>
            </div>

            <div className="report-table-tools">
              <span className="report-count">
                {shownVouchers.length}{' '}
                {shownVouchers.length === 1 ? 'voucher' : 'vouchers'}
              </span>

              <button
                type="button"
                className="report-btn report-delete-all-btn"
                onClick={() => setDeleteList(shownVouchers)}
                disabled={loading || Boolean(error) || !shownVouchers.length}
              >
                <Trash2 size={14} />
                Delete All
              </button>
            </div>
          </div>

          <div className="report-table-scroll">
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: 65 }}>S.No</th>
                  <th>Voucher ID</th>
                  <th>Products</th>
                  <th>Date</th>
                  <th className="report-number">Items</th>
                </tr>
              </thead>

              <tbody>
                {shownVouchers.map((v, i) => (
                  <tr
                    key={v.voucher_id}
                    className="report-clickable-row"
                    onClick={() => setOpenVoucherId(v.voucher_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setOpenVoucherId(v.voucher_id)
                      }
                    }}
                    tabIndex={0}
                    aria-label={`View voucher ${formatVoucher(v.voucher_number)}`}
                    title="Click to view, edit, print or delete this voucher"
                  >
                    <td className="report-muted">{i + 1}</td>
                    <td>
                      <span className="report-voucher">
                        {formatVoucher(v.voucher_number)}
                      </span>
                    </td>
                    <td className="report-product-name">
                      <span className="report-items">{itemsLabel(v.lines)}</span>
                    </td>
                    <td className="report-muted">{formatDate(v.voucher_date)}</td>
                    <td className="report-number">
                      <span className="report-qty">{v.lines.length}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="report-table-state">
            <TableState
              loading={loading}
              error={error}
              empty={!loading && !error && shownVouchers.length === 0}
              emptyText="No billings found for the selected filters."
              onRetry={reload}
            />
          </div>
        </section>

        {openVoucher && (
          <VoucherCard
            key={openVoucher.voucher_id}
            voucher={openVoucher}
            unitName={unitName}
            onClose={() => setOpenVoucherId(null)}
            onSaved={reload}
          />
        )}

        {createOpen && (
          <CreateVoucherCard
            products={products}
            unitName={unitName}
            onClose={() => setCreateOpen(false)}
            onCreated={handleCreated}
          />
        )}

        {deleteList && (
          <ConfirmDialog
            title="Delete all bills?"
            message={`${deleteList.length} voucher(s) from ${isoLabel(applied.from)} to ${isoLabel(applied.to)} (${productLabel}) will be permanently deleted, including every item in them.`}
            confirmLabel="Delete All"
            requireText="DELETE"
            busy={deletingAll}
            progress={`Deleting ${deletedCount} / ${deleteList.length}…`}
            onConfirm={deleteAll}
            onCancel={() => setDeleteList(null)}
          />
        )}
      </div>
    </>
  )
}
