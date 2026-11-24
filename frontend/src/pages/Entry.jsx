// import { useEffect, useMemo, useRef, useState } from 'react'
// import { Calendar, Clock, Pencil, Printer, Search, ChevronDown, Download, Share2 } from 'lucide-react'
// import Modal from '../components/Modal'
// import TableState from '../components/TableState'
// import useAsyncData from '../hooks/useAsyncData'
// import useToast from '../hooks/useToast'
// import useNow from '../hooks/useNow'
// import { getProducts } from '../services/productsService'
// import { getUnits } from '../services/unitsService'
// import { createStockEntry, createStockAdjustment } from '../services/stockService'
// import { getErrorMessage } from '../services/api'
// import { formatDate, formatQtyWithUnit, formatTime } from '../utils/format'

// const load = () => Promise.all([getProducts(), getUnits()])

// const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals

// // KGS always has its own Weight box. Matched by unit name, case-insensitive.
// const KGS_NAME = /^(kgs?|kilograms?)$/i
// const PCS_NAME = /^(pcs?|pieces?|nos)$/i
// const isKgs = (u) => KGS_NAME.test(String(u?.unit_name ?? '').trim())

// // Normalise whatever the backend returns into an array of unit ids.
// // Supports: unit_ids: [1,2] | units: [{id:1},...] | legacy unit_id: 1
// const getUnitIds = (p) => {
//   if (!p) return []
//   if (Array.isArray(p.unit_ids)) return p.unit_ids.map(Number)
//   if (Array.isArray(p.units)) return p.units.map((u) => Number(u?.id ?? u))
//   return p.unit_id != null ? [Number(p.unit_id)] : []
// }

// const STORAGE_KEY = 'entry-added-list'

// // The grid below the form keeps what was added, even after a refresh (this browser tab only).
// const loadSaved = () => {
//   try {
//     const raw = sessionStorage.getItem(STORAGE_KEY)
//     const list = raw ? JSON.parse(raw) : []
//     return Array.isArray(list) ? list : []
//   } catch {
//     return []
//   }
// }

// /*
//  * ENTRY page — stock IN only.
//  *  - Pick a product (type to search).
//  *  - Weight box: always shown, KGS.
//  *  - Quantity box: unit comes from the PRODUCT.
//  *      one non-KGS unit  -> shown as a fixed label (e.g. PCS)
//  *      several units     -> small arrow to switch (e.g. PCS / BUNDLE)
//  *  - "Add to List" posts a stock IN for each box that has a value and shows it in the grid below.
//  *  - Printer icon: download or share the list as PDF.
//  */
// export default function Entry() {
//   const toast = useToast()
//   const now = useNow()

//   const { data, loading, error, reload } = useAsyncData(load)
//   const [products, units] = data ?? [[], []]

//   const unitById = useMemo(() => Object.fromEntries(units.map((u) => [Number(u.id), u])), [units])
//   const kgsUnit = useMemo(() => units.find((u) => u.is_active !== false && isKgs(u)), [units])

//   const productOptions = useMemo(
//     () =>
//       products
//         .filter((p) => p.is_active)
//         .sort((a, b) => a.product_name.localeCompare(b.product_name)),
//     [products],
//   )
//   const productName = useMemo(
//     () => Object.fromEntries(products.map((p) => [p.id, p.product_name])),
//     [products],
//   )

//   const [productId, setProductId] = useState('')
//   const [productText, setProductText] = useState('') // text shown in the searchable box
//   const [pickerOpen, setPickerOpen] = useState(false)
//   const [pickerIndex, setPickerIndex] = useState(-1)
//   const [kgs, setKgs] = useState('')
//   const [qty, setQty] = useState('')
//   const [qtyUnitId, setQtyUnitId] = useState('')
//   const [addError, setAddError] = useState('')
//   const [adding, setAdding] = useState(false)
//   const [added, setAdded] = useState(loadSaved) // grid rows, newest first
//   const [editRow, setEditRow] = useState(null) // { row, value }
//   const [editError, setEditError] = useState('')
//   const [editBusy, setEditBusy] = useState(false)
//   const [printOpen, setPrintOpen] = useState(false)
//   const [printBusy, setPrintBusy] = useState(false)
//   const productInputRef = useRef(null)

//   useEffect(() => {
//     try {
//       sessionStorage.setItem(STORAGE_KEY, JSON.stringify(added))
//     } catch {
//       /* storage unavailable — the grid still works for this visit */
//     }
//   }, [added])

//   const selectedProduct = useMemo(
//     () => products.find((p) => String(p.id) === String(productId)),
//     [products, productId],
//   )

//   // Units of the chosen product.
//   const productUnits = useMemo(
//     () =>
//       getUnitIds(selectedProduct)
//         .map((id) => unitById[id])
//         .filter((u) => u && u.is_active !== false),
//     [selectedProduct, unitById],
//   )
//   const productHasKgs = productUnits.some(isKgs)
//   // Everything except KGS goes in the Quantity box (PCS, BUNDLE, ...).
//   const qtyUnits = useMemo(() => productUnits.filter((u) => !isKgs(u)), [productUnits])
//   const defaultQtyUnit = useMemo(() => qtyUnits.find((u) => PCS_NAME.test(String(u.unit_name).trim())) ?? qtyUnits[0], [qtyUnits])

//   // Valid selection: keep the user's choice only if the product still has that unit.
//   const selectedQtyUnit = qtyUnits.find((u) => String(u.id) === String(qtyUnitId)) ?? defaultQtyUnit

//   const weightDisabled = adding || (Boolean(selectedProduct) && !productHasKgs)
//   const qtyDisabled = adding || !selectedProduct || qtyUnits.length === 0

//   // Product search: filters as you type.
//   const filteredProducts = useMemo(() => {
//     const q = productText.trim().toLowerCase()
//     // When the box shows the chosen product, show the full list again.
//     const showAll = selectedProduct && q === selectedProduct.product_name.toLowerCase()
//     return productOptions.filter((p) => showAll || q === '' || p.product_name.toLowerCase().includes(q))
//   }, [productOptions, productText, selectedProduct])

//   const unitNamesOf = (p) =>
//     getUnitIds(p)
//       .map((id) => unitById[id]?.unit_name)
//       .filter(Boolean)
//       .join(', ')

//   const chooseProduct = (p) => {
//     setProductId(String(p.id))
//     setProductText(p.product_name)
//     setPickerOpen(false)
//     setPickerIndex(-1)
//     setAddError('')
//     // New product -> its own units; clear boxes and unit choice.
//     setKgs('')
//     setQty('')
//     setQtyUnitId('')
//   }

//   const clearProduct = () => {
//     setProductId('')
//     setKgs('')
//     setQty('')
//     setQtyUnitId('')
//   }

//   const onProductKeyDown = (e) => {
//     if (e.key === 'ArrowDown') {
//       e.preventDefault()
//       setPickerOpen(true)
//       setPickerIndex((i) => Math.min(i + 1, filteredProducts.length - 1))
//     } else if (e.key === 'ArrowUp') {
//       e.preventDefault()
//       setPickerIndex((i) => Math.max(i - 1, 0))
//     } else if (e.key === 'Enter' && pickerOpen) {
//       e.preventDefault()
//       const pick = filteredProducts[pickerIndex >= 0 ? pickerIndex : 0]
//       if (pick && (pickerIndex >= 0 || filteredProducts.length === 1)) chooseProduct(pick)
//     } else if (e.key === 'Escape') {
//       setPickerOpen(false)
//     }
//   }

//   const handleAdd = async (e) => {
//     e.preventDefault()
//     if (adding) return

//     const kgsVal = kgs.trim()
//     const qtyVal = qty.trim()

//     if (!selectedProduct) return setAddError('Select a product.')
//     if (!kgsVal && !qtyVal) return setAddError('Enter a weight (KGS) or a quantity.')
//     if (kgsVal && (!QTY_RE.test(kgsVal) || Number(kgsVal) <= 0))
//       return setAddError('KGS must be greater than 0 (up to 3 decimals).')
//     if (qtyVal && (!QTY_RE.test(qtyVal) || Number(qtyVal) <= 0))
//       return setAddError('Quantity must be greater than 0 (up to 3 decimals).')
//     if (kgsVal && !kgsUnit) return setAddError('Unit "KGS" does not exist. Create it on the Units page.')
//     if (kgsVal && !productHasKgs)
//       return setAddError(`"${selectedProduct.product_name}" does not have the KGS unit. Add it from the Products page.`)
//     if (qtyVal && !selectedQtyUnit)
//       return setAddError(`"${selectedProduct.product_name}" has no PCS/BUNDLE unit. Add it from the Products page.`)

//     setAddError('')
//     setAdding(true)

//     const pid = Number(productId)
//     const pname = productName[pid] ?? `#${pid}`
//     const jobs = []
//     if (kgsVal) jobs.push({ unit: kgsUnit, value: Number(kgsVal), clear: () => setKgs('') })
//     if (qtyVal) jobs.push({ unit: selectedQtyUnit, value: Number(qtyVal), clear: () => setQty('') })

//     const saved = []
//     const failed = []
//     const rowsAdded = []
//     // Sequential, so a failure on one unit never hides the other result.
//     for (const job of jobs) {
//       try {
//         await createStockEntry(pid, job.value, Number(job.unit.id))
//         job.clear()
//         saved.push(formatQtyWithUnit(job.value, job.unit.unit_name))
//         rowsAdded.push({
//           id: `${Date.now()}-${job.unit.id}`,
//           productId: pid,
//           productName: pname,
//           quantity: job.value,
//           unit: job.unit.unit_name,
//           unitId: Number(job.unit.id),
//           at: new Date().toISOString(),
//         })
//       } catch (err) {
//         failed.push(`${job.unit.unit_name}: ${getErrorMessage(err)}`)
//       }
//     }

//     if (rowsAdded.length) setAdded((prev) => [...rowsAdded, ...prev])
//     if (saved.length) toast.success(`Stock added: ${saved.join(' + ')}.`)
//     if (failed.length) {
//       const message = failed.join(' | ')
//       setAddError(message)
//       toast.error(message)
//     }
//     setAdding(false)
//   }

//   const openEdit = (r) => {
//     setEditError('')
//     setEditRow({ row: r, value: String(r.quantity) })
//   }

//   // Change the quantity of an added row. Stock is corrected by the difference.
//   const saveEdit = async (e) => {
//     e.preventDefault()
//     if (editBusy || !editRow) return
//     const { row } = editRow
//     const text = editRow.value.trim()
//     if (!QTY_RE.test(text) || Number(text) <= 0)
//       return setEditError('Quantity must be greater than 0 (up to 3 decimals).')
//     const newQty = Number(text)
//     const delta = Math.round((newQty - Number(row.quantity)) * 1000) / 1000
//     if (delta === 0) return setEditRow(null)

//     const unitId =
//       row.unitId ?? units.find((u) => String(u.unit_name).trim() === String(row.unit).trim())?.id
//     if (!unitId) return setEditError('Unit not found for this row.')

//     setEditError('')
//     setEditBusy(true)
//     try {
//       if (delta > 0) {
//         await createStockEntry(Number(row.productId), delta, Number(unitId))
//       } else {
//         await createStockAdjustment(Number(row.productId), delta, Number(unitId))
//       }
//       setAdded((prev) => prev.map((r) => (r.id === row.id ? { ...r, quantity: newQty } : r)))
//       toast.success(`Updated to ${formatQtyWithUnit(newQty, row.unit)}.`)
//       setEditRow(null)
//     } catch (err) {
//       setEditError(getErrorMessage(err))
//     } finally {
//       setEditBusy(false)
//     }
//   }

//   // Product names shown in the list always follow the latest edited name.
//   const rowName = (r) => productName[r.productId] ?? r.productName

//   /* ---------------- PDF: download / share ---------------- */
//   const buildPdf = async () => {
//     const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
//     const autoTable = autoTableModule.default ?? autoTableModule.autoTable
//     const doc = new jsPDF()
//     const stamp = new Date()
//     doc.setFontSize(16)
//     doc.text('Stock Entry List', 14, 16)
//     doc.setFontSize(10)
//     doc.text(`${formatDate(stamp)}  ${formatTime(stamp)}`, 14, 23)
//     autoTable(doc, {
//       startY: 28,
//       head: [['S.No', 'Product', 'Quantity', 'Added At']],
//       body: added.map((r, i) => [
//         String(i + 1),
//         rowName(r),
//         formatQtyWithUnit(r.quantity, r.unit),
//         formatTime(new Date(r.at)),
//       ]),
//       headStyles: { fillColor: [29, 78, 216] },
//       styles: { fontSize: 10 },
//     })
//     const fileName = `entry-list-${stamp.toISOString().slice(0, 10)}.pdf`
//     return { doc, fileName }
//   }

//   const downloadPdf = async () => {
//     setPrintBusy(true)
//     try {
//       const { doc, fileName } = await buildPdf()
//       doc.save(fileName)
//       setPrintOpen(false)
//     } catch (err) {
//       toast.error(`Could not create the PDF. ${getErrorMessage(err)}`)
//     } finally {
//       setPrintBusy(false)
//     }
//   }

//   const sharePdf = async () => {
//     setPrintBusy(true)
//     try {
//       const { doc, fileName } = await buildPdf()
//       const file = new File([doc.output('blob')], fileName, { type: 'application/pdf' })
//       if (navigator.canShare?.({ files: [file] })) {
//         await navigator.share({ files: [file], title: 'Stock Entry List' })
//         setPrintOpen(false)
//       } else {
//         // This browser can't share files: download instead.
//         doc.save(fileName)
//         toast.success('Sharing is not supported in this browser. The PDF was downloaded instead.')
//         setPrintOpen(false)
//       }
//     } catch (err) {
//       if (err?.name !== 'AbortError') toast.error(`Could not share the PDF. ${getErrorMessage(err)}`)
//     } finally {
//       setPrintBusy(false)
//     }
//   }

//   return (
//     <>
//       <style>{`
//         .entry-grid {
//           display: grid;
//           grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.2fr) auto;
//           gap: 16px;
//           align-items: end;
//         }

//         .entry-grid .input-wrap {
//           width: 100%;
//         }

//         /* Searchable product box */
//         .combo {
//           position: relative;
//           width: 100%;
//         }

//         .combo > svg.lead {
//           position: absolute;
//           left: 14px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #8a97ad;
//           pointer-events: none;
//         }

//         .combo .input {
//           padding-left: 42px;
//           padding-right: 40px;
//         }

//         .combo > svg.trail {
//           position: absolute;
//           right: 14px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #64748b;
//           pointer-events: none;
//         }

//         .combo-list {
//           position: absolute;
//           top: calc(100% + 4px);
//           left: 0;
//           right: 0;
//           z-index: 30;
//           max-height: 260px;
//           margin: 0;
//           padding: 4px;
//           overflow-y: auto;
//           list-style: none;
//           background: #fff;
//           border: 1px solid #d9e1ed;
//           border-radius: 10px;
//           box-shadow: 0 10px 28px rgba(15, 30, 66, .14);
//         }

//         .combo-item {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           width: 100%;
//           padding: 9px 10px;
//           border: 0;
//           border-radius: 8px;
//           background: transparent;
//           color: #253653;
//           font-size: 14px;
//           font-weight: 600;
//           text-align: left;
//           cursor: pointer;
//         }

//         .combo-item:hover,
//         .combo-item.active {
//           background: #eef3ff;
//           color: #1d4ed8;
//         }

//         .combo-item small {
//           color: #8a97ad;
//           font-size: 12px;
//           font-weight: 600;
//         }

//         .combo-empty {
//           padding: 12px 10px;
//           color: #8a97ad;
//           font-size: 14px;
//         }

//         /* Quantity box: unit is fixed text, or a small arrow when the product has several units */
//         .qty-wrap {
//           position: relative;
//           display: flex;
//           align-items: center;
//           width: 100%;
//         }

//         .qty-wrap .input {
//           width: 100%;
//           padding-right: 96px;
//         }

