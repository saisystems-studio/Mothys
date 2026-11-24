// import { useMemo } from 'react'
// import TableState from '../components/TableState'
// import useAsyncData from '../hooks/useAsyncData'
// import { getStock } from '../services/stockService'
// import { getUnits } from '../services/unitsService'
// import { formatQtyWithUnit } from '../utils/format'

// const load = () => Promise.all([getStock(), getUnits()])

// export default function Stock() {
//   const { data, loading, error, reload } = useAsyncData(load)
//   const [allStock, units] = data ?? [[], []]
//   // Products whose stock has run out are not listed.
//   const stock = allStock.filter((row) => Number(row.remaining_stock) > 0)
//   const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])

//   return (
//     <>
//       <div className="page-head">
//         <h1>Stock</h1>
//       </div>
//       <div className="table-card">
//         <div className="table-scroll">
//           <table className="data">
//             <thead>
//               <tr>
//                 <th style={{ width: 160 }}>S.No</th>
//                 <th>Product</th>
//                 <th className="center" style={{ width: '45%' }}>
//                   Remaining Quantity
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {stock.map((row, i) => (
//                 <tr key={row.product_id}>
//                   <td>{i + 1}</td>
//                   <td>{row.product_name}</td>
//                   <td className="qty-cell">
//                     {formatQtyWithUnit(row.remaining_stock, unitName[row.unit_id])}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         <TableState
//           loading={loading}
//           error={error}
//           empty={!loading && !error && stock.length === 0}
//           emptyText="No stock available."
//           onRetry={reload}
//         />
//       </div>
//     </>
//   )
// }


// import { useMemo, useState } from 'react'
// import { Download, Printer } from 'lucide-react'
// import TableState from '../components/TableState'
// import PdfActionsModal from '../components/PdfActionsModal'
// import useAsyncData from '../hooks/useAsyncData'
// import useToast from '../hooks/useToast'
// import { getStock } from '../services/stockService'
// import { getUnits } from '../services/unitsService'
// import { formatQtyWithUnit } from '../utils/format'
// import { buildStockListPdf } from '../utils/voucherPdf'
// import { downloadCsv, todayStamp } from '../utils/pdfActions'

// const load = () => Promise.all([getStock(), getUnits()])

// export default function Stock() {
//   const toast = useToast()
//   const { data, loading, error, reload } = useAsyncData(load)
//   const [allStock, units] = data ?? [[], []]
//   const [printOpen, setPrintOpen] = useState(false)

//   // Products whose stock has run out are not listed.
//   // One row per product AND unit (e.g. needle KGS and needle PCS are separate rows).
//   const stock = allStock.filter((row) => Number(row.remaining_stock) > 0)
//   const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])

//   const exportCsv = () => {
//     if (stock.length === 0) {
//       toast.error('There is no stock to export.')
//       return
//     }

//     downloadCsv(`mothys-stock-${todayStamp()}.csv`, [
//       ['S.No', 'Product', 'Unit', 'Remaining Quantity'],
//       ...stock.map((row, i) => [
//         i + 1,
//         row.product_name,
//         unitName[row.unit_id] ?? '',
//         Number(row.remaining_stock),
//       ]),
//     ])
//   }

//   const buildPdf = () =>
//     buildStockListPdf({
//       date: new Date(),
//       items: stock.map((row) => ({
//         name: row.product_name,
//         quantity: Number(row.remaining_stock),
//         unit: unitName[row.unit_id] ?? '',
//       })),
//     })

//   return (
//     <>
//       <div className="page-head">
//         <h1>Stock</h1>
//         <div className="page-head-tools">
//           <button
//             type="button"
//             className="btn btn-outline"
//             onClick={exportCsv}
//             disabled={loading || Boolean(error) || stock.length === 0}
//             title="Download the stock list as CSV"
//           >
//             <Download size={16} />
//             Export CSV
//           </button>

//           <button
//             type="button"
//             className="btn btn-outline"
//             onClick={() => setPrintOpen(true)}
//             disabled={loading || Boolean(error) || stock.length === 0}
//             aria-label="Print / share stock list"
//             title="Print / share stock list"
//           >
//             <Printer size={18} />
//           </button>
//         </div>
//       </div>

//       <div className="table-card">
//         <div className="table-scroll">
//           <table className="data">
//             <thead>
//               <tr>
//                 <th style={{ width: 160 }}>S.No</th>
//                 <th>Product</th>
//                 <th className="center" style={{ width: '45%' }}>
//                   Remaining Quantity
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {stock.map((row, i) => (
//                 <tr key={`${row.product_id}-${row.unit_id}`}>
//                   <td>{i + 1}</td>
//                   <td>{row.product_name}</td>
//                   <td className="qty-cell">
//                     {formatQtyWithUnit(row.remaining_stock, unitName[row.unit_id])}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         <TableState
//           loading={loading}
//           error={error}
//           empty={!loading && !error && stock.length === 0}
//           emptyText="No stock available."
//           onRetry={reload}
//         />
//       </div>

//       {printOpen && (
//         <PdfActionsModal title="Print stock list" build={buildPdf} onClose={() => setPrintOpen(false)} />
//       )}
//     </>
//   )
// }










import { useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import TableState from '../components/TableState'
import PdfActionsModal from '../components/PdfActionsModal'
import useAsyncData from '../hooks/useAsyncData'
import useToast from '../hooks/useToast'
import { getStock } from '../services/stockService'
import { getUnits } from '../services/unitsService'
import { formatQtyWithUnit } from '../utils/format'
import { buildStockListPdf } from '../utils/voucherPdf'
import { downloadCsv, todayStamp } from '../utils/pdfActions'

const load = () => Promise.all([getStock(), getUnits()])

export default function Stock() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(load)
  const [allStock, units] = data ?? [[], []]
  const [printOpen, setPrintOpen] = useState(false)

  // Products whose stock has run out are not listed.
  // One entry per product AND unit (e.g. needle KGS and needle PCS are separate entries).
  const stock = allStock.filter((row) => Number(row.remaining_stock) > 0)
  const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])

  // The table shows the same product in ONE row, its units separated by " / ".
  const groups = []
  const groupIndex = {}
  stock.forEach((row) => {
    if (!(row.product_id in groupIndex)) {
      groupIndex[row.product_id] = groups.length
      groups.push({ productId: row.product_id, name: row.product_name, lines: [] })
    }
    groups[groupIndex[row.product_id]].lines.push(row)
  })

  const exportCsv = () => {
    if (stock.length === 0) {
      toast.error('There is no stock to export.')
      return
    }

    downloadCsv(`mothys-stock-${todayStamp()}.csv`, [
      ['S.No', 'Product', 'Unit', 'Remaining Quantity'],
      ...stock.map((row, i) => [
        i + 1,
        row.product_name,
        unitName[row.unit_id] ?? '',
        Number(row.remaining_stock),
      ]),
    ])
  }

  const buildPdf = () =>
    buildStockListPdf({
      date: new Date(),
      items: stock.map((row) => ({
        name: row.product_name,
        quantity: Number(row.remaining_stock),
        unit: unitName[row.unit_id] ?? '',
      })),
    })

  return (
    <>
      <div className="page-head">
        <h1>Stock</h1>
        <div className="page-head-tools">
          <button
            type="button"
            className="btn btn-outline"
            onClick={exportCsv}
            disabled={loading || Boolean(error) || stock.length === 0}
            title="Download the stock list as CSV"
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setPrintOpen(true)}
            disabled={loading || Boolean(error) || stock.length === 0}
            aria-label="Print / share stock list"
            title="Print / share stock list"
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 160 }}>S.No</th>
                <th>Product</th>
                <th className="center" style={{ width: '45%' }}>
                  Remaining Quantity
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, i) => (
                <tr key={group.productId}>
                  <td>{i + 1}</td>
                  <td>{group.name}</td>
                  <td className="qty-cell">
                    {group.lines
                      .map((row) => formatQtyWithUnit(row.remaining_stock, unitName[row.unit_id]))
                      .join(' / ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableState
          loading={loading}
          error={error}
          empty={!loading && !error && stock.length === 0}
          emptyText="No stock available."
          onRetry={reload}
        />
      </div>

      {printOpen && (
        <PdfActionsModal title="Print stock list" build={buildPdf} onClose={() => setPrintOpen(false)} />
      )}
    </>
  )
}
