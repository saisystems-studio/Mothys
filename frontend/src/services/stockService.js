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

// POST /stock/entry { product_id, unit_id, movement_type: "IN", quantity } -> StockMovementResponse
export const createStockEntry = async (productId, quantity, unitId) =>
  (
    await api.post('/stock/entry', {
      product_id: productId,
      unit_id: unitId,
      movement_type: 'IN',
      quantity,
    })
  ).data

// POST /stock/adjustment { product_id, unit_id, quantity } -> StockMovementResponse
// quantity is signed: negative reduces stock, positive increases it.
export const createStockAdjustment = async (productId, quantity, unitId) =>
  (
    await api.post('/stock/adjustment', {
      product_id: productId,
      unit_id: unitId,
      quantity,
    })
  ).data
