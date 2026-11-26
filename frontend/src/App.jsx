
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import useAuth from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Units from './pages/Units'
import Entry from './pages/Entry'
import Billing from './pages/Billing'
import Stock from './pages/Stock'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<PublicOnly><Login /></PublicOnly>}
      />

      <Route
        path="/register"
        element={<PublicOnly><Register /></PublicOnly>}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>

          <Route element={<ProtectedRoute requiredPermission="dashboard" />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="products" />}>
            <Route path="/products" element={<Products />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="units" />}>
            <Route path="/units" element={<Units />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="products_in" />}>
            <Route path="/entry" element={<Entry />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="billing" />}>
            <Route path="/billing" element={<Billing />} />
            <Route
              path="/entry-billing"
              element={<Navigate to="/billing" replace />}
            />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="stock" />}>
            <Route path="/stock" element={<Stock />} />
          </Route>

          <Route element={<ProtectedRoute requiredPermission="reports" />}>
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/settings" element={<Settings />} />
          </Route>

        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  )
}
