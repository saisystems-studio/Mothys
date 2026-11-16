import api from './api'

// UserResponse: id, username, name, email, contact_number, role_id, auth_provider,
// is_active, must_change_password, last_login, created_at, updated_at
export const getUsers = async () => (await api.get('/users/')).data

// UserCreate: username, name, email?, contact_number?, role_id, password
export const createUser = async (payload) => (await api.post('/users/', payload)).data

// UserUpdate (partial): username, name, email, contact_number, role_id
export const updateUser = async (id, payload) => (await api.patch(`/users/${id}`, payload)).data

// UserStatusUpdate: { is_active }
export const setUserStatus = async (id, isActive) =>
  (await api.patch(`/users/${id}/status`, { is_active: isActive })).data

// UserPasswordUpdate: { new_password }
export const resetUserPassword = async (id, newPassword) =>
  (await api.patch(`/users/${id}/password`, { new_password: newPassword })).data
