// // import api from './api'

// // // GET /stock/ -> [{ product_id, product_name, unit_id, remaining_stock }]
// // export const getStock = async () => (await api.get('/stock/')).data

// // // POST /stock/entry { product_id, movement_type: "IN", quantity } -> StockMovementResponse
// // export const createStockEntry = async (productId, quantity) =>
// //   (await api.post('/stock/entry', { product_id: productId, movement_type: 'IN', quantity })).data

// import api from './api'

// // GET /stock/ -> [{ product_id, product_name, unit_id, remaining_stock }]
// // One row per product AND unit (e.g. Rice/Nos and Rice/M are separate rows).
// export const getStock = async () => (await api.get('/stock/')).data

// // POST /stock/entry { product_id, unit_id, movement_type: "IN", quantity } -> StockMovementResponse
// export const createStockEntry = async (productId, quantity, unitId) =>
//   (
//     await api.post('/stock/entry', {
//       product_id: productId,
//       unit_id: unitId,
//       movement_type: 'IN',
//       quantity,
//     })
//   ).data




import api from './api'

// GET /stock/ -> [{ product_id, product_name, unit_id, remaining_stock }]
// One row per product AND unit (e.g. Rice/Nos and Rice/M are separate rows).
export const getStock = async () => (await api.get('/stock/')).data

// POST /stock/entry { product_id, unit_id, movement_type: "IN", quantity, entry_at } -> StockMovementResponse
// entry_at is an ISO date-time (UTC). The backend must accept and save it.
export const createStockEntry = async (productId, quantity, unitId, entryAt) =>
  (
    await api.post('/stock/entry', {
      product_id: productId,
      unit_id: unitId,
      movement_type: 'IN',
      quantity,
      entry_at: entryAt,
    })
  ).data

// POST /stock/adjustment { product_id, unit_id, quantity, entry_at } -> StockMovementResponse
// quantity is signed: negative reduces stock, positive increases it.
export const createStockAdjustment = async (productId, quantity, unitId, entryAt) =>
  (
    await api.post('/stock/adjustment', {
      product_id: productId,
      unit_id: unitId,
      quantity,
      entry_at: entryAt,
    })
  ).data
