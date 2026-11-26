
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Box,
  Layers,
  PackagePlus,
  ShoppingCart,
  Database,
  BarChart3,
  SlidersHorizontal,
  LogOut
} from 'lucide-react'

import Logo from './Logo'
import useAuth from '../hooks/useAuth'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid, permission: 'dashboard' },
  { to: '/products', label: 'Products', icon: Box, permission: 'products' },
  { to: '/units', label: 'Units', icon: Layers, permission: 'units' },
  { to: '/entry', label: 'Products IN', icon: PackagePlus, permission: 'products_in' },
  { to: '/billing', label: 'Billing', icon: ShoppingCart, permission: 'billing' },
  { to: '/stock', label: 'Stock', icon: Database, permission: 'stock' },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports' },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal, adminOnly: true },
]

export default function Sidebar({ open, onNavigate }) {
  const { isAdmin, user, logout } = useAuth()

  const visibleNav = NAV.filter((item) => {
    if (item.adminOnly) return isAdmin
    if (isAdmin) return true

    return user?.permissions?.[item.permission] === true
  })

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <Logo />
      </div>

      <nav className="sidebar-nav">
        {visibleNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="nav-item nav-logout"
        onClick={logout}
      >
        <LogOut size={19} />
        <span>Logout</span>
      </button>
    </aside>
  )
}
