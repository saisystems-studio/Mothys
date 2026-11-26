
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute({
  adminOnly = false,
  requiredPermission = null
}) {
  const {
    isAuthenticated,
    isAdmin,
    user,
    loading
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return (
      <div className="page-loading">
        <span
          className="spinner"
          style={{ width: 32, height: 32 }}
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  // Settings and other Admin-only routes
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // Individual page permissions
  if (
    requiredPermission &&
    !isAdmin &&
    user?.permissions?.[requiredPermission] !== true
  ) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
