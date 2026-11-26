import { useNavigate } from 'react-router-dom'
import { Calendar, Box, Layers, FileText, ShoppingCart, BarChart3 } from 'lucide-react'
import useAsyncData from '../hooks/useAsyncData'
import TableState from '../components/TableState'
import { getDashboardSummary } from '../services/dashboardService'
import { getProducts } from '../services/productsService'
import { getUnits } from '../services/unitsService'
import { formatDate } from '../utils/format'

const CARDS = [
  { key: 'total_products', label: 'Total Products', icon: Box },
  { key: 'total_units', label: 'Total Units', icon: Layers },
  { key: 'today_entries', label: "Today's Entries", icon: FileText },
  { key: 'today_billings', label: "Today's Billings", icon: ShoppingCart },
]

const ACTIONS = [
  { label: 'Add Product', icon: Box, to: '/products?add=1' },
  { label: 'Product IN', icon: Layers, to: '/entry' },
  { label: 'Billing', icon: ShoppingCart, to: '/billing' },
  { label: 'View Reports', icon: BarChart3, to: '/reports' },
]

// Products and units are counted from the real lists so that deactivated
// (hidden) ones are not included. Entries and billings come from the summary.
const loadDashboard = async () => {
  const [summary, products, units] = await Promise.all([getDashboardSummary(), getProducts(), getUnits()])
  return {
    ...summary,
    total_products: products.filter((p) => p.is_active).length,
    total_units: units.filter((u) => u.is_active).length,
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsyncData(loadDashboard)

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <span className="chip">
          <Calendar size={18} />
          {formatDate(new Date())}
        </span>
      </div>

      {(loading || error) && (
        <div className="card" style={{ marginBottom: 20 }}>
          <TableState loading={loading} error={error} onRetry={reload} />
        </div>
      )}

      {data && (
        <div className="stat-grid">
          {CARDS.map(({ key, label, icon: Icon }) => (
            <div className="stat-card" key={key}>
              <div className="stat-icon">
                <Icon size={22} />
              </div>
              <div>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{data[key]}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Quick Actions</h2>
        <div className="quick-grid">
          {ACTIONS.map(({ label, icon: Icon, to }) => (
            <button type="button" key={label} className="quick-tile" onClick={() => navigate(to)}>
              <Icon size={24} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
