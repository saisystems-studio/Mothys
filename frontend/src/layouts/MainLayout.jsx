import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, User } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Logo from '../components/Logo'
import useAuth from '../hooks/useAuth'

export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { roleName, user } = useAuth()
  // The PDF shows the top user bar only on the Settings screen.
  const showTopbar = pathname.startsWith('/settings')

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} />}
      <div className="app-main">
        <div className="mobile-bar">
          <button type="button" className="eye-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <Logo />
        </div>
        {showTopbar && (
          <header className="topbar">
            <User size={18} />
            <strong>{roleName || user?.name}</strong>
          </header>
        )}
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
