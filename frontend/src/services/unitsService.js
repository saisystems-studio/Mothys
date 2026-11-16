import api from './api'

// UnitResponse: id, unit_name, is_active, created_at, updated_at
export const getUnits = async () => (await api.get('/units/')).data
export const createUnit = async (unitName) => (await api.post('/units/', { unit_name: unitName })).data

// UnitUpdate (partial): unit_name, is_active
export const updateUnit = async (id, payload) => (await api.patch(`/units/${id}`, payload)).data
export const deleteUnit = async (id) => {
  await api.delete(`/units/${id}`)
}