//         .qty-unit {
//           position: absolute;
//           right: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           display: inline-flex;
//           align-items: center;
//           gap: 2px;
//           color: #64748b;
//           font-size: 14px;
//           font-weight: 700;
//           pointer-events: none;
//         }

//         .qty-unit-select {
//           position: absolute;
//           right: 6px;
//           top: 50%;
//           transform: translateY(-50%);
//           height: 32px;
//           max-width: 90px;
//           padding: 0 22px 0 8px;
//           border: 0;
//           border-radius: 8px;
//           background: #eef3ff;
//           color: #1d4ed8;
//           font-size: 13px;
//           font-weight: 700;
//           cursor: pointer;
//           appearance: none;
//           -webkit-appearance: none;
//         }

//         .qty-wrap > svg.arrow {
//           position: absolute;
//           right: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #1d4ed8;
//           pointer-events: none;
//         }

//         .added-actions {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//         }

//         .print-options {
//           display: grid;
//           gap: 12px;
//         }

//         .print-options .btn {
//           justify-content: center;
//           width: 100%;
//         }

//         @media (max-width: 900px) {
//           .entry-grid {
//             grid-template-columns: 1fr 1fr;
//           }

//           .entry-grid .field-product,
//           .entry-grid .btn {
//             grid-column: 1 / -1;
//           }
//         }

//         @media (max-width: 520px) {
//           .entry-grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>

//       <div className="page-head">
//         <h1>Entry</h1>
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
//         <form className="card" onSubmit={handleAdd} noValidate>
//           <h2 className="card-title">Add Product Entry</h2>

//           <div className="entry-grid">
//             <div className="field field-product">
//               <label htmlFor="en-product">
//                 Product <span className="req">*</span>
//               </label>
//               <div className="combo">
//                 <Search size={18} className="lead" />
//                 <input
//                   id="en-product"
//                   ref={productInputRef}
//                   className="input"
//                   placeholder={loading ? 'Loading products…' : 'Search or select product'}
//                   value={productText}
//                   autoComplete="off"
//                   role="combobox"
//                   aria-expanded={pickerOpen}
//                   aria-controls="en-product-list"
//                   disabled={loading || adding}
//                   onChange={(e) => {
//                     setProductText(e.target.value)
//                     setPickerOpen(true)
//                     setPickerIndex(-1)
//                     // typing again after a pick means the old pick no longer applies
//                     if (productId) clearProduct()
//                   }}
//                   onFocus={(e) => {
//                     setPickerOpen(true)
//                     e.target.select()
//                   }}
//                   onBlur={() => {
//                     setPickerOpen(false)
//                     // leave the box showing the chosen product, or empty if nothing is chosen
//                     setProductText(selectedProduct ? selectedProduct.product_name : '')
//                   }}
//                   onKeyDown={onProductKeyDown}
//                 />
//                 <ChevronDown size={18} className="trail" />
//                 {pickerOpen && (
//                   <ul className="combo-list" id="en-product-list" role="listbox">
//                     {filteredProducts.length === 0 && <li className="combo-empty">No product found.</li>}
//                     {filteredProducts.map((p, i) => (
//                       <li key={p.id} role="option" aria-selected={String(p.id) === String(productId)}>
//                         <button
//                           type="button"
//                           className={`combo-item ${i === pickerIndex ? 'active' : ''}`}
//                           // mousedown (not click) so the input does not blur and close the list first
//                           onMouseDown={(e) => {
//                             e.preventDefault()
//                             chooseProduct(p)
//                           }}
//                         >
//                           <span>{p.product_name}</span>
//                           <small>{unitNamesOf(p)}</small>
//                         </button>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </div>
//             </div>

//             <div className="field">
//               <label htmlFor="en-kgs">Weight</label>
//               <div className="input-wrap">
//                 <input
//                   id="en-kgs"
//                   inputMode="decimal"
//                   className="input"
//                   placeholder="0.000"
//                   value={kgs}
//                   onChange={(e) => setKgs(e.target.value)}
//                   disabled={weightDisabled}
//                 />
//                 <span className="input-suffix">KGS</span>
//               </div>
//             </div>

//             <div className="field">
//               <label htmlFor="en-qty">Quantity</label>
//               <div className="qty-wrap">
//                 <input
//                   id="en-qty"
//                   inputMode="decimal"
//                   className="input"
//                   placeholder={selectedProduct && qtyUnits.length === 0 ? 'Not applicable' : 'Enter quantity'}
//                   value={qty}
//                   onChange={(e) => setQty(e.target.value)}
//                   disabled={qtyDisabled}
//                 />
//                 {qtyUnits.length === 1 && <span className="qty-unit">{qtyUnits[0].unit_name}</span>}
//                 {qtyUnits.length > 1 && (
//                   <>
//                     <select
//                       className="qty-unit-select"
//                       aria-label="Quantity unit"
//                       value={selectedQtyUnit ? String(selectedQtyUnit.id) : ''}
//                       onChange={(e) => setQtyUnitId(e.target.value)}
//                       disabled={adding}
//                     >
//                       {qtyUnits.map((u) => (
//                         <option key={u.id} value={u.id}>
//                           {u.unit_name}
//                         </option>
//                       ))}
//                     </select>
//                     <ChevronDown size={14} className="arrow" />
//                   </>
//                 )}
//               </div>
//             </div>

//             <button type="submit" className="btn btn-primary" disabled={loading || adding || Boolean(error)}>
//               {adding && <span className="spinner" />}
//               Add to List
//             </button>
//           </div>

//           {error && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               Could not load products/units.{' '}
//               <button type="button" className="btn btn-outline" onClick={reload}>
//                 Retry
//               </button>
//             </p>
//           )}
//           {selectedProduct && !productHasKgs && (
//             <p className="field-hint" style={{ marginTop: 8 }}>
//               This product has no KGS unit, so Weight is off. It is entered in {qtyUnits.map((u) => u.unit_name).join(' / ') || 'no unit'}.
//             </p>
//           )}
//           {!loading && !error && !kgsUnit && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               Create a unit named “KGS” on the Units page to use the Weight box.
//             </p>
//           )}
//           {addError && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               {addError}
//             </p>
//           )}
//         </form>

//         <div className="table-card">
//           <div className="report-head added-actions">
//             <span>Added Products ({added.length})</span>
//             {added.length > 0 && (
//               <button
//                 type="button"
//                 className="icon-btn icon-btn-blue"
//                 aria-label="Print / share list"
//                 title="Print / share list"
//                 onClick={() => setPrintOpen(true)}
//               >
//                 <Printer size={16} />
//               </button>
//             )}
//           </div>
//           <div className="table-scroll">
//             <table className="data">
//               <thead>
//                 <tr>
//                   <th style={{ width: 90 }}>S.No</th>
//                   <th>Product</th>
//                   <th>Quantity</th>
//                   <th>Added At</th>
//                   <th className="center">Edit</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {added.map((r, i) => (
//                   <tr key={r.id}>
//                     <td>{i + 1}</td>
//                     <td>{rowName(r)}</td>
//                     <td>{formatQtyWithUnit(r.quantity, r.unit)}</td>
//                     <td>{formatTime(new Date(r.at))}</td>
//                     <td className="center">
//                       <div className="actions">
//                         <button
//                           type="button"
//                           className="icon-btn icon-btn-blue"
//                           aria-label="Edit entry"
//                           title="Edit"
//                           onClick={() => openEdit(r)}
//                         >
//                           <Pencil size={15} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <TableState
//             loading={false}
//             error={null}
//             empty={added.length === 0}
//             emptyText="Nothing added yet. Choose a product, enter a quantity and click “Add to List”."
//             onRetry={reload}
//           />
//         </div>
//       </div>

//       {editRow && (
//         <Modal title="Edit Entry" onClose={() => !editBusy && setEditRow(null)} busy={editBusy}>
//           <form onSubmit={saveEdit} className="stack" style={{ gap: 16 }} noValidate>
//             {editError && <div className="form-error">{editError}</div>}
//             <div className="field">
//               <label>Product</label>
//               <input className="input" value={rowName(editRow.row)} disabled />
//             </div>
//             <div className="field">
//               <label htmlFor="ee-qty">
//                 Quantity ({editRow.row.unit}) <span className="req">*</span>
//               </label>
//               <input
//                 id="ee-qty"
//                 inputMode="decimal"
//                 className="input"
//                 value={editRow.value}
//                 onChange={(ev) => setEditRow((s) => ({ ...s, value: ev.target.value }))}
//                 autoFocus
//               />
//             </div>
//             <div className="modal-actions">
//               <button type="button" className="btn btn-outline" onClick={() => setEditRow(null)} disabled={editBusy}>
//                 Cancel
//               </button>
//               <button type="submit" className="btn btn-primary" disabled={editBusy}>
//                 {editBusy && <span className="spinner" />}
//                 Save Changes
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}

//       {printOpen && (
//         <Modal title="Print list" onClose={() => !printBusy && setPrintOpen(false)} busy={printBusy}>
//           <div className="print-options">
//             <button type="button" className="btn btn-primary" onClick={downloadPdf} disabled={printBusy}>
//               {printBusy ? <span className="spinner" /> : <Download size={16} />} Download as PDF
//             </button>
//             <button type="button" className="btn btn-success" onClick={sharePdf} disabled={printBusy}>
//               {printBusy ? <span className="spinner" /> : <Share2 size={16} />} Share as PDF
//             </button>
//             <p className="field-hint" style={{ margin: 0 }}>
//               Share opens your device's share menu (WhatsApp, Gmail, Teams, etc.).
//             </p>
//           </div>
//         </Modal>
//       )}
//     </>
//   )
// }



// import { useEffect, useMemo, useRef, useState } from 'react'
// import { Calendar, Clock, Download, Pencil, Printer, Search, ChevronDown } from 'lucide-react'
// import Modal from '../components/Modal'
// import TableState from '../components/TableState'
// import useAsyncData from '../hooks/useAsyncData'
// import useToast from '../hooks/useToast'
// import useNow from '../hooks/useNow'
// import { getProducts } from '../services/productsService'
// import { getUnits } from '../services/unitsService'
// import { createStockEntry, createStockAdjustment } from '../services/stockService'
// import { getErrorMessage } from '../services/api'
// import { formatDate, formatQtyWithUnit, formatTime } from '../utils/format'
// import PdfActionsModal from '../components/PdfActionsModal'
// import { buildEntryListPdf } from '../utils/voucherPdf'
// import { downloadCsv, todayStamp } from '../utils/pdfActions'

// const load = () => Promise.all([getProducts(), getUnits()])

// const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals

// // KGS always has its own Weight box. Matched by unit name, case-insensitive.
// const KGS_NAME = /^(kgs?|kilograms?)$/i
// const PCS_NAME = /^(pcs?|pieces?|nos)$/i
// const isKgs = (u) => KGS_NAME.test(String(u?.unit_name ?? '').trim())

// // Normalise whatever the backend returns into an array of unit ids.
// // Supports: unit_ids: [1,2] | units: [{id:1},...] | legacy unit_id: 1
// const getUnitIds = (p) => {
//   if (!p) return []
//   if (Array.isArray(p.unit_ids)) return p.unit_ids.map(Number)
//   if (Array.isArray(p.units)) return p.units.map((u) => Number(u?.id ?? u))
//   return p.unit_id != null ? [Number(p.unit_id)] : []
// }

// const STORAGE_KEY = 'entry-added-list'

// // The grid below the form keeps what was added, even after a refresh (this browser tab only).
// const loadSaved = () => {
//   try {
//     const raw = sessionStorage.getItem(STORAGE_KEY)
//     const list = raw ? JSON.parse(raw) : []
//     return Array.isArray(list) ? list : []
//   } catch {
//     return []
//   }
// }

// /*
//  * ENTRY page — stock IN only.
//  *  - Pick a product (type to search).
//  *  - Weight box: always shown, KGS.
//  *  - Quantity box: unit comes from the PRODUCT.
//  *      one non-KGS unit  -> shown as a fixed label (e.g. PCS)
//  *      several units     -> small arrow to switch (e.g. PCS / BUNDLE)
//  *  - "Add to List" posts a stock IN for each box that has a value and shows it in the grid below.
//  *  - Printer icon: download or share the list as PDF.
//  */
// export default function Entry() {
//   const toast = useToast()
//   const now = useNow()

//   const { data, loading, error, reload } = useAsyncData(load)
//   const [products, units] = data ?? [[], []]

//   const unitById = useMemo(() => Object.fromEntries(units.map((u) => [Number(u.id), u])), [units])
//   const kgsUnit = useMemo(() => units.find((u) => u.is_active !== false && isKgs(u)), [units])

//   const productOptions = useMemo(
//     () =>
//       products
//         .filter((p) => p.is_active)
//         .sort((a, b) => a.product_name.localeCompare(b.product_name)),
//     [products],
//   )
//   const productName = useMemo(
//     () => Object.fromEntries(products.map((p) => [p.id, p.product_name])),
//     [products],
//   )

//   const [productId, setProductId] = useState('')
//   const [productText, setProductText] = useState('') // text shown in the searchable box
//   const [pickerOpen, setPickerOpen] = useState(false)
//   const [pickerIndex, setPickerIndex] = useState(-1)
//   const [kgs, setKgs] = useState('')
//   const [qty, setQty] = useState('')
//   const [qtyUnitId, setQtyUnitId] = useState('')
//   const [addError, setAddError] = useState('')
//   const [adding, setAdding] = useState(false)
//   const [added, setAdded] = useState(loadSaved) // grid rows, newest first
//   const [editRow, setEditRow] = useState(null) // { row, value }
//   const [editError, setEditError] = useState('')
//   const [editBusy, setEditBusy] = useState(false)
//   const [printOpen, setPrintOpen] = useState(false)
//   const productInputRef = useRef(null)

//   useEffect(() => {
//     try {
//       sessionStorage.setItem(STORAGE_KEY, JSON.stringify(added))
//     } catch {
//       /* storage unavailable — the grid still works for this visit */
//     }
//   }, [added])

//   const selectedProduct = useMemo(
//     () => products.find((p) => String(p.id) === String(productId)),
//     [products, productId],
//   )

//   // Units of the chosen product.
//   const productUnits = useMemo(
//     () =>
//       getUnitIds(selectedProduct)
//         .map((id) => unitById[id])
//         .filter((u) => u && u.is_active !== false),
//     [selectedProduct, unitById],
//   )
//   const productHasKgs = productUnits.some(isKgs)
//   // Everything except KGS goes in the Quantity box (PCS, BUNDLE, ...).
//   const qtyUnits = useMemo(() => productUnits.filter((u) => !isKgs(u)), [productUnits])
//   const defaultQtyUnit = useMemo(() => qtyUnits.find((u) => PCS_NAME.test(String(u.unit_name).trim())) ?? qtyUnits[0], [qtyUnits])

//   // Valid selection: keep the user's choice only if the product still has that unit.
//   const selectedQtyUnit = qtyUnits.find((u) => String(u.id) === String(qtyUnitId)) ?? defaultQtyUnit

//   const weightDisabled = adding || (Boolean(selectedProduct) && !productHasKgs)
//   const qtyDisabled = adding || !selectedProduct || qtyUnits.length === 0

//   // Product search: filters as you type.
//   const filteredProducts = useMemo(() => {
//     const q = productText.trim().toLowerCase()
//     // When the box shows the chosen product, show the full list again.
//     const showAll = selectedProduct && q === selectedProduct.product_name.toLowerCase()
//     return productOptions.filter((p) => showAll || q === '' || p.product_name.toLowerCase().includes(q))
//   }, [productOptions, productText, selectedProduct])

//   const unitNamesOf = (p) =>
//     getUnitIds(p)
//       .map((id) => unitById[id]?.unit_name)
//       .filter(Boolean)
//       .join(', ')

//   const chooseProduct = (p) => {
//     setProductId(String(p.id))
//     setProductText(p.product_name)
//     setPickerOpen(false)
//     setPickerIndex(-1)
//     setAddError('')
//     // New product -> its own units; clear boxes and unit choice.
//     setKgs('')
//     setQty('')
//     setQtyUnitId('')
//   }

//   const clearProduct = () => {
//     setProductId('')
//     setKgs('')
//     setQty('')
//     setQtyUnitId('')
//   }

