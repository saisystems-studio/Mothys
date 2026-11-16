import { useMemo } from 'react'
import TableState from '../components/TableState'
import useAsyncData from '../hooks/useAsyncData'
import { getStock } from '../services/stockService'
import { getUnits } from '../services/unitsService'
import { formatQtyWithUnit } from '../utils/format'

const load = () => Promise.all([getStock(), getUnits()])

export default function Stock() {
  const { data, loading, error, reload } = useAsyncData(load)
  const [allStock, units] = data ?? [[], []]
  // Products whose stock has run out are not listed.
  const stock = allStock.filter((row) => Number(row.remaining_stock) > 0)
  const unitName = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u.unit_name])), [units])

  return (
    <>
      <div className="page-head">
        <h1>Stock</h1>
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
              {stock.map((row, i) => (
                <tr key={row.product_id}>
                  <td>{i + 1}</td>
                  <td>{row.product_name}</td>
                  <td className="qty-cell">
                    {formatQtyWithUnit(row.remaining_stock, unitName[row.unit_id])}
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
    </>
  )
}
