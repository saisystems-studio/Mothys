import api from './api'

// GET /dashboard/summary ->
// { total_products, total_units, total_entries, total_billings, total_stock_quantity }
export const getDashboardSummary = async () => (await api.get('/dashboard/summary')).data