//   const onProductKeyDown = (e) => {
//     if (e.key === 'ArrowDown') {
//       e.preventDefault()
//       setPickerOpen(true)
//       setPickerIndex((i) => Math.min(i + 1, filteredProducts.length - 1))
//     } else if (e.key === 'ArrowUp') {
//       e.preventDefault()
//       setPickerIndex((i) => Math.max(i - 1, 0))
//     } else if (e.key === 'Enter' && pickerOpen) {
//       e.preventDefault()
//       const pick = filteredProducts[pickerIndex >= 0 ? pickerIndex : 0]
//       if (pick && (pickerIndex >= 0 || filteredProducts.length === 1)) chooseProduct(pick)
//     } else if (e.key === 'Escape') {
//       setPickerOpen(false)
//     }
//   }

//   const handleAdd = async (e) => {
//     e.preventDefault()
//     if (adding) return

//     const kgsVal = kgs.trim()
//     const qtyVal = qty.trim()

//     if (!selectedProduct) return setAddError('Select a product.')
//     if (!kgsVal && !qtyVal) return setAddError('Enter a weight (KGS) or a quantity.')
//     if (kgsVal && (!QTY_RE.test(kgsVal) || Number(kgsVal) <= 0))
//       return setAddError('KGS must be greater than 0 (up to 3 decimals).')
//     if (qtyVal && (!QTY_RE.test(qtyVal) || Number(qtyVal) <= 0))
//       return setAddError('Quantity must be greater than 0 (up to 3 decimals).')
//     if (kgsVal && !kgsUnit) return setAddError('Unit "KGS" does not exist. Create it on the Units page.')
//     if (kgsVal && !productHasKgs)
//       return setAddError(`"${selectedProduct.product_name}" does not have the KGS unit. Add it from the Products page.`)
//     if (qtyVal && !selectedQtyUnit)
//       return setAddError(`"${selectedProduct.product_name}" has no PCS/BUNDLE unit. Add it from the Products page.`)

//     setAddError('')
//     setAdding(true)

//     const pid = Number(productId)
//     const pname = productName[pid] ?? `#${pid}`
//     const jobs = []
//     if (kgsVal) jobs.push({ unit: kgsUnit, value: Number(kgsVal), clear: () => setKgs('') })
//     if (qtyVal) jobs.push({ unit: selectedQtyUnit, value: Number(qtyVal), clear: () => setQty('') })

//     const saved = []
//     const failed = []
//     const rowsAdded = []
//     // Sequential, so a failure on one unit never hides the other result.
//     for (const job of jobs) {
//       try {
//         await createStockEntry(pid, job.value, Number(job.unit.id))
//         job.clear()
//         saved.push(formatQtyWithUnit(job.value, job.unit.unit_name))
//         rowsAdded.push({
//           id: `${Date.now()}-${job.unit.id}`,
//           productId: pid,
//           productName: pname,
//           quantity: job.value,
//           unit: job.unit.unit_name,
//           unitId: Number(job.unit.id),
//           at: new Date().toISOString(),
//         })
//       } catch (err) {
//         failed.push(`${job.unit.unit_name}: ${getErrorMessage(err)}`)
//       }
//     }

//     if (rowsAdded.length) setAdded((prev) => [...rowsAdded, ...prev])
//     if (saved.length) toast.success(`Stock added: ${saved.join(' + ')}.`)
//     if (failed.length) {
//       const message = failed.join(' | ')
//       setAddError(message)
//       toast.error(message)
//     }
//     setAdding(false)
//   }

//   const openEdit = (r) => {
//     setEditError('')
//     setEditRow({ row: r, value: String(r.quantity) })
//   }

//   // Change the quantity of an added row. Stock is corrected by the difference.
//   const saveEdit = async (e) => {
//     e.preventDefault()
//     if (editBusy || !editRow) return
//     const { row } = editRow
//     const text = editRow.value.trim()
//     if (!QTY_RE.test(text) || Number(text) <= 0)
//       return setEditError('Quantity must be greater than 0 (up to 3 decimals).')
//     const newQty = Number(text)
//     const delta = Math.round((newQty - Number(row.quantity)) * 1000) / 1000
//     if (delta === 0) return setEditRow(null)

//     const unitId =
//       row.unitId ?? units.find((u) => String(u.unit_name).trim() === String(row.unit).trim())?.id
//     if (!unitId) return setEditError('Unit not found for this row.')

//     setEditError('')
//     setEditBusy(true)
//     try {
//       if (delta > 0) {
//         await createStockEntry(Number(row.productId), delta, Number(unitId))
//       } else {
//         await createStockAdjustment(Number(row.productId), delta, Number(unitId))
//       }
//       setAdded((prev) => prev.map((r) => (r.id === row.id ? { ...r, quantity: newQty } : r)))
//       toast.success(`Updated to ${formatQtyWithUnit(newQty, row.unit)}.`)
//       setEditRow(null)
//     } catch (err) {
//       setEditError(getErrorMessage(err))
//     } finally {
//       setEditBusy(false)
//     }
//   }

//   // Product names shown in the list always follow the latest edited name.
//   const rowName = (r) => productName[r.productId] ?? r.productName

//   /* ---------------- CSV / PDF ---------------- */
//   const exportCsv = () => {
//     if (added.length === 0) {
//       toast.error('There is nothing to export.')
//       return
//     }

//     downloadCsv(`mothys-entry-list-${todayStamp()}.csv`, [
//       ['S.No', 'Product', 'Quantity', 'Unit', 'Added At'],
//       ...added.map((r, i) => [
//         i + 1,
//         rowName(r),
//         Number(r.quantity),
//         r.unit,
//         `${formatDate(new Date(r.at))} ${formatTime(new Date(r.at))}`,
//       ]),
//     ])
//   }

//   // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
//   const buildPdf = () =>
//     buildEntryListPdf({
//       date: new Date(),
//       items: added.map((r) => ({
//         name: rowName(r),
//         quantity: r.quantity,
//         unit: r.unit,
//         at: r.at,
//       })),
//     })

//   return (
//     <>
//       <style>{`
//         .entry-grid {
//           display: grid;
//           grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.2fr) auto;
//           gap: 16px;
//           align-items: end;
//         }

//         .entry-grid .input-wrap {
//           width: 100%;
//         }

//         /* Searchable product box */
//         .combo {
//           position: relative;
//           width: 100%;
//         }

//         .combo > svg.lead {
//           position: absolute;
//           left: 14px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #8a97ad;
//           pointer-events: none;
//         }

//         .combo .input {
//           padding-left: 42px;
//           padding-right: 40px;
//         }

//         .combo > svg.trail {
//           position: absolute;
//           right: 14px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #64748b;
//           pointer-events: none;
//         }

//         .combo-list {
//           position: absolute;
//           top: calc(100% + 4px);
//           left: 0;
//           right: 0;
//           z-index: 30;
//           max-height: 260px;
//           margin: 0;
//           padding: 4px;
//           overflow-y: auto;
//           list-style: none;
//           background: #fff;
//           border: 1px solid #d9e1ed;
//           border-radius: 10px;
//           box-shadow: 0 10px 28px rgba(15, 30, 66, .14);
//         }

//         .combo-item {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           width: 100%;
//           padding: 9px 10px;
//           border: 0;
//           border-radius: 8px;
//           background: transparent;
//           color: #253653;
//           font-size: 14px;
//           font-weight: 600;
//           text-align: left;
//           cursor: pointer;
//         }

//         .combo-item:hover,
//         .combo-item.active {
//           background: #eef3ff;
//           color: #1d4ed8;
//         }

//         .combo-item small {
//           color: #8a97ad;
//           font-size: 12px;
//           font-weight: 600;
//         }

//         .combo-empty {
//           padding: 12px 10px;
//           color: #8a97ad;
//           font-size: 14px;
//         }

//         /* Quantity box: unit is fixed text, or a small arrow when the product has several units */
//         .qty-wrap {
//           position: relative;
//           display: flex;
//           align-items: center;
//           width: 100%;
//         }

//         .qty-wrap .input {
//           width: 100%;
//           padding-right: 96px;
//         }

//         .qty-unit {
//           position: absolute;
//           right: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           display: inline-flex;
//           align-items: center;
//           gap: 2px;
//           color: #64748b;
//           font-size: 14px;
//           font-weight: 700;
//           pointer-events: none;
//         }

//         .qty-unit-select {
//           position: absolute;
//           right: 6px;
//           top: 50%;
//           transform: translateY(-50%);
//           height: 32px;
//           max-width: 90px;
//           padding: 0 22px 0 8px;
//           border: 0;
//           border-radius: 8px;
//           background: #eef3ff;
//           color: #1d4ed8;
//           font-size: 13px;
//           font-weight: 700;
//           cursor: pointer;
//           appearance: none;
//           -webkit-appearance: none;
//         }

//         .qty-wrap > svg.arrow {
//           position: absolute;
//           right: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #1d4ed8;
//           pointer-events: none;
//         }

//         .added-actions {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//         }

//         .print-options {
//           display: grid;
//           gap: 12px;
//         }

//         .print-options .btn {
//           justify-content: center;
//           width: 100%;
//         }

//         @media (max-width: 900px) {
//           .entry-grid {
//             grid-template-columns: 1fr 1fr;
//           }

//           .entry-grid .field-product,
//           .entry-grid .btn {
//             grid-column: 1 / -1;
//           }
//         }

//         @media (max-width: 520px) {
//           .entry-grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>

//       <div className="page-head">
//         <h1>Entry</h1>
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
//         <form className="card" onSubmit={handleAdd} noValidate>
//           <h2 className="card-title">Add Product Entry</h2>

//           <div className="entry-grid">
//             <div className="field field-product">
//               <label htmlFor="en-product">
//                 Product <span className="req">*</span>
//               </label>
//               <div className="combo">
//                 <Search size={18} className="lead" />
//                 <input
//                   id="en-product"
//                   ref={productInputRef}
//                   className="input"
//                   placeholder={loading ? 'Loading products…' : 'Search or select product'}
//                   value={productText}
//                   autoComplete="off"
//                   role="combobox"
//                   aria-expanded={pickerOpen}
//                   aria-controls="en-product-list"
//                   disabled={loading || adding}
//                   onChange={(e) => {
//                     setProductText(e.target.value)
//                     setPickerOpen(true)
//                     setPickerIndex(-1)
//                     // typing again after a pick means the old pick no longer applies
//                     if (productId) clearProduct()
//                   }}
//                   onFocus={(e) => {
//                     setPickerOpen(true)
//                     e.target.select()
//                   }}
//                   onBlur={() => {
//                     setPickerOpen(false)
//                     // leave the box showing the chosen product, or empty if nothing is chosen
//                     setProductText(selectedProduct ? selectedProduct.product_name : '')
//                   }}
//                   onKeyDown={onProductKeyDown}
//                 />
//                 <ChevronDown size={18} className="trail" />
//                 {pickerOpen && (
//                   <ul className="combo-list" id="en-product-list" role="listbox">
//                     {filteredProducts.length === 0 && <li className="combo-empty">No product found.</li>}
//                     {filteredProducts.map((p, i) => (
//                       <li key={p.id} role="option" aria-selected={String(p.id) === String(productId)}>
//                         <button
//                           type="button"
//                           className={`combo-item ${i === pickerIndex ? 'active' : ''}`}
//                           // mousedown (not click) so the input does not blur and close the list first
//                           onMouseDown={(e) => {
//                             e.preventDefault()
//                             chooseProduct(p)
//                           }}
//                         >
//                           <span>{p.product_name}</span>
//                           <small>{unitNamesOf(p)}</small>
//                         </button>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </div>
//             </div>

//             <div className="field">
//               <label htmlFor="en-kgs">Weight</label>
//               <div className="input-wrap">
//                 <input
//                   id="en-kgs"
//                   inputMode="decimal"
//                   className="input"
//                   placeholder="0.000"
//                   value={kgs}
//                   onChange={(e) => setKgs(e.target.value)}
//                   disabled={weightDisabled}
//                 />
//                 <span className="input-suffix">KGS</span>
//               </div>
//             </div>

//             <div className="field">
//               <label htmlFor="en-qty">Quantity</label>
//               <div className="qty-wrap">
//                 <input
//                   id="en-qty"
//                   inputMode="decimal"
//                   className="input"
//                   placeholder={selectedProduct && qtyUnits.length === 0 ? 'Not applicable' : 'Enter quantity'}
//                   value={qty}
//                   onChange={(e) => setQty(e.target.value)}
//                   disabled={qtyDisabled}
//                 />
//                 {qtyUnits.length === 1 && <span className="qty-unit">{qtyUnits[0].unit_name}</span>}
//                 {qtyUnits.length > 1 && (
//                   <>
//                     <select
//                       className="qty-unit-select"
//                       aria-label="Quantity unit"
//                       value={selectedQtyUnit ? String(selectedQtyUnit.id) : ''}
//                       onChange={(e) => setQtyUnitId(e.target.value)}
//                       disabled={adding}
//                     >
//                       {qtyUnits.map((u) => (
//                         <option key={u.id} value={u.id}>
//                           {u.unit_name}
//                         </option>
//                       ))}
//                     </select>
//                     <ChevronDown size={14} className="arrow" />
//                   </>
//                 )}
//               </div>
//             </div>

//             <button type="submit" className="btn btn-primary" disabled={loading || adding || Boolean(error)}>
//               {adding && <span className="spinner" />}
//               Add to List
//             </button>
//           </div>

//           {error && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               Could not load products/units.{' '}
//               <button type="button" className="btn btn-outline" onClick={reload}>
//                 Retry
//               </button>
//             </p>
//           )}
//           {selectedProduct && !productHasKgs && (
//             <p className="field-hint" style={{ marginTop: 8 }}>
//               This product has no KGS unit, so Weight is off. It is entered in {qtyUnits.map((u) => u.unit_name).join(' / ') || 'no unit'}.
//             </p>
//           )}
//           {!loading && !error && !kgsUnit && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               Create a unit named “KGS” on the Units page to use the Weight box.
//             </p>
//           )}
//           {addError && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               {addError}
//             </p>
//           )}
//         </form>

//         <div className="table-card">
//           <div className="report-head added-actions">
//             <span>Added Products ({added.length})</span>
//             {added.length > 0 && (
//               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                 <button
//                   type="button"
//                   className="btn btn-outline"
//                   onClick={exportCsv}
//                   title="Download the list as CSV"
//                 >
//                   <Download size={16} />
//                   Export CSV
//                 </button>

//                 <button
//                   type="button"
//                   className="icon-btn icon-btn-blue"
//                   aria-label="Print / share list"
//                   title="Print / share list"
//                   onClick={() => setPrintOpen(true)}
//                 >
//                   <Printer size={16} />
//                 </button>
//               </div>
//             )}
//           </div>
//           <div className="table-scroll">
//             <table className="data">
//               <thead>
//                 <tr>
//                   <th style={{ width: 90 }}>S.No</th>
//                   <th>Product</th>
//                   <th>Quantity</th>
//                   <th>Added At</th>
//                   <th className="center">Edit</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {added.map((r, i) => (
//                   <tr key={r.id}>
//                     <td>{i + 1}</td>
//                     <td>{rowName(r)}</td>
//                     <td>{formatQtyWithUnit(r.quantity, r.unit)}</td>
//                     <td>{formatTime(new Date(r.at))}</td>
//                     <td className="center">
//                       <div className="actions">
//                         <button
//                           type="button"
//                           className="icon-btn icon-btn-blue"
//                           aria-label="Edit entry"
//                           title="Edit"
//                           onClick={() => openEdit(r)}
//                         >
//                           <Pencil size={15} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <TableState
//             loading={false}
//             error={null}
//             empty={added.length === 0}
//             emptyText="Nothing added yet. Choose a product, enter a quantity and click “Add to List”."
//             onRetry={reload}
//           />
//         </div>
//       </div>

