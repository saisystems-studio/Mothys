import api from './api'

// GET /reports/voucher-details?start_date&end_date&product_id ->
// [{ voucher_id, voucher_number, voucher_date, product_id, product_name, unit_name, quantity }]
export const getVoucherDetails = async ({ startDate, endDate, productId } = {}) => {
  const params = {}
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  if (productId) params.product_id = productId
  return (await api.get('/reports/voucher-details', { params })).data
}
