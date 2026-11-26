
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import * as authService from '../services/authService'
import { getRoles } from '../services/rolesService'
import { getToken, clearToken, UNAUTHORIZED_EVENT } from '../services/api'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  const fetchSession = useCallback(
    () => Promise.all([authService.getCurrentUser(), getRoles()]),
    [],
  )

  useEffect(() => {
    if (!getToken()) return undefined

    let cancelled = false

    fetchSession()
      .then(([me, roleList]) => {
        if (cancelled) return
        setUser(me)
        setRoles(roleList)
      })
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [fetchSession])

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null)
    }

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    }
  }, [])

  const login = useCallback(
    async (username, password) => {
      await authService.login(username, password)

      try {
        const [me, roleList] = await fetchSession()
        setUser(me)
        setRoles(roleList)
      } catch (error) {
        clearToken()
        throw error
      }
    },
    [fetchSession],
  )

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setRoles([])
  }, [])

  const value = useMemo(() => {
    const roleName = roles.find(
      (r) => r.id === user?.role_id
    )?.role_name ?? ''

    return {
      user,
      roles,
      roleName,
      isAdmin: user?.is_admin === true,
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
    }
  }, [user, roles, loading, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