//       {editRow && (
//         <Modal title="Edit Entry" onClose={() => !editBusy && setEditRow(null)} busy={editBusy}>
//           <form onSubmit={saveEdit} className="stack" style={{ gap: 16 }} noValidate>
//             {editError && <div className="form-error">{editError}</div>}
//             <div className="field">
//               <label>Product</label>
//               <input className="input" value={rowName(editRow.row)} disabled />
//             </div>
//             <div className="field">
//               <label htmlFor="ee-qty">
//                 Quantity ({editRow.row.unit}) <span className="req">*</span>
//               </label>
//               <input
//                 id="ee-qty"
//                 inputMode="decimal"
//                 className="input"
//                 value={editRow.value}
//                 onChange={(ev) => setEditRow((s) => ({ ...s, value: ev.target.value }))}
//                 autoFocus
//               />
//             </div>
//             <div className="modal-actions">
//               <button type="button" className="btn btn-outline" onClick={() => setEditRow(null)} disabled={editBusy}>
//                 Cancel
//               </button>
//               <button type="submit" className="btn btn-primary" disabled={editBusy}>
//                 {editBusy && <span className="spinner" />}
//                 Save Changes
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}

//       {printOpen && (
//         <PdfActionsModal title="Print list" build={buildPdf} onClose={() => setPrintOpen(false)} />
//       )}
//     </>
//   )
// }











// import { useEffect, useMemo, useRef, useState } from 'react'
// import { Calendar, Clock, Download, Pencil, Printer, Search, ChevronDown } from 'lucide-react'
// import Modal from '../components/Modal'
// import TableState from '../components/TableState'
// import useAsyncData from '../hooks/useAsyncData'
// import useToast from '../hooks/useToast'
// import useNow from '../hooks/useNow'
// import { getProducts } from '../services/productsService'
// import { getUnits } from '../services/unitsService'
// import { createStockEntry, createStockAdjustment } from '../services/stockService'
// import { getErrorMessage } from '../services/api'
// import { formatDate, formatQtyWithUnit, formatTime } from '../utils/format'
// import PdfActionsModal from '../components/PdfActionsModal'
// import { buildEntryListPdf } from '../utils/voucherPdf'
// import { downloadCsv, todayStamp } from '../utils/pdfActions'

// const load = () => Promise.all([getProducts(), getUnits()])

// const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals

// // KGS always has its own Weight box. Matched by unit name, case-insensitive.
// const KGS_NAME = /^(kgs?|kilograms?)$/i
// const PCS_NAME = /^(pcs?|pieces?|nos)$/i
// const isKgs = (u) => KGS_NAME.test(String(u?.unit_name ?? '').trim())

// const round3 = (n) => Math.round(Number(n) * 1000) / 1000

// // Normalise whatever the backend returns into an array of unit ids.
// // Supports: unit_ids: [1,2] | units: [{id:1},...] | legacy unit_id: 1
// const getUnitIds = (p) => {
//   if (!p) return []
//   if (Array.isArray(p.unit_ids)) return p.unit_ids.map(Number)
//   if (Array.isArray(p.units)) return p.units.map((u) => Number(u?.id ?? u))
//   return p.unit_id != null ? [Number(p.unit_id)] : []
// }

// // Key that identifies the unit of an added row (older saved rows may have no unitId).
// const unitKey = (r) => String(r.unitId ?? r.unit)

// const STORAGE_KEY = 'entry-added-list'

// // The grid below the form keeps what was added, even after a refresh (this browser tab only).
// const loadSaved = () => {
//   try {
//     const raw = sessionStorage.getItem(STORAGE_KEY)
//     const list = raw ? JSON.parse(raw) : []
//     return Array.isArray(list) ? list : []
//   } catch {
//     return []
//   }
// }

// /*
//  * ENTRY page — stock IN only.
//  *  - Pick a product (type to search).
//  *  - Weight box: always shown, KGS.
//  *  - Quantity box: unit comes from the PRODUCT.
//  *      one non-KGS unit  -> shown as a fixed label (e.g. PCS)
//  *      several units     -> small arrow to switch (e.g. PCS / BUNDLE)
//  *  - "Add to List" posts a stock IN for each box that has a value.
//  *  - The grid shows ONE row per product. Every unit added for that product
//  *    (at any time) is summed and shown as "45 BUNDLE / 25 KGS / 23 PCS".
//  *  - Printer icon: download or share the list as PDF.
//  */
// export default function Entry() {
//   const toast = useToast()
//   const now = useNow()

//   const { data, loading, error, reload } = useAsyncData(load)
//   const [products, units] = data ?? [[], []]

//   const unitById = useMemo(() => Object.fromEntries(units.map((u) => [Number(u.id), u])), [units])
//   const kgsUnit = useMemo(() => units.find((u) => u.is_active !== false && isKgs(u)), [units])

//   const productOptions = useMemo(
//     () =>
//       products
//         .filter((p) => p.is_active)
//         .sort((a, b) => a.product_name.localeCompare(b.product_name)),
//     [products],
//   )
//   const productName = useMemo(
//     () => Object.fromEntries(products.map((p) => [p.id, p.product_name])),
//     [products],
//   )
//   const productById = useMemo(
//     () => Object.fromEntries(products.map((p) => [p.id, p])),
//     [products],
//   )

//   const [productId, setProductId] = useState('')
//   const [productText, setProductText] = useState('') // text shown in the searchable box
//   const [pickerOpen, setPickerOpen] = useState(false)
//   const [pickerIndex, setPickerIndex] = useState(-1)
//   const [kgs, setKgs] = useState('')
//   const [qty, setQty] = useState('')
//   const [qtyUnitId, setQtyUnitId] = useState('')
//   const [addError, setAddError] = useState('')
//   const [adding, setAdding] = useState(false)
//   const [added, setAdded] = useState(loadSaved) // raw entries, newest first
//   const [editRow, setEditRow] = useState(null) // { group, values: { [unitKey]: text } }
//   const [editError, setEditError] = useState('')
//   const [editBusy, setEditBusy] = useState(false)
//   const [printOpen, setPrintOpen] = useState(false)
//   const productInputRef = useRef(null)

//   useEffect(() => {
//     try {
//       sessionStorage.setItem(STORAGE_KEY, JSON.stringify(added))
//     } catch {
//       /* storage unavailable — the grid still works for this visit */
//     }
//   }, [added])

//   const selectedProduct = useMemo(
//     () => products.find((p) => String(p.id) === String(productId)),
//     [products, productId],
//   )

//   // Units of the chosen product.
//   const productUnits = useMemo(
//     () =>
//       getUnitIds(selectedProduct)
//         .map((id) => unitById[id])
//         .filter((u) => u && u.is_active !== false),
//     [selectedProduct, unitById],
//   )
//   const productHasKgs = productUnits.some(isKgs)
//   // Everything except KGS goes in the Quantity box (PCS, BUNDLE, ...).
//   const qtyUnits = useMemo(() => productUnits.filter((u) => !isKgs(u)), [productUnits])
//   const defaultQtyUnit = useMemo(() => qtyUnits.find((u) => PCS_NAME.test(String(u.unit_name).trim())) ?? qtyUnits[0], [qtyUnits])

//   // Valid selection: keep the user's choice only if the product still has that unit.
//   const selectedQtyUnit = qtyUnits.find((u) => String(u.id) === String(qtyUnitId)) ?? defaultQtyUnit

//   const weightDisabled = adding || (Boolean(selectedProduct) && !productHasKgs)
//   const qtyDisabled = adding || !selectedProduct || qtyUnits.length === 0

//   // Product search: filters as you type.
//   const filteredProducts = useMemo(() => {
//     const q = productText.trim().toLowerCase()
//     // When the box shows the chosen product, show the full list again.
//     const showAll = selectedProduct && q === selectedProduct.product_name.toLowerCase()
//     return productOptions.filter((p) => showAll || q === '' || p.product_name.toLowerCase().includes(q))
//   }, [productOptions, productText, selectedProduct])

//   const unitNamesOf = (p) =>
//     getUnitIds(p)
//       .map((id) => unitById[id]?.unit_name)
//       .filter(Boolean)
//       .join(', ')

//   const chooseProduct = (p) => {
//     setProductId(String(p.id))
//     setProductText(p.product_name)
//     setPickerOpen(false)
//     setPickerIndex(-1)
//     setAddError('')
//     // New product -> its own units; clear boxes and unit choice.
//     setKgs('')
//     setQty('')
//     setQtyUnitId('')
//   }

//   const clearProduct = () => {
//     setProductId('')
//     setKgs('')
//     setQty('')
//     setQtyUnitId('')
//   }

//   const onProductKeyDown = (e) => {
//     if (e.key === 'ArrowDown') {
//       e.preventDefault()
//       setPickerOpen(true)
//       setPickerIndex((i) => Math.min(i + 1, filteredProducts.length - 1))
//     } else if (e.key === 'ArrowUp') {
//       e.preventDefault()
//       setPickerIndex((i) => Math.max(i - 1, 0))
//     } else if (e.key === 'Enter' && pickerOpen) {
//       e.preventDefault()
//       const pick = filteredProducts[pickerIndex >= 0 ? pickerIndex : 0]
//       if (pick && (pickerIndex >= 0 || filteredProducts.length === 1)) chooseProduct(pick)
//     } else if (e.key === 'Escape') {
//       setPickerOpen(false)
//     }
//   }

//   const handleAdd = async (e) => {
//     e.preventDefault()
//     if (adding) return

//     const kgsVal = kgs.trim()
//     const qtyVal = qty.trim()

//     if (!selectedProduct) return setAddError('Select a product.')
//     if (!kgsVal && !qtyVal) return setAddError('Enter a weight (KGS) or a quantity.')
//     if (kgsVal && (!QTY_RE.test(kgsVal) || Number(kgsVal) <= 0))
//       return setAddError('KGS must be greater than 0 (up to 3 decimals).')
//     if (qtyVal && (!QTY_RE.test(qtyVal) || Number(qtyVal) <= 0))
//       return setAddError('Quantity must be greater than 0 (up to 3 decimals).')
//     if (kgsVal && !kgsUnit) return setAddError('Unit "KGS" does not exist. Create it on the Units page.')
//     if (kgsVal && !productHasKgs)
//       return setAddError(`"${selectedProduct.product_name}" does not have the KGS unit. Add it from the Products page.`)
//     if (qtyVal && !selectedQtyUnit)
//       return setAddError(`"${selectedProduct.product_name}" has no PCS/BUNDLE unit. Add it from the Products page.`)

//     setAddError('')
//     setAdding(true)

//     const pid = Number(productId)
//     const pname = productName[pid] ?? `#${pid}`
//     const jobs = []
//     if (kgsVal) jobs.push({ unit: kgsUnit, value: Number(kgsVal), clear: () => setKgs('') })
//     if (qtyVal) jobs.push({ unit: selectedQtyUnit, value: Number(qtyVal), clear: () => setQty('') })

//     const saved = []
//     const failed = []
//     const rowsAdded = []
//     // Sequential, so a failure on one unit never hides the other result.
//     for (const job of jobs) {
//       try {
//         await createStockEntry(pid, job.value, Number(job.unit.id))
//         job.clear()
//         saved.push(formatQtyWithUnit(job.value, job.unit.unit_name))
//         rowsAdded.push({
//           id: `${Date.now()}-${job.unit.id}`,
//           productId: pid,
//           productName: pname,
//           quantity: job.value,
//           unit: job.unit.unit_name,
//           unitId: Number(job.unit.id),
//           at: new Date().toISOString(),
//         })
//       } catch (err) {
//         failed.push(`${job.unit.unit_name}: ${getErrorMessage(err)}`)
//       }
//     }

//     if (rowsAdded.length) setAdded((prev) => [...rowsAdded, ...prev])
//     if (saved.length) toast.success(`Stock added: ${saved.join(' + ')}.`)
//     if (failed.length) {
//       const message = failed.join(' | ')
//       setAddError(message)
//       toast.error(message)
//     }
//     setAdding(false)
//   }

//   // Product names shown in the list always follow the latest edited name.
//   const rowName = (g) => productName[g.productId] ?? g.productName

//   /*
//    * One group per product. `added` is newest first, so the product that was
//    * added to most recently comes first. Units of the same product are summed,
//    * no matter when they were added, and listed in the product's own unit order.
//    */
//   const groups = useMemo(() => {
//     const map = new Map()

//     added.forEach((r) => {
//       let g = map.get(r.productId)

//       if (!g) {
//         g = {
//           productId: r.productId,
//           productName: r.productName,
//           latestAt: r.at,
//           units: new Map(),
//         }
//         map.set(r.productId, g)
//       }

//       const k = unitKey(r)
//       const u = g.units.get(k) ?? {
//         key: k,
//         unit: r.unit,
//         unitId: r.unitId,
//         quantity: 0,
//       }

//       u.quantity = round3(u.quantity + Number(r.quantity))
//       g.units.set(k, u)
//     })

//     return [...map.values()].map((g) => {
//       const order = getUnitIds(productById[g.productId])
//       const rank = (u) => {
//         const i = order.indexOf(Number(u.unitId))
//         return i === -1 ? 999 : i
//       }

//       return {
//         ...g,
//         items: [...g.units.values()].sort((a, b) => rank(a) - rank(b)),
//       }
//     })
//   }, [added, productById])

//   // "45 BUNDLE / 25 KGS / 23 PCS"
//   const groupQtyText = (g) =>
//     g.items.map((u) => formatQtyWithUnit(u.quantity, u.unit)).join(' / ')

//   const openEdit = (g) => {
//     setEditError('')
//     setEditRow({
//       group: g,
//       values: Object.fromEntries(g.items.map((u) => [u.key, String(u.quantity)])),
//     })
//   }

//   // Replace every raw row of one product+unit with a single row holding the new total.
//   const applyTotal = (prev, productId, key, newQty) => {
//     let kept = false

//     return prev.flatMap((r) => {
//       if (r.productId !== productId || unitKey(r) !== key) return [r]
//       if (kept) return []
//       kept = true
//       return [{ ...r, quantity: newQty }]
//     })
//   }

//   // Change the quantity of any unit in a row. Stock is corrected by the difference.
//   const saveEdit = async (e) => {
//     e.preventDefault()
//     if (editBusy || !editRow) return

//     const { group, values } = editRow

//     // Validate every box first.
//     for (const u of group.items) {
//       const text = (values[u.key] ?? '').trim()

//       if (!QTY_RE.test(text) || Number(text) <= 0) {
//         return setEditError(
//           `${u.unit}: quantity must be greater than 0 (up to 3 decimals).`,
//         )
//       }
//     }

//     // Only the units that actually changed.
//     const changes = group.items
//       .map((u) => {
//         const newQty = Number(values[u.key].trim())
//         const delta = round3(newQty - Number(u.quantity))
//         const unitId =
//           u.unitId ??
//           units.find((x) => String(x.unit_name).trim() === String(u.unit).trim())?.id

//         return { u, newQty, delta, unitId }
//       })
//       .filter((c) => c.delta !== 0)

//     if (changes.length === 0) return setEditRow(null)

//     const missing = changes.find((c) => !c.unitId)
//     if (missing) return setEditError(`Unit not found for ${missing.u.unit}.`)

//     setEditError('')
//     setEditBusy(true)

//     const done = []
//     const failed = []

//     // Sequential, so one failure never hides the other results.
//     for (const c of changes) {
//       try {
//         if (c.delta > 0) {
//           await createStockEntry(Number(group.productId), c.delta, Number(c.unitId))
//         } else {
//           await createStockAdjustment(Number(group.productId), c.delta, Number(c.unitId))
//         }

//         done.push(c)
//       } catch (err) {
//         failed.push(`${c.u.unit}: ${getErrorMessage(err)}`)
//       }
//     }

//     if (done.length) {
//       setAdded((prev) =>
//         done.reduce(
//           (list, c) => applyTotal(list, group.productId, c.u.key, c.newQty),
//           prev,
//         ),
//       )

//       toast.success(
//         `Updated: ${done.map((c) => formatQtyWithUnit(c.newQty, c.u.unit)).join(' / ')}.`,
//       )
//     }

//     if (failed.length) {
//       setEditError(failed.join(' | '))
//     } else {
//       setEditRow(null)
//     }

