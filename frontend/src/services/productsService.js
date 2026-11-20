// import api from './api'

// // ProductResponse: id, product_name, unit_id, is_active, created_at, updated_at
// export const getProducts = async () => (await api.get('/products/')).data

// // ProductCreate: product_name, unit_id, opening_stock? (creates an OPENING stock movement)
// export const createProduct = async (payload) => (await api.post('/products/', payload)).data

// // ProductUpdate (partial): product_name, unit_id, is_active
// export const updateProduct = async (id, payload) => (await api.patch(`/products/${id}`, payload)).data

// // DELETE /products/{id} -> 204. Backend returns 409 when stock history exists.
// export const deleteProduct = async (id) => {
//   await api.delete(`/products/${id}`)
// }





import api from './api'

export const getProducts = async () =>
  (await api.get('/products/')).data

export const createProduct = async (payload) =>
  (await api.post('/products/', payload)).data

export const updateProduct = async (id, payload) =>
  (await api.patch(`/products/${id}`, payload)).data

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`)
}
