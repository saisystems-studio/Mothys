
import api from './api'

export const getSubscription = async () => {
  const response = await api.get('/auth/subscription')
  return response.data
}