//     setEditBusy(false)
//   }

//   /* ---------------- CSV / PDF ---------------- */
//   const exportCsv = () => {
//     if (groups.length === 0) {
//       toast.error('There is nothing to export.')
//       return
//     }

//     downloadCsv(`mothys-entry-list-${todayStamp()}.csv`, [
//       ['S.No', 'Product', 'Quantity', 'Added At'],
//       ...groups.map((g, i) => [
//         i + 1,
//         rowName(g),
//         groupQtyText(g),
//         `${formatDate(new Date(g.latestAt))} ${formatTime(new Date(g.latestAt))}`,
//       ]),
//     ])
//   }

//   // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
//   // One item per product; the quantity is the combined text, e.g. "45 BUNDLE / 25 KGS / 23 PCS".
//   const buildPdf = () =>
//     buildEntryListPdf({
//       date: new Date(),
//       items: groups.map((g) => ({
//         name: rowName(g),
//         quantity: groupQtyText(g),
//         unit: '',
//         at: g.latestAt,
//       })),
//     })

//   return (
//     <>
//       <style>{`
//         .entry-grid {
//           display: grid;
//           grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.2fr) auto;
//           gap: 16px;
//           align-items: end;
//         }

//         .entry-grid .input-wrap {
//           width: 100%;
//         }

//         /* Searchable product box */
//         .combo {
//           position: relative;
//           width: 100%;
//         }

//         .combo > svg.lead {
//           position: absolute;
//           left: 14px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #8a97ad;
//           pointer-events: none;
//         }

//         .combo .input {
//           padding-left: 42px;
//           padding-right: 40px;
//         }

//         .combo > svg.trail {
//           position: absolute;
//           right: 14px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #64748b;
//           pointer-events: none;
//         }

//         .combo-list {
//           position: absolute;
//           top: calc(100% + 4px);
//           left: 0;
//           right: 0;
//           z-index: 30;
//           max-height: 260px;
//           margin: 0;
//           padding: 4px;
//           overflow-y: auto;
//           list-style: none;
//           background: #fff;
//           border: 1px solid #d9e1ed;
//           border-radius: 10px;
//           box-shadow: 0 10px 28px rgba(15, 30, 66, .14);
//         }

//         .combo-item {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           width: 100%;
//           padding: 9px 10px;
//           border: 0;
//           border-radius: 8px;
//           background: transparent;
//           color: #253653;
//           font-size: 14px;
//           font-weight: 600;
//           text-align: left;
//           cursor: pointer;
//         }

//         .combo-item:hover,
//         .combo-item.active {
//           background: #eef3ff;
//           color: #1d4ed8;
//         }

//         .combo-item small {
//           color: #8a97ad;
//           font-size: 12px;
//           font-weight: 600;
//         }

//         .combo-empty {
//           padding: 12px 10px;
//           color: #8a97ad;
//           font-size: 14px;
//         }

//         /* Quantity box: unit is fixed text, or a small arrow when the product has several units */
//         .qty-wrap {
//           position: relative;
//           display: flex;
//           align-items: center;
//           width: 100%;
//         }

//         .qty-wrap .input {
//           width: 100%;
//           padding-right: 96px;
//         }

//         .qty-unit {
//           position: absolute;
//           right: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           display: inline-flex;
//           align-items: center;
//           gap: 2px;
//           color: #64748b;
//           font-size: 14px;
//           font-weight: 700;
//           pointer-events: none;
//         }

//         .qty-unit-select {
//           position: absolute;
//           right: 6px;
//           top: 50%;
//           transform: translateY(-50%);
//           height: 32px;
//           max-width: 90px;
//           padding: 0 22px 0 8px;
//           border: 0;
//           border-radius: 8px;
//           background: #eef3ff;
//           color: #1d4ed8;
//           font-size: 13px;
//           font-weight: 700;
//           cursor: pointer;
//           appearance: none;
//           -webkit-appearance: none;
//         }

//         .qty-wrap > svg.arrow {
//           position: absolute;
//           right: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #1d4ed8;
//           pointer-events: none;
//         }

//         .added-actions {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//         }

//         .print-options {
//           display: grid;
//           gap: 12px;
//         }

//         .print-options .btn {
//           justify-content: center;
//           width: 100%;
//         }

//         .qty-sep {
//           color: #8a97ad;
//           font-weight: 400;
//           padding: 0 6px;
//         }

//         .edit-qty-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//           gap: 12px;
//         }

//         @media (max-width: 900px) {
//           .entry-grid {
//             grid-template-columns: 1fr 1fr;
//           }

//           .entry-grid .field-product,
//           .entry-grid .btn {
//             grid-column: 1 / -1;
//           }
//         }

//         @media (max-width: 520px) {
//           .entry-grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>

//       <div className="page-head">
//         <h1>Entry</h1>
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
//         <form className="card" onSubmit={handleAdd} noValidate>
//           <h2 className="card-title">Add Product Entry</h2>

//           <div className="entry-grid">
//             <div className="field field-product">
//               <label htmlFor="en-product">
//                 Product <span className="req">*</span>
//               </label>
//               <div className="combo">
//                 <Search size={18} className="lead" />
//                 <input
//                   id="en-product"
//                   ref={productInputRef}
//                   className="input"
//                   placeholder={loading ? 'Loading products…' : 'Search or select product'}
//                   value={productText}
//                   autoComplete="off"
//                   role="combobox"
//                   aria-expanded={pickerOpen}
//                   aria-controls="en-product-list"
//                   disabled={loading || adding}
//                   onChange={(e) => {
//                     setProductText(e.target.value)
//                     setPickerOpen(true)
//                     setPickerIndex(-1)
//                     // typing again after a pick means the old pick no longer applies
//                     if (productId) clearProduct()
//                   }}
//                   onFocus={(e) => {
//                     setPickerOpen(true)
//                     e.target.select()
//                   }}
//                   onBlur={() => {
//                     setPickerOpen(false)
//                     // leave the box showing the chosen product, or empty if nothing is chosen
//                     setProductText(selectedProduct ? selectedProduct.product_name : '')
//                   }}
//                   onKeyDown={onProductKeyDown}
//                 />
//                 <ChevronDown size={18} className="trail" />
//                 {pickerOpen && (
//                   <ul className="combo-list" id="en-product-list" role="listbox">
//                     {filteredProducts.length === 0 && <li className="combo-empty">No product found.</li>}
//                     {filteredProducts.map((p, i) => (
//                       <li key={p.id} role="option" aria-selected={String(p.id) === String(productId)}>
//                         <button
//                           type="button"
//                           className={`combo-item ${i === pickerIndex ? 'active' : ''}`}
//                           // mousedown (not click) so the input does not blur and close the list first
//                           onMouseDown={(e) => {
//                             e.preventDefault()
//                             chooseProduct(p)
//                           }}
//                         >
//                           <span>{p.product_name}</span>
//                           <small>{unitNamesOf(p)}</small>
//                         </button>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </div>
//             </div>

//             <div className="field">
//               <label htmlFor="en-kgs">Weight</label>
//               <div className="input-wrap">
//                 <input
//                   id="en-kgs"
//                   inputMode="decimal"
//                   className="input"
//                   placeholder="0.000"
//                   value={kgs}
//                   onChange={(e) => setKgs(e.target.value)}
//                   disabled={weightDisabled}
//                 />
//                 <span className="input-suffix">KGS</span>
//               </div>
//             </div>

//             <div className="field">
//               <label htmlFor="en-qty">Quantity</label>
//               <div className="qty-wrap">
//                 <input
//                   id="en-qty"
//                   inputMode="decimal"
//                   className="input"
//                   placeholder={selectedProduct && qtyUnits.length === 0 ? 'Not applicable' : 'Enter quantity'}
//                   value={qty}
//                   onChange={(e) => setQty(e.target.value)}
//                   disabled={qtyDisabled}
//                 />
//                 {qtyUnits.length === 1 && <span className="qty-unit">{qtyUnits[0].unit_name}</span>}
//                 {qtyUnits.length > 1 && (
//                   <>
//                     <select
//                       className="qty-unit-select"
//                       aria-label="Quantity unit"
//                       value={selectedQtyUnit ? String(selectedQtyUnit.id) : ''}
//                       onChange={(e) => setQtyUnitId(e.target.value)}
//                       disabled={adding}
//                     >
//                       {qtyUnits.map((u) => (
//                         <option key={u.id} value={u.id}>
//                           {u.unit_name}
//                         </option>
//                       ))}
//                     </select>
//                     <ChevronDown size={14} className="arrow" />
//                   </>
//                 )}
//               </div>
//             </div>

//             <button type="submit" className="btn btn-primary" disabled={loading || adding || Boolean(error)}>
//               {adding && <span className="spinner" />}
//               Add to List
//             </button>
//           </div>

//           {error && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               Could not load products/units.{' '}
//               <button type="button" className="btn btn-outline" onClick={reload}>
//                 Retry
//               </button>
//             </p>
//           )}
//           {selectedProduct && !productHasKgs && (
//             <p className="field-hint" style={{ marginTop: 8 }}>
//               This product has no KGS unit, so Weight is off. It is entered in {qtyUnits.map((u) => u.unit_name).join(' / ') || 'no unit'}.
//             </p>
//           )}
//           {!loading && !error && !kgsUnit && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               Create a unit named “KGS” on the Units page to use the Weight box.
//             </p>
//           )}
//           {addError && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               {addError}
//             </p>
//           )}
//         </form>

//         <div className="table-card">
//           <div className="report-head added-actions">
//             <span>Added Products ({groups.length})</span>
//             {groups.length > 0 && (
//               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                 <button
//                   type="button"
//                   className="btn btn-outline"
//                   onClick={exportCsv}
//                   title="Download the list as CSV"
//                 >
//                   <Download size={16} />
//                   Export CSV
//                 </button>

//                 <button
//                   type="button"
//                   className="icon-btn icon-btn-blue"
//                   aria-label="Print / share list"
//                   title="Print / share list"
//                   onClick={() => setPrintOpen(true)}
//                 >
//                   <Printer size={16} />
//                 </button>
//               </div>
//             )}
//           </div>
//           <div className="table-scroll">
//             <table className="data">
//               <thead>
//                 <tr>
//                   <th style={{ width: 90 }}>S.No</th>
//                   <th>Product</th>
//                   <th>Quantity</th>
//                   <th>Added At</th>
//                   <th className="center">Edit</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {groups.map((g, i) => (
//                   <tr key={g.productId}>
//                     <td>{i + 1}</td>
//                     <td>{rowName(g)}</td>

//                     {/* 45 BUNDLE / 25 KGS / 23 PCS */}
//                     <td>
//                       {g.items.map((u, k) => (
//                         <span key={u.key}>
//                           {k > 0 && <span className="qty-sep">/</span>}
//                           {formatQtyWithUnit(u.quantity, u.unit)}
//                         </span>
//                       ))}
//                     </td>

//                     <td>{formatTime(new Date(g.latestAt))}</td>
//                     <td className="center">
//                       <div className="actions">
//                         <button
//                           type="button"
//                           className="icon-btn icon-btn-blue"
//                           aria-label="Edit entry"
//                           title="Edit"
//                           onClick={() => openEdit(g)}
//                         >
//                           <Pencil size={15} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <TableState
//             loading={false}
//             error={null}
//             empty={groups.length === 0}
//             emptyText="Nothing added yet. Choose a product, enter a quantity and click “Add to List”."
//             onRetry={reload}
//           />
//         </div>
//       </div>

//       {editRow && (
//         <Modal title="Edit Entry" onClose={() => !editBusy && setEditRow(null)} busy={editBusy}>
//           <form onSubmit={saveEdit} className="stack" style={{ gap: 16 }} noValidate>
//             {editError && <div className="form-error">{editError}</div>}
//             <div className="field">
//               <label>Product</label>
//               <input className="input" value={rowName(editRow.group)} disabled />
//             </div>

//             <div className="edit-qty-grid">
//               {editRow.group.items.map((u, k) => (
//                 <div className="field" key={u.key}>
//                   <label htmlFor={`ee-qty-${u.key}`}>
//                     Quantity ({u.unit}) <span className="req">*</span>
//                   </label>
//                   <input
//                     id={`ee-qty-${u.key}`}
//                     inputMode="decimal"
//                     className="input"
//                     value={editRow.values[u.key] ?? ''}
//                     onChange={(ev) =>
//                       setEditRow((s) => ({
//                         ...s,
//                         values: { ...s.values, [u.key]: ev.target.value },
//                       }))
//                     }
//                     autoFocus={k === 0}
//                   />
//                 </div>
//               ))}
//             </div>

//             <div className="modal-actions">
//               <button type="button" className="btn btn-outline" onClick={() => setEditRow(null)} disabled={editBusy}>
//                 Cancel
//               </button>
//               <button type="submit" className="btn btn-primary" disabled={editBusy}>
//                 {editBusy && <span className="spinner" />}
//                 Save Changes
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}

//       {printOpen && (
//         <PdfActionsModal title="Print list" build={buildPdf} onClose={() => setPrintOpen(false)} />
//       )}
//     </>
//   )
// }





// import { useEffect, useMemo, useRef, useState } from 'react'
// import { Calendar, Clock, Download, Pencil, Printer, Search, ChevronDown } from 'lucide-react'
// import Modal from '../components/Modal'
// import TableState from '../components/TableState'
// import useAsyncData from '../hooks/useAsyncData'
// import useToast from '../hooks/useToast'
// import useNow from '../hooks/useNow'
// import { getProducts } from '../services/productsService'
// import { getUnits } from '../services/unitsService'
// import { createStockEntry, createStockAdjustment } from '../services/stockService'
// import { getErrorMessage } from '../services/api'
// import { formatDate, formatQtyWithUnit, formatTime } from '../utils/format'
// import PdfActionsModal from '../components/PdfActionsModal'
// import { buildEntryListPdf } from '../utils/voucherPdf'
// import { downloadCsv, todayStamp } from '../utils/pdfActions'

// const load = () => Promise.all([getProducts(), getUnits()])

// const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals

// // KGS always has its own Weight box. Matched by unit name, case-insensitive.
// const KGS_NAME = /^(kgs?|kilograms?)$/i
// const PCS_NAME = /^(pcs?|pieces?|nos)$/i
// const isKgs = (u) => KGS_NAME.test(String(u?.unit_name ?? '').trim())

// const round3 = (n) => Math.round(Number(n) * 1000) / 1000

// // Normalise whatever the backend returns into an array of unit ids.
// // Supports: unit_ids: [1,2] | units: [{id:1},...] | legacy unit_id: 1
// const getUnitIds = (p) => {
//   if (!p) return []
//   if (Array.isArray(p.unit_ids)) return p.unit_ids.map(Number)
//   if (Array.isArray(p.units)) return p.units.map((u) => Number(u?.id ?? u))
//   return p.unit_id != null ? [Number(p.unit_id)] : []
// }

// // Key that identifies the unit of an added row (older saved rows may have no unitId).
// const unitKey = (r) => String(r.unitId ?? r.unit)

// const STORAGE_KEY = 'entry-added-list'

// // The grid below the form keeps what was added, even after a refresh (this browser tab only).
// const loadSaved = () => {
//   try {
//     const raw = sessionStorage.getItem(STORAGE_KEY)
//     const list = raw ? JSON.parse(raw) : []
//     return Array.isArray(list) ? list : []
//   } catch {
//     return []
//   }
// }

// /*
//  * ENTRY page — stock IN only.
//  *  - Pick a product (type to search).
//  *  - Weight box: always shown, KGS.
//  *  - Quantity box: unit comes from the PRODUCT.
//  *      one non-KGS unit  -> shown as a fixed label (e.g. PCS)
//  *      several units     -> small arrow to switch (e.g. PCS / BUNDLE)
//  *  - "Add to List" posts a stock IN for each box that has a value.
//  *  - The grid shows ONE row per product. Every unit added for that product
//  *    (at any time) is summed and shown as "45 BUNDLE / 25 KGS / 23 PCS".
//  *  - Printer icon: download or share the list as PDF.
//  */
// export default function Entry() {
//   const toast = useToast()
//   const now = useNow()

