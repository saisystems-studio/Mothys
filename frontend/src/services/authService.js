// import api, { setToken, clearToken } from './api'

// // POST /auth/login  { username, password } -> { access_token, token_type }
// export async function login(username, password) {
//   const { data } = await api.post('/auth/login', { username, password })
//   setToken(data.access_token)
//   return data
// }

// // GET /auth/me -> { id, username, name, role_id, auth_provider }
// export async function getCurrentUser() {
//   const { data } = await api.get('/auth/me')
//   return data
// }

// export function logout() {
//   clearToken()
// }
// // POST /auth/register { name, email, contact_number } -> { message }
// export async function register({ name, email, contact_number }) {
//   const { data } = await api.post('/auth/register', { name, email, contact_number })
//   return data
// }



import api, { setToken, clearToken } from './api'

const DEVICE_ID_KEY = 'mothys_device_id'

// Generate a persistent ID for this browser installation.
export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)

  if (!deviceId) {
    if (typeof crypto.randomUUID === 'function') {
      deviceId = crypto.randomUUID()
    } else {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      deviceId = Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    }

    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  return deviceId
}

// POST /auth/login
// Request: { username, password, device_id }
export async function login(username, password) {
  const device_id = getDeviceId()

  const { data } = await api.post('/auth/login', {
    username,
    password,
    device_id,
  })

  setToken(data.access_token)
  return data
}

// GET /auth/me
export async function getCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data
}

// POST /auth/register
export async function register({ name, email, contact_number }) {
  const { data } = await api.post('/auth/register', {
    name,
    email,
    contact_number,
  })

  return data
}

// Logout
export function logout() {
  clearToken()
}
