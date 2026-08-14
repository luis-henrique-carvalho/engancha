import axios from 'axios'
import type { User, CreateUserForm, UpdateUserForm } from '../schemas'
import type { ListUsersRequest, ListUsersResponse } from '../contracts'

export const UsersApi = {
  async list(params: ListUsersRequest): Promise<ListUsersResponse> {
    const response = await axios.get<ListUsersResponse>('/api/v1/users', {
      params,
    })
    return response.data
  },

  async create(data: CreateUserForm): Promise<User> {
    const response = await axios.post<User>('/api/v1/users', data)
    return response.data
  },

  async update(id: string, data: UpdateUserForm): Promise<User> {
    const response = await axios.put<User>(`/api/v1/users/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<User> {
    const response = await axios.delete<User>(`/api/v1/users/${id}`)
    return response.data
  },
}
