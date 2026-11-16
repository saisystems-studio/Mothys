import api from './api'

// RoleResponse: id, role_name, created_at
export const getRoles = async () => (await api.get('/roles/')).data
