import axios from 'axios'

export const TOKEN_KEY = 'mothys_token'
export const UNAUTHORIZED_EVENT = 'mothys:unauthorized'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginCall && getToken()) {
      clearToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

/** Turns any Axios/FastAPI error into a readable message. */
export function getErrorMessage(error) {
  if (error?.userMessage) return error.userMessage
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
    if (error?.request) return 'Cannot reach the server. Check your connection and that the backend is running.'
    return error?.message || 'Something went wrong.'
  }
  const { status, data } = error.response
  const detail = data?.detail
  if (status === 422 && Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc.filter((p) => p !== 'body').join('.') : ''
        return field ? `${field}: ${d.msg}` : d.msg
      })
      .join('; ')
  }
  if (typeof detail === 'string') return detail
  if (status === 401) return 'Your session has expired. Please log in again.'
  if (status === 403) return 'You do not have permission to do that.'
  if (status === 404) return 'The requested item was not found.'
  if (status >= 500) return 'The server ran into a problem. Please try again.'
  return 'Request failed.'
}

export default api