//   const { data, loading, error, reload } = useAsyncData(load)
//   const [products, units] = data ?? [[], []]

//   const unitById = useMemo(() => Object.fromEntries(units.map((u) => [Number(u.id), u])), [units])
//   const kgsUnit = useMemo(() => units.find((u) => u.is_active !== false && isKgs(u)), [units])

//   const productOptions = useMemo(
//     () =>
//       products
//         .filter((p) => p.is_active)
//         .sort((a, b) => a.product_name.localeCompare(b.product_name)),
//     [products],
//   )
//   const productName = useMemo(
//     () => Object.fromEntries(products.map((p) => [p.id, p.product_name])),
//     [products],
//   )
//   const productById = useMemo(
//     () => Object.fromEntries(products.map((p) => [p.id, p])),
//     [products],
//   )

//   const [productId, setProductId] = useState('')
//   const [productText, setProductText] = useState('') // text shown in the searchable box
//   const [pickerOpen, setPickerOpen] = useState(false)
//   const [pickerIndex, setPickerIndex] = useState(-1)
//   const [kgs, setKgs] = useState('')
//   const [qty, setQty] = useState('')
//   const [qtyUnitId, setQtyUnitId] = useState('')
//   const [addError, setAddError] = useState('')
//   const [adding, setAdding] = useState(false)
//   const [added, setAdded] = useState(loadSaved) // raw entries, newest first
//   const [editRow, setEditRow] = useState(null) // { group, values: { [unitKey]: text } }
//   const [editError, setEditError] = useState('')
//   const [editBusy, setEditBusy] = useState(false)
//   const [printOpen, setPrintOpen] = useState(false)
//   const productInputRef = useRef(null)

//   useEffect(() => {
//     try {
//       sessionStorage.setItem(STORAGE_KEY, JSON.stringify(added))
//     } catch {
//       /* storage unavailable — the grid still works for this visit */
//     }
//   }, [added])

//   const selectedProduct = useMemo(
//     () => products.find((p) => String(p.id) === String(productId)),
//     [products, productId],
//   )

//   // Units of the chosen product.
//   const productUnits = useMemo(
//     () =>
//       getUnitIds(selectedProduct)
//         .map((id) => unitById[id])
//         .filter((u) => u && u.is_active !== false),
//     [selectedProduct, unitById],
//   )
//   const productHasKgs = productUnits.some(isKgs)
//   // Everything except KGS goes in the Quantity box (PCS, BUNDLE, ...).
//   const qtyUnits = useMemo(() => productUnits.filter((u) => !isKgs(u)), [productUnits])
//   const defaultQtyUnit = useMemo(() => qtyUnits.find((u) => PCS_NAME.test(String(u.unit_name).trim())) ?? qtyUnits[0], [qtyUnits])

//   // Valid selection: keep the user's choice only if the product still has that unit.
//   const selectedQtyUnit = qtyUnits.find((u) => String(u.id) === String(qtyUnitId)) ?? defaultQtyUnit

//   const weightDisabled = adding || (Boolean(selectedProduct) && !productHasKgs)
//   const qtyDisabled = adding || !selectedProduct || qtyUnits.length === 0

//   // Product search: filters as you type.
//   const filteredProducts = useMemo(() => {
//     const q = productText.trim().toLowerCase()
//     // When the box shows the chosen product, show the full list again.
//     const showAll = selectedProduct && q === selectedProduct.product_name.toLowerCase()
//     return productOptions.filter((p) => showAll || q === '' || p.product_name.toLowerCase().includes(q))
//   }, [productOptions, productText, selectedProduct])

//   const unitNamesOf = (p) =>
//     getUnitIds(p)
//       .map((id) => unitById[id]?.unit_name)
//       .filter(Boolean)
//       .join(', ')

//   const chooseProduct = (p) => {
//     setProductId(String(p.id))
//     setProductText(p.product_name)
//     setPickerOpen(false)
//     setPickerIndex(-1)
//     setAddError('')
//     // New product -> its own units; clear boxes and unit choice.
//     setKgs('')
//     setQty('')
//     setQtyUnitId('')
//   }

//   const clearProduct = () => {
//     setProductId('')
//     setKgs('')
//     setQty('')
//     setQtyUnitId('')
//   }

//   const onProductKeyDown = (e) => {
//     if (e.key === 'ArrowDown') {
//       e.preventDefault()
//       setPickerOpen(true)
//       setPickerIndex((i) => Math.min(i + 1, filteredProducts.length - 1))
//     } else if (e.key === 'ArrowUp') {
//       e.preventDefault()
//       setPickerIndex((i) => Math.max(i - 1, 0))
//     } else if (e.key === 'Enter' && pickerOpen) {
//       e.preventDefault()
//       const pick = filteredProducts[pickerIndex >= 0 ? pickerIndex : 0]
//       if (pick && (pickerIndex >= 0 || filteredProducts.length === 1)) chooseProduct(pick)
//     } else if (e.key === 'Escape') {
//       setPickerOpen(false)
//     }
//   }

//   const handleAdd = async (e) => {
//     e.preventDefault()
//     if (adding) return

//     const kgsVal = kgs.trim()
//     const qtyVal = qty.trim()

//     if (!selectedProduct) return setAddError('Select a product.')
//     if (!kgsVal && !qtyVal) return setAddError('Enter a weight (KGS) or a quantity.')
//     if (kgsVal && (!QTY_RE.test(kgsVal) || Number(kgsVal) <= 0))
//       return setAddError('KGS must be greater than 0 (up to 3 decimals).')
//     if (qtyVal && (!QTY_RE.test(qtyVal) || Number(qtyVal) <= 0))
//       return setAddError('Quantity must be greater than 0 (up to 3 decimals).')
//     if (kgsVal && !kgsUnit) return setAddError('Unit "KGS" does not exist. Create it on the Units page.')
//     if (kgsVal && !productHasKgs)
//       return setAddError(`"${selectedProduct.product_name}" does not have the KGS unit. Add it from the Products page.`)
//     if (qtyVal && !selectedQtyUnit)
//       return setAddError(`"${selectedProduct.product_name}" has no PCS/BUNDLE unit. Add it from the Products page.`)

//     setAddError('')
//     setAdding(true)

//     const pid = Number(productId)
//     const pname = productName[pid] ?? `#${pid}`
//     const jobs = []
//     if (kgsVal) jobs.push({ unit: kgsUnit, value: Number(kgsVal), clear: () => setKgs('') })
//     if (qtyVal) jobs.push({ unit: selectedQtyUnit, value: Number(qtyVal), clear: () => setQty('') })

//     const saved = []
//     const failed = []
//     const rowsAdded = []
//     // Sequential, so a failure on one unit never hides the other result.
//     for (const job of jobs) {
//       try {
//         await createStockEntry(pid, job.value, Number(job.unit.id))
//         job.clear()
//         saved.push(formatQtyWithUnit(job.value, job.unit.unit_name))
//         rowsAdded.push({
//           id: `${Date.now()}-${job.unit.id}`,
//           productId: pid,
//           productName: pname,
//           quantity: job.value,
//           unit: job.unit.unit_name,
//           unitId: Number(job.unit.id),
//           at: new Date().toISOString(),
//         })
//       } catch (err) {
//         failed.push(`${job.unit.unit_name}: ${getErrorMessage(err)}`)
//       }
//     }

//     if (rowsAdded.length) setAdded((prev) => [...rowsAdded, ...prev])
//     if (saved.length) toast.success(`Stock added: ${saved.join(' + ')}.`)
//     if (failed.length) {
//       const message = failed.join(' | ')
//       setAddError(message)
//       toast.error(message)
//     }
//     setAdding(false)
//   }

//   // Product names shown in the list always follow the latest edited name.
//   const rowName = (g) => productName[g.productId] ?? g.productName

//   /*
//    * One group per product. `added` is newest first, so the product that was
//    * added to most recently comes first. Units of the same product are summed,
//    * no matter when they were added, and listed in the product's own unit order.
//    */
//   const groups = useMemo(() => {
//     const map = new Map()

//     added.forEach((r) => {
//       let g = map.get(r.productId)

//       if (!g) {
//         g = {
//           productId: r.productId,
//           productName: r.productName,
//           latestAt: r.at,
//           units: new Map(),
//         }
//         map.set(r.productId, g)
//       }

//       const k = unitKey(r)
//       // `added` is newest first, so the first row seen for a unit holds its latest time.
//       // Editing a quantity never touches this time.
//       const u = g.units.get(k) ?? {
//         key: k,
//         unit: r.unit,
//         unitId: r.unitId,
//         quantity: 0,
//         at: r.at,
//       }

//       u.quantity = round3(u.quantity + Number(r.quantity))
//       g.units.set(k, u)
//     })

//     return [...map.values()].map((g) => {
//       const order = getUnitIds(productById[g.productId])
//       const rank = (u) => {
//         const i = order.indexOf(Number(u.unitId))
//         return i === -1 ? 999 : i
//       }

//       return {
//         ...g,
//         items: [...g.units.values()].sort((a, b) => rank(a) - rank(b)),
//       }
//     })
//   }, [added, productById])

//   // "45 BUNDLE / 25 KGS / 23 PCS"
//   const groupQtyText = (g) =>
//     g.items.map((u) => formatQtyWithUnit(u.quantity, u.unit)).join(' / ')

//   // Time of each unit, in the same order as the quantities.
//   // If every unit was added at the same time, it is shown once.
//   const groupTimes = (g) => {
//     const times = g.items.map((u) => formatTime(new Date(u.at)))

//     return times.every((t) => t === times[0]) ? [times[0]] : times
//   }

//   const groupTimeText = (g) => groupTimes(g).join(' / ')

//   const openEdit = (g) => {
//     setEditError('')
//     setEditRow({
//       group: g,
//       values: Object.fromEntries(g.items.map((u) => [u.key, String(u.quantity)])),
//     })
//   }

//   // Replace every raw row of one product+unit with a single row holding the new total.
//   const applyTotal = (prev, productId, key, newQty) => {
//     let kept = false

//     return prev.flatMap((r) => {
//       if (r.productId !== productId || unitKey(r) !== key) return [r]
//       if (kept) return []
//       kept = true
//       return [{ ...r, quantity: newQty }]
//     })
//   }

//   // Change the quantity of any unit in a row. Stock is corrected by the difference.
//   const saveEdit = async (e) => {
//     e.preventDefault()
//     if (editBusy || !editRow) return

//     const { group, values } = editRow

//     // Validate every box first.
//     for (const u of group.items) {
//       const text = (values[u.key] ?? '').trim()

//       if (!QTY_RE.test(text) || Number(text) <= 0) {
//         return setEditError(
//           `${u.unit}: quantity must be greater than 0 (up to 3 decimals).`,
//         )
//       }
//     }

//     // Only the units that actually changed.
//     const changes = group.items
//       .map((u) => {
//         const newQty = Number(values[u.key].trim())
//         const delta = round3(newQty - Number(u.quantity))
//         const unitId =
//           u.unitId ??
//           units.find((x) => String(x.unit_name).trim() === String(u.unit).trim())?.id

//         return { u, newQty, delta, unitId }
//       })
//       .filter((c) => c.delta !== 0)

//     if (changes.length === 0) return setEditRow(null)

//     const missing = changes.find((c) => !c.unitId)
//     if (missing) return setEditError(`Unit not found for ${missing.u.unit}.`)

//     setEditError('')
//     setEditBusy(true)

//     const done = []
//     const failed = []

//     // Sequential, so one failure never hides the other results.
//     for (const c of changes) {
//       try {
//         if (c.delta > 0) {
//           await createStockEntry(Number(group.productId), c.delta, Number(c.unitId))
//         } else {
//           await createStockAdjustment(Number(group.productId), c.delta, Number(c.unitId))
//         }

//         done.push(c)
//       } catch (err) {
//         failed.push(`${c.u.unit}: ${getErrorMessage(err)}`)
//       }
//     }

//     if (done.length) {
//       setAdded((prev) =>
//         done.reduce(
//           (list, c) => applyTotal(list, group.productId, c.u.key, c.newQty),
//           prev,
//         ),
//       )

//       toast.success(
//         `Updated: ${done.map((c) => formatQtyWithUnit(c.newQty, c.u.unit)).join(' / ')}.`,
//       )
//     }

//     if (failed.length) {
//       setEditError(failed.join(' | '))
//     } else {
//       setEditRow(null)
//     }

//     setEditBusy(false)
//   }

//   /* ---------------- CSV / PDF ---------------- */
//   const exportCsv = () => {
//     if (groups.length === 0) {
//       toast.error('There is nothing to export.')
//       return
//     }

//     downloadCsv(`mothys-entry-list-${todayStamp()}.csv`, [
//       ['S.No', 'Product', 'Quantity', 'Added At'],
//       ...groups.map((g, i) => [
//         i + 1,
//         rowName(g),
//         groupQtyText(g),
//         `${formatDate(new Date(g.latestAt))} ${groupTimeText(g)}`,
//       ]),
//     ])
//   }

//   // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
//   // One item per product; the quantity is the combined text, e.g. "45 BUNDLE / 25 KGS / 23 PCS".
//   const buildPdf = () =>
//     buildEntryListPdf({
//       date: new Date(),
//       items: groups.map((g) => ({
//         name: rowName(g),
//         quantity: groupQtyText(g),
//         unit: '',
//         at: g.latestAt,
//       })),
//     })

//   return (
//     <>
//       <style>{`
//         .entry-grid {
//           display: grid;
//           grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.2fr) auto;
//           gap: 16px;
//           align-items: end;
//         }

//         .entry-grid .input-wrap {
//           width: 100%;
//         }

//         /* Searchable product box */
//         .combo {
//           position: relative;
//           width: 100%;
//         }

//         .combo > svg.lead {
//           position: absolute;
//           left: 14px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #8a97ad;
//           pointer-events: none;
//         }

//         .combo .input {
//           padding-left: 42px;
//           padding-right: 40px;
//         }

//         .combo > svg.trail {
//           position: absolute;
//           right: 14px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #64748b;
//           pointer-events: none;
//         }

//         .combo-list {
//           position: absolute;
//           top: calc(100% + 4px);
//           left: 0;
//           right: 0;
//           z-index: 30;
//           max-height: 260px;
//           margin: 0;
//           padding: 4px;
//           overflow-y: auto;
//           list-style: none;
//           background: #fff;
//           border: 1px solid #d9e1ed;
//           border-radius: 10px;
//           box-shadow: 0 10px 28px rgba(15, 30, 66, .14);
//         }

//         .combo-item {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//           width: 100%;
//           padding: 9px 10px;
//           border: 0;
//           border-radius: 8px;
//           background: transparent;
//           color: #253653;
//           font-size: 14px;
//           font-weight: 600;
//           text-align: left;
//           cursor: pointer;
//         }

//         .combo-item:hover,
//         .combo-item.active {
//           background: #eef3ff;
//           color: #1d4ed8;
//         }

//         .combo-item small {
//           color: #8a97ad;
//           font-size: 12px;
//           font-weight: 600;
//         }

//         .combo-empty {
//           padding: 12px 10px;
//           color: #8a97ad;
//           font-size: 14px;
//         }

//         /* Quantity box: unit is fixed text, or a small arrow when the product has several units */
//         .qty-wrap {
//           position: relative;
//           display: flex;
//           align-items: center;
//           width: 100%;
//         }

//         .qty-wrap .input {
//           width: 100%;
//           padding-right: 96px;
//         }

//         .qty-unit {
//           position: absolute;
//           right: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           display: inline-flex;
//           align-items: center;
//           gap: 2px;
//           color: #64748b;
//           font-size: 14px;
//           font-weight: 700;
//           pointer-events: none;
//         }

//         .qty-unit-select {
//           position: absolute;
//           right: 6px;
//           top: 50%;
//           transform: translateY(-50%);
//           height: 32px;
//           max-width: 90px;
//           padding: 0 22px 0 8px;
//           border: 0;
//           border-radius: 8px;
//           background: #eef3ff;
//           color: #1d4ed8;
//           font-size: 13px;
//           font-weight: 700;
//           cursor: pointer;
//           appearance: none;
//           -webkit-appearance: none;
//         }

