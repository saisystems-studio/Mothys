import api, { setToken, clearToken } from './api'

// POST /auth/login  { username, password } -> { access_token, token_type }
export async function login(username, password) {
  const { data } = await api.post('/auth/login', { username, password })
  setToken(data.access_token)
  return data
}

// GET /auth/me -> { id, username, name, role_id, auth_provider }
export async function getCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data
}

export function logout() {
  clearToken()
}
