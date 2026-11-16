import { NavLink } from 'react-router-dom'
import { LayoutGrid, Box, Layers, ShoppingCart, Database, BarChart3, SlidersHorizontal, LogOut } from 'lucide-react'
import Logo from './Logo'
import useAuth from '../hooks/useAuth'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/products', label: 'Products', icon: Box },
  { to: '/units', label: 'Units', icon: Layers },
  { to: '/entry-billing', label: 'Entry & Billing', icon: ShoppingCart },
  { to: '/stock', label: 'Stock', icon: Database },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal, adminOnly: true },
]

export default function Sidebar({ open, onNavigate }) {
  const { isAdmin, logout } = useAuth()

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <Logo />
      </div>
      <nav className="sidebar-nav">
        {NAV.filter((item) => !item.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button type="button" className="nav-item nav-logout" onClick={logout}>
        <LogOut size={19} />
        <span>Logout</span>
      </button>
    </aside>
  )
}
