import { Box } from 'lucide-react'

/** Split-screen layout used by Login and Registration (PDF pages 1 and 3). */
export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <section className="auth-brand">
        <Box size={60} strokeWidth={2.2} />
        <h1>Mothys</h1>
        <p className="auth-brand-sub">Inventory Management</p>
        <p className="auth-brand-text">Track products, units, entries, billing and stock in one place.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  )
}