//         .qty-wrap > svg.arrow {
//           position: absolute;
//           right: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #1d4ed8;
//           pointer-events: none;
//         }

//         .added-actions {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 12px;
//         }

//         .print-options {
//           display: grid;
//           gap: 12px;
//         }

//         .print-options .btn {
//           justify-content: center;
//           width: 100%;
//         }

//         .qty-sep {
//           color: #8a97ad;
//           font-weight: 400;
//           padding: 0 6px;
//         }

//         .edit-qty-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//           gap: 12px;
//         }

//         @media (max-width: 900px) {
//           .entry-grid {
//             grid-template-columns: 1fr 1fr;
//           }

//           .entry-grid .field-product,
//           .entry-grid .btn {
//             grid-column: 1 / -1;
//           }
//         }

//         @media (max-width: 520px) {
//           .entry-grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>

//       <div className="page-head">
//         <h1>Entry</h1>
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
//         <form className="card" onSubmit={handleAdd} noValidate>
//           <h2 className="card-title">Add Product Entry</h2>

//           <div className="entry-grid">
//             <div className="field field-product">
//               <label htmlFor="en-product">
//                 Product <span className="req">*</span>
//               </label>
//               <div className="combo">
//                 <Search size={18} className="lead" />
//                 <input
//                   id="en-product"
//                   ref={productInputRef}
//                   className="input"
//                   placeholder={loading ? 'Loading products…' : 'Search or select product'}
//                   value={productText}
//                   autoComplete="off"
//                   role="combobox"
//                   aria-expanded={pickerOpen}
//                   aria-controls="en-product-list"
//                   disabled={loading || adding}
//                   onChange={(e) => {
//                     setProductText(e.target.value)
//                     setPickerOpen(true)
//                     setPickerIndex(-1)
//                     // typing again after a pick means the old pick no longer applies
//                     if (productId) clearProduct()
//                   }}
//                   onFocus={(e) => {
//                     setPickerOpen(true)
//                     e.target.select()
//                   }}
//                   onBlur={() => {
//                     setPickerOpen(false)
//                     // leave the box showing the chosen product, or empty if nothing is chosen
//                     setProductText(selectedProduct ? selectedProduct.product_name : '')
//                   }}
//                   onKeyDown={onProductKeyDown}
//                 />
//                 <ChevronDown size={18} className="trail" />
//                 {pickerOpen && (
//                   <ul className="combo-list" id="en-product-list" role="listbox">
//                     {filteredProducts.length === 0 && <li className="combo-empty">No product found.</li>}
//                     {filteredProducts.map((p, i) => (
//                       <li key={p.id} role="option" aria-selected={String(p.id) === String(productId)}>
//                         <button
//                           type="button"
//                           className={`combo-item ${i === pickerIndex ? 'active' : ''}`}
//                           // mousedown (not click) so the input does not blur and close the list first
//                           onMouseDown={(e) => {
//                             e.preventDefault()
//                             chooseProduct(p)
//                           }}
//                         >
//                           <span>{p.product_name}</span>
//                           <small>{unitNamesOf(p)}</small>
//                         </button>
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </div>
//             </div>

//             <div className="field">
//               <label htmlFor="en-kgs">Weight</label>
//               <div className="input-wrap">
//                 <input
//                   id="en-kgs"
//                   inputMode="decimal"
//                   className="input"
//                   placeholder="0.000"
//                   value={kgs}
//                   onChange={(e) => setKgs(e.target.value)}
//                   disabled={weightDisabled}
//                 />
//                 <span className="input-suffix">KGS</span>
//               </div>
//             </div>

//             <div className="field">
//               <label htmlFor="en-qty">Quantity</label>
//               <div className="qty-wrap">
//                 <input
//                   id="en-qty"
//                   inputMode="decimal"
//                   className="input"
//                   placeholder={selectedProduct && qtyUnits.length === 0 ? 'Not applicable' : 'Enter quantity'}
//                   value={qty}
//                   onChange={(e) => setQty(e.target.value)}
//                   disabled={qtyDisabled}
//                 />
//                 {qtyUnits.length === 1 && <span className="qty-unit">{qtyUnits[0].unit_name}</span>}
//                 {qtyUnits.length > 1 && (
//                   <>
//                     <select
//                       className="qty-unit-select"
//                       aria-label="Quantity unit"
//                       value={selectedQtyUnit ? String(selectedQtyUnit.id) : ''}
//                       onChange={(e) => setQtyUnitId(e.target.value)}
//                       disabled={adding}
//                     >
//                       {qtyUnits.map((u) => (
//                         <option key={u.id} value={u.id}>
//                           {u.unit_name}
//                         </option>
//                       ))}
//                     </select>
//                     <ChevronDown size={14} className="arrow" />
//                   </>
//                 )}
//               </div>
//             </div>

//             <button type="submit" className="btn btn-primary" disabled={loading || adding || Boolean(error)}>
//               {adding && <span className="spinner" />}
//               Add to List
//             </button>
//           </div>

//           {error && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               Could not load products/units.{' '}
//               <button type="button" className="btn btn-outline" onClick={reload}>
//                 Retry
//               </button>
//             </p>
//           )}
//           {selectedProduct && !productHasKgs && (
//             <p className="field-hint" style={{ marginTop: 8 }}>
//               This product has no KGS unit, so Weight is off. It is entered in {qtyUnits.map((u) => u.unit_name).join(' / ') || 'no unit'}.
//             </p>
//           )}
//           {!loading && !error && !kgsUnit && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               Create a unit named “KGS” on the Units page to use the Weight box.
//             </p>
//           )}
//           {addError && (
//             <p className="field-error" style={{ marginTop: 8 }}>
//               {addError}
//             </p>
//           )}
//         </form>

//         <div className="table-card">
//           <div className="report-head added-actions">
//             <span>Added Products ({groups.length})</span>
//             {groups.length > 0 && (
//               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                 <button
//                   type="button"
//                   className="btn btn-outline"
//                   onClick={exportCsv}
//                   title="Download the list as CSV"
//                 >
//                   <Download size={16} />
//                   Export CSV
//                 </button>

//                 <button
//                   type="button"
//                   className="icon-btn icon-btn-blue"
//                   aria-label="Print / share list"
//                   title="Print / share list"
//                   onClick={() => setPrintOpen(true)}
//                 >
//                   <Printer size={16} />
//                 </button>
//               </div>
//             )}
//           </div>
//           <div className="table-scroll">
//             <table className="data">
//               <thead>
//                 <tr>
//                   <th style={{ width: 90 }}>S.No</th>
//                   <th>Product</th>
//                   <th>Quantity</th>
//                   <th>Added At</th>
//                   <th className="center">Edit</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {groups.map((g, i) => (
//                   <tr key={g.productId}>
//                     <td>{i + 1}</td>
//                     <td>{rowName(g)}</td>

//                     {/* 45 BUNDLE / 25 KGS / 23 PCS */}
//                     <td>
//                       {g.items.map((u, k) => (
//                         <span key={u.key}>
//                           {k > 0 && <span className="qty-sep">/</span>}
//                           {formatQtyWithUnit(u.quantity, u.unit)}
//                         </span>
//                       ))}
//                     </td>

//                     {/* One time per unit: 10:57 AM / 11:02 AM */}
//                     <td>
//                       {groupTimes(g).map((t, k) => (
//                         <span key={k}>
//                           {k > 0 && <span className="qty-sep">/</span>}
//                           {t}
//                         </span>
//                       ))}
//                     </td>
//                     <td className="center">
//                       <div className="actions">
//                         <button
//                           type="button"
//                           className="icon-btn icon-btn-blue"
//                           aria-label="Edit entry"
//                           title="Edit"
//                           onClick={() => openEdit(g)}
//                         >
//                           <Pencil size={15} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <TableState
//             loading={false}
//             error={null}
//             empty={groups.length === 0}
//             emptyText="Nothing added yet. Choose a product, enter a quantity and click “Add to List”."
//             onRetry={reload}
//           />
//         </div>
//       </div>

//       {editRow && (
//         <Modal title="Edit Entry" onClose={() => !editBusy && setEditRow(null)} busy={editBusy}>
//           <form onSubmit={saveEdit} className="stack" style={{ gap: 16 }} noValidate>
//             {editError && <div className="form-error">{editError}</div>}
//             <div className="field">
//               <label>Product</label>
//               <input className="input" value={rowName(editRow.group)} disabled />
//             </div>

//             <div className="edit-qty-grid">
//               {editRow.group.items.map((u, k) => (
//                 <div className="field" key={u.key}>
//                   <label htmlFor={`ee-qty-${u.key}`}>
//                     Quantity ({u.unit}) <span className="req">*</span>
//                   </label>
//                   <input
//                     id={`ee-qty-${u.key}`}
//                     inputMode="decimal"
//                     className="input"
//                     value={editRow.values[u.key] ?? ''}
//                     onChange={(ev) =>
//                       setEditRow((s) => ({
//                         ...s,
//                         values: { ...s.values, [u.key]: ev.target.value },
//                       }))
//                     }
//                     autoFocus={k === 0}
//                   />
//                 </div>
//               ))}
//             </div>

//             <div className="modal-actions">
//               <button type="button" className="btn btn-outline" onClick={() => setEditRow(null)} disabled={editBusy}>
//                 Cancel
//               </button>
//               <button type="submit" className="btn btn-primary" disabled={editBusy}>
//                 {editBusy && <span className="spinner" />}
//                 Save Changes
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}

//       {printOpen && (
//         <PdfActionsModal title="Print list" build={buildPdf} onClose={() => setPrintOpen(false)} />
//       )}
//     </>
//   )
// }



import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Clock, Download, Pencil, Printer, Search, ChevronDown } from 'lucide-react'
import Modal from '../components/Modal'
import TableState from '../components/TableState'
import useAsyncData from '../hooks/useAsyncData'
import useToast from '../hooks/useToast'
import useNow from '../hooks/useNow'
import { getProducts } from '../services/productsService'
import { getUnits } from '../services/unitsService'
import { createStockEntry, createStockAdjustment } from '../services/stockService'
import { getErrorMessage } from '../services/api'
import { formatDate, formatQtyWithUnit, formatTime } from '../utils/format'
import PdfActionsModal from '../components/PdfActionsModal'
import { buildEntryListPdf } from '../utils/voucherPdf'
import { downloadCsv, todayStamp } from '../utils/pdfActions'

const load = () => Promise.all([getProducts(), getUnits()])

const QTY_RE = /^\d+(\.\d{1,3})?$/ // up to 3 decimals

// KGS always has its own Weight box. Matched by unit name, case-insensitive.
const KGS_NAME = /^(kgs?|kilograms?)$/i
const PCS_NAME = /^(pcs?|pieces?|nos)$/i
const isKgs = (u) => KGS_NAME.test(String(u?.unit_name ?? '').trim())

const round3 = (n) => Math.round(Number(n) * 1000) / 1000

// Normalise whatever the backend returns into an array of unit ids.
// Supports: unit_ids: [1,2] | units: [{id:1},...] | legacy unit_id: 1
const getUnitIds = (p) => {
  if (!p) return []
  if (Array.isArray(p.unit_ids)) return p.unit_ids.map(Number)
  if (Array.isArray(p.units)) return p.units.map((u) => Number(u?.id ?? u))
  return p.unit_id != null ? [Number(p.unit_id)] : []
}

// Key that identifies the unit of an added row (older saved rows may have no unitId).
const unitKey = (r) => String(r.unitId ?? r.unit)

const STORAGE_KEY = 'entry-added-list'

// The grid below the form keeps what was added, even after a refresh (this browser tab only).
const loadSaved = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/*
 * ENTRY page — stock IN only.
 *  - Pick a product (type to search).
 *  - Weight box: always shown, KGS.
 *  - Quantity box: unit comes from the PRODUCT.
 *      one non-KGS unit  -> shown as a fixed label (e.g. PCS)
 *      several units     -> small arrow to switch (e.g. PCS / BUNDLE)
 *  - "Add to List" posts a stock IN for each box that has a value.
 *  - The grid shows ONE row per product. Every unit added for that product
 *    (at any time) is summed and shown as "45 BUNDLE / 25 KGS / 23 PCS".
 *  - Printer icon: download or share the list as PDF.
 */
