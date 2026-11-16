import api from './api'

// GET /stock/ -> [{ product_id, product_name, unit_id, remaining_stock }]
export const getStock = async () => (await api.get('/stock/')).data

// POST /stock/entry { product_id, movement_type: "IN", quantity } -> StockMovementResponse
export const createStockEntry = async (productId, quantity) =>
  (await api.post('/stock/entry', { product_id: productId, movement_type: 'IN', quantity })).data