export default function Entry() {
  const toast = useToast()
  const now = useNow()

  const { data, loading, error, reload } = useAsyncData(load)
  const [products, units] = data ?? [[], []]

  const unitById = useMemo(() => Object.fromEntries(units.map((u) => [Number(u.id), u])), [units])
  const kgsUnit = useMemo(() => units.find((u) => u.is_active !== false && isKgs(u)), [units])

  const productOptions = useMemo(
    () =>
      products
        .filter((p) => p.is_active)
        .sort((a, b) => a.product_name.localeCompare(b.product_name)),
    [products],
  )
  const productName = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.product_name])),
    [products],
  )
  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  )

  const [productId, setProductId] = useState('')
  const [productText, setProductText] = useState('') // text shown in the searchable box
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIndex, setPickerIndex] = useState(-1)
  const [kgs, setKgs] = useState('')
  const [qty, setQty] = useState('')
  const [qtyUnitId, setQtyUnitId] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(loadSaved) // raw entries, newest first
  const [editRow, setEditRow] = useState(null) // { group, values: { [unitKey]: text } }
  const [editError, setEditError] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const productInputRef = useRef(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(added))
    } catch {
      /* storage unavailable — the grid still works for this visit */
    }
  }, [added])

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(productId)),
    [products, productId],
  )

  // Units of the chosen product.
  const productUnits = useMemo(
    () =>
      getUnitIds(selectedProduct)
        .map((id) => unitById[id])
        .filter((u) => u && u.is_active !== false),
    [selectedProduct, unitById],
  )
  const productHasKgs = productUnits.some(isKgs)
  // Everything except KGS goes in the Quantity box (PCS, BUNDLE, ...).
  const qtyUnits = useMemo(() => productUnits.filter((u) => !isKgs(u)), [productUnits])
  const defaultQtyUnit = useMemo(() => qtyUnits.find((u) => PCS_NAME.test(String(u.unit_name).trim())) ?? qtyUnits[0], [qtyUnits])

  // Valid selection: keep the user's choice only if the product still has that unit.
  const selectedQtyUnit = qtyUnits.find((u) => String(u.id) === String(qtyUnitId)) ?? defaultQtyUnit

  const weightDisabled = adding || (Boolean(selectedProduct) && !productHasKgs)
  const qtyDisabled = adding || !selectedProduct || qtyUnits.length === 0

  // Product search: filters as you type.
  const filteredProducts = useMemo(() => {
    const q = productText.trim().toLowerCase()
    // When the box shows the chosen product, show the full list again.
    const showAll = selectedProduct && q === selectedProduct.product_name.toLowerCase()
    return productOptions.filter((p) => showAll || q === '' || p.product_name.toLowerCase().includes(q))
  }, [productOptions, productText, selectedProduct])

  const unitNamesOf = (p) =>
    getUnitIds(p)
      .map((id) => unitById[id]?.unit_name)
      .filter(Boolean)
      .join(', ')

  const chooseProduct = (p) => {
    setProductId(String(p.id))
    setProductText(p.product_name)
    setPickerOpen(false)
    setPickerIndex(-1)
    setAddError('')
    // New product -> its own units; clear boxes and unit choice.
    setKgs('')
    setQty('')
    setQtyUnitId('')
  }

  const clearProduct = () => {
    setProductId('')
    setKgs('')
    setQty('')
    setQtyUnitId('')
  }

  const onProductKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setPickerOpen(true)
      setPickerIndex((i) => Math.min(i + 1, filteredProducts.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setPickerIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && pickerOpen) {
      e.preventDefault()
      const pick = filteredProducts[pickerIndex >= 0 ? pickerIndex : 0]
      if (pick && (pickerIndex >= 0 || filteredProducts.length === 1)) chooseProduct(pick)
    } else if (e.key === 'Escape') {
      setPickerOpen(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (adding) return

    const kgsVal = kgs.trim()
    const qtyVal = qty.trim()

    if (!selectedProduct) return setAddError('Select a product.')
    if (!kgsVal && !qtyVal) return setAddError('Enter a weight (KGS) or a quantity.')
    if (kgsVal && (!QTY_RE.test(kgsVal) || Number(kgsVal) <= 0))
      return setAddError('KGS must be greater than 0 (up to 3 decimals).')
    if (qtyVal && (!QTY_RE.test(qtyVal) || Number(qtyVal) <= 0))
      return setAddError('Quantity must be greater than 0 (up to 3 decimals).')
    if (kgsVal && !kgsUnit) return setAddError('Unit "KGS" does not exist. Create it on the Units page.')
    if (kgsVal && !productHasKgs)
      return setAddError(`"${selectedProduct.product_name}" does not have the KGS unit. Add it from the Products page.`)
    if (qtyVal && !selectedQtyUnit)
      return setAddError(`"${selectedProduct.product_name}" has no PCS/BUNDLE unit. Add it from the Products page.`)

    setAddError('')
    setAdding(true)

    const pid = Number(productId)
    const pname = productName[pid] ?? `#${pid}`
    const jobs = []
    if (kgsVal) jobs.push({ unit: kgsUnit, value: Number(kgsVal), clear: () => setKgs('') })
    if (qtyVal) jobs.push({ unit: selectedQtyUnit, value: Number(qtyVal), clear: () => setQty('') })

    const saved = []
    const failed = []
    const rowsAdded = []
    // Sequential, so a failure on one unit never hides the other result.
    for (const job of jobs) {
      try {
        await createStockEntry(pid, job.value, Number(job.unit.id))
        job.clear()
        saved.push(formatQtyWithUnit(job.value, job.unit.unit_name))
        rowsAdded.push({
          id: `${Date.now()}-${job.unit.id}`,
          productId: pid,
          productName: pname,
          quantity: job.value,
          unit: job.unit.unit_name,
          unitId: Number(job.unit.id),
          at: new Date().toISOString(),
        })
      } catch (err) {
        failed.push(`${job.unit.unit_name}: ${getErrorMessage(err)}`)
      }
    }

    if (rowsAdded.length) setAdded((prev) => [...rowsAdded, ...prev])
    if (saved.length) toast.success(`Stock added: ${saved.join(' + ')}.`)
    if (failed.length) {
      const message = failed.join(' | ')
      setAddError(message)
      toast.error(message)
    }
    setAdding(false)
  }

  // Product names shown in the list always follow the latest edited name.
  const rowName = (g) => productName[g.productId] ?? g.productName

  /*
   * One group per product. `added` is newest first, so the product that was
   * added to most recently comes first. Units of the same product are summed,
   * no matter when they were added, and listed in the product's own unit order.
   */
  const groups = useMemo(() => {
    const map = new Map()

    added.forEach((r) => {
      let g = map.get(r.productId)

      if (!g) {
        g = {
          productId: r.productId,
          productName: r.productName,
          latestAt: r.at,
          units: new Map(),
        }
        map.set(r.productId, g)
      }

      const k = unitKey(r)
      const u = g.units.get(k) ?? {
        key: k,
        unit: r.unit,
        unitId: r.unitId,
        quantity: 0,
      }

      u.quantity = round3(u.quantity + Number(r.quantity))
      g.units.set(k, u)
    })

    return [...map.values()].map((g) => {
      const order = getUnitIds(productById[g.productId])
      const rank = (u) => {
        const i = order.indexOf(Number(u.unitId))
        return i === -1 ? 999 : i
      }

      return {
        ...g,
        items: [...g.units.values()].sort((a, b) => rank(a) - rank(b)),
      }
    })
  }, [added, productById])

  // "45 BUNDLE / 25 KGS / 23 PCS"
  const groupQtyText = (g) =>
    g.items.map((u) => formatQtyWithUnit(u.quantity, u.unit)).join(' / ')

  const openEdit = (g) => {
    setEditError('')
    setEditRow({
      group: g,
      values: Object.fromEntries(g.items.map((u) => [u.key, String(u.quantity)])),
    })
  }

  // Replace every raw row of one product+unit with a single row holding the new total.
  const applyTotal = (prev, productId, key, newQty) => {
    let kept = false

    return prev.flatMap((r) => {
      if (r.productId !== productId || unitKey(r) !== key) return [r]
      if (kept) return []
      kept = true
      return [{ ...r, quantity: newQty }]
    })
  }

  // Change the quantity of any unit in a row. Stock is corrected by the difference.
  const saveEdit = async (e) => {
    e.preventDefault()
    if (editBusy || !editRow) return

    const { group, values } = editRow

    // Validate every box first.
    for (const u of group.items) {
      const text = (values[u.key] ?? '').trim()

      if (!QTY_RE.test(text) || Number(text) <= 0) {
        return setEditError(
          `${u.unit}: quantity must be greater than 0 (up to 3 decimals).`,
        )
      }
    }

    // Only the units that actually changed.
    const changes = group.items
      .map((u) => {
        const newQty = Number(values[u.key].trim())
        const delta = round3(newQty - Number(u.quantity))
        const unitId =
          u.unitId ??
          units.find((x) => String(x.unit_name).trim() === String(u.unit).trim())?.id

        return { u, newQty, delta, unitId }
      })
      .filter((c) => c.delta !== 0)

    if (changes.length === 0) return setEditRow(null)

    const missing = changes.find((c) => !c.unitId)
    if (missing) return setEditError(`Unit not found for ${missing.u.unit}.`)

    setEditError('')
    setEditBusy(true)

    const done = []
    const failed = []

    // Sequential, so one failure never hides the other results.
    for (const c of changes) {
      try {
        if (c.delta > 0) {
          await createStockEntry(Number(group.productId), c.delta, Number(c.unitId))
        } else {
          await createStockAdjustment(Number(group.productId), c.delta, Number(c.unitId))
        }

        done.push(c)
      } catch (err) {
        failed.push(`${c.u.unit}: ${getErrorMessage(err)}`)
      }
    }

    if (done.length) {
      setAdded((prev) =>
        done.reduce(
          (list, c) => applyTotal(list, group.productId, c.u.key, c.newQty),
          prev,
        ),
      )

      toast.success(
        `Updated: ${done.map((c) => formatQtyWithUnit(c.newQty, c.u.unit)).join(' / ')}.`,
      )
    }

    if (failed.length) {
      setEditError(failed.join(' | '))
    } else {
      setEditRow(null)
    }

    setEditBusy(false)
  }

  /* ---------------- CSV / PDF ---------------- */
  const exportCsv = () => {
    if (groups.length === 0) {
      toast.error('There is nothing to export.')
      return
    }

    downloadCsv(`mothys-entry-list-${todayStamp()}.csv`, [
      ['S.No', 'Product', 'Quantity'],
      ...groups.map((g, i) => [i + 1, rowName(g), groupQtyText(g)]),
    ])
  }

  // Called once when the print popup opens (Print / Download / Share live in PdfActionsModal).
  // One item per product; the quantity is the combined text, e.g. "45 BUNDLE / 25 KGS / 23 PCS".
  const buildPdf = () =>
    buildEntryListPdf({
      date: new Date(),
      items: groups.map((g) => ({
        name: rowName(g),
        quantity: groupQtyText(g),
        unit: '',
        at: g.latestAt,
      })),
    })

  return (
    <>
      <style>{`
        .entry-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.2fr) auto;
          gap: 16px;
          align-items: end;
        }

        .entry-grid .input-wrap {
          width: 100%;
        }

        /* Searchable product box */
        .combo {
          position: relative;
          width: 100%;
        }

        .combo > svg.lead {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8a97ad;
          pointer-events: none;
        }

        .combo .input {
          padding-left: 42px;
          padding-right: 40px;
        }

        .combo > svg.trail {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        .combo-list {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 30;
          max-height: 260px;
          margin: 0;
          padding: 4px;
          overflow-y: auto;
          list-style: none;
          background: #fff;
          border: 1px solid #d9e1ed;
          border-radius: 10px;
          box-shadow: 0 10px 28px rgba(15, 30, 66, .14);
        }

        .combo-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          padding: 9px 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #253653;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        .combo-item:hover,
        .combo-item.active {
          background: #eef3ff;
          color: #1d4ed8;
        }

        .combo-item small {
          color: #8a97ad;
          font-size: 12px;
          font-weight: 600;
        }

        .combo-empty {
          padding: 12px 10px;
          color: #8a97ad;
          font-size: 14px;
        }

        /* Quantity box: unit is fixed text, or a small arrow when the product has several units */
        .qty-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .qty-wrap .input {
          width: 100%;
          padding-right: 96px;
        }

        .qty-unit {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          gap: 2px;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
          pointer-events: none;
        }

        .qty-unit-select {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          height: 32px;
          max-width: 90px;
          padding: 0 22px 0 8px;
          border: 0;
          border-radius: 8px;
          background: #eef3ff;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
        }

        .qty-wrap > svg.arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #1d4ed8;
          pointer-events: none;
        }

        .added-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .print-options {
          display: grid;
          gap: 12px;
        }

        .print-options .btn {
          justify-content: center;
          width: 100%;
        }

        .qty-sep {
          color: #8a97ad;
          font-weight: 400;
          padding: 0 6px;
        }

        .edit-qty-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        @media (max-width: 900px) {
          .entry-grid {
            grid-template-columns: 1fr 1fr;
          }

          .entry-grid .field-product,
          .entry-grid .btn {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 520px) {
          .entry-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-head">
        <h1>Entry</h1>
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

          <div className="entry-grid">
            <div className="field field-product">
              <label htmlFor="en-product">
                Product <span className="req">*</span>
              </label>
              <div className="combo">
                <Search size={18} className="lead" />
                <input
                  id="en-product"
                  ref={productInputRef}
                  className="input"
                  placeholder={loading ? 'Loading products…' : 'Search or select product'}
                  value={productText}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  aria-controls="en-product-list"
                  disabled={loading || adding}
                  onChange={(e) => {
                    setProductText(e.target.value)
                    setPickerOpen(true)
                    setPickerIndex(-1)
                    // typing again after a pick means the old pick no longer applies
                    if (productId) clearProduct()
                  }}
                  onFocus={(e) => {
                    setPickerOpen(true)
                    e.target.select()
                  }}
                  onBlur={() => {
                    setPickerOpen(false)
                    // leave the box showing the chosen product, or empty if nothing is chosen
                    setProductText(selectedProduct ? selectedProduct.product_name : '')
                  }}
                  onKeyDown={onProductKeyDown}
                />
                <ChevronDown size={18} className="trail" />
                {pickerOpen && (
                  <ul className="combo-list" id="en-product-list" role="listbox">
                    {filteredProducts.length === 0 && <li className="combo-empty">No product found.</li>}
                    {filteredProducts.map((p, i) => (
                      <li key={p.id} role="option" aria-selected={String(p.id) === String(productId)}>
                        <button
                          type="button"
                          className={`combo-item ${i === pickerIndex ? 'active' : ''}`}
                          // mousedown (not click) so the input does not blur and close the list first
                          onMouseDown={(e) => {
                            e.preventDefault()
                            chooseProduct(p)
                          }}
                        >
                          <span>{p.product_name}</span>
                          <small>{unitNamesOf(p)}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="field">
              <label htmlFor="en-kgs">Weight</label>
              <div className="input-wrap">
                <input
                  id="en-kgs"
                  inputMode="decimal"
                  className="input"
                  placeholder="0.000"
                  value={kgs}
                  onChange={(e) => setKgs(e.target.value)}
                  disabled={weightDisabled}
                />
                <span className="input-suffix">KGS</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="en-qty">Quantity</label>
              <div className="qty-wrap">
                <input
                  id="en-qty"
                  inputMode="decimal"
                  className="input"
                  placeholder={selectedProduct && qtyUnits.length === 0 ? 'Not applicable' : 'Enter quantity'}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  disabled={qtyDisabled}
                />
                {qtyUnits.length === 1 && <span className="qty-unit">{qtyUnits[0].unit_name}</span>}
                {qtyUnits.length > 1 && (
                  <>
                    <select
                      className="qty-unit-select"
                      aria-label="Quantity unit"
                      value={selectedQtyUnit ? String(selectedQtyUnit.id) : ''}
                      onChange={(e) => setQtyUnitId(e.target.value)}
                      disabled={adding}
                    >
                      {qtyUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unit_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="arrow" />
                  </>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || adding || Boolean(error)}>
              {adding && <span className="spinner" />}
              Add to List
            </button>
          </div>

          {error && (
            <p className="field-error" style={{ marginTop: 8 }}>
              Could not load products/units.{' '}
              <button type="button" className="btn btn-outline" onClick={reload}>
                Retry
              </button>
            </p>
          )}
          {selectedProduct && !productHasKgs && (
            <p className="field-hint" style={{ marginTop: 8 }}>
              This product has no KGS unit, so Weight is off. It is entered in {qtyUnits.map((u) => u.unit_name).join(' / ') || 'no unit'}.
            </p>
          )}
          {!loading && !error && !kgsUnit && (
            <p className="field-error" style={{ marginTop: 8 }}>
              Create a unit named “KGS” on the Units page to use the Weight box.
            </p>
          )}
          {addError && (
            <p className="field-error" style={{ marginTop: 8 }}>
              {addError}
            </p>
          )}
        </form>

        <div className="table-card">
          <div className="report-head added-actions">
            <span>Added Products ({groups.length})</span>
            {groups.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={exportCsv}
                  title="Download the list as CSV"
                >
                  <Download size={16} />
                  Export CSV
                </button>

                <button
                  type="button"
                  className="icon-btn icon-btn-blue"
                  aria-label="Print / share list"
                  title="Print / share list"
                  onClick={() => setPrintOpen(true)}
                >
                  <Printer size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>S.No</th>
                  <th>Product</th>
                  <th className="center">Quantity</th>
                  <th className="center">Edit</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, i) => (
                  <tr key={g.productId}>
                    <td>{i + 1}</td>
                    <td>{rowName(g)}</td>

                    {/* 45 BUNDLE / 25 KGS / 23 PCS */}
                    <td className="center">
                      {g.items.map((u, k) => (
                        <span key={u.key}>
                          {k > 0 && <span className="qty-sep">/</span>}
                          {formatQtyWithUnit(u.quantity, u.unit)}
                        </span>
                      ))}
                    </td>
                    <td className="center">
                      <div className="actions">
                        <button
                          type="button"
                          className="icon-btn icon-btn-blue"
                          aria-label="Edit entry"
                          title="Edit"
                          onClick={() => openEdit(g)}
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableState
            loading={false}
            error={null}
            empty={groups.length === 0}
            emptyText="Nothing added yet. Choose a product, enter a quantity and click “Add to List”."
            onRetry={reload}
          />
        </div>
      </div>

      {editRow && (
        <Modal title="Edit Entry" onClose={() => !editBusy && setEditRow(null)} busy={editBusy}>
          <form onSubmit={saveEdit} className="stack" style={{ gap: 16 }} noValidate>
            {editError && <div className="form-error">{editError}</div>}
            <div className="field">
              <label>Product</label>
              <input className="input" value={rowName(editRow.group)} disabled />
            </div>

            <div className="edit-qty-grid">
              {editRow.group.items.map((u, k) => (
                <div className="field" key={u.key}>
                  <label htmlFor={`ee-qty-${u.key}`}>
                    Quantity ({u.unit}) <span className="req">*</span>
                  </label>
                  <input
                    id={`ee-qty-${u.key}`}
                    inputMode="decimal"
                    className="input"
                    value={editRow.values[u.key] ?? ''}
                    onChange={(ev) =>
                      setEditRow((s) => ({
                        ...s,
                        values: { ...s.values, [u.key]: ev.target.value },
                      }))
                    }
                    autoFocus={k === 0}
                  />
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditRow(null)} disabled={editBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={editBusy}>
                {editBusy && <span className="spinner" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {printOpen && (
        <PdfActionsModal title="Print list" build={buildPdf} onClose={() => setPrintOpen(false)} />
      )}
    </>
  )
}
