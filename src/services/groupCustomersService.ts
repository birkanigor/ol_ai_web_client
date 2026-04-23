import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { getToken, getSessionId } from './authService'

const http = axios.create({ baseURL: API_BASE_URL, withCredentials: true })

http.interceptors.request.use((config) => {
  const token     = getToken()
  const sessionId = getSessionId()
  if (token)     config.headers['Authorization'] = `Bearer ${token}`
  if (sessionId) config.headers['x-session-id']  = sessionId
  return config
})

interface ApiResponse<T> { status: string; data: T; message: string }

export interface GroupCustomer {
  id: number
  user_group_id: number
  customer_id: number
  customer_name: string
}

export interface CustomerGroup {
  id: number
  user_group_id: number
  customer_id: number
  group_name: string
}

export async function getGroupCustomers(user_group_id: number): Promise<GroupCustomer[]> {
  const { data } = await http.post<ApiResponse<GroupCustomer[]>>('/api/groupCustomers/getGroupCustomers', { user_group_id })
  return data.data
}

export async function getCustomerGroups(customer_id: number): Promise<CustomerGroup[]> {
  const { data } = await http.post<ApiResponse<CustomerGroup[]>>('/api/groupCustomers/getCustomerGroups', { customer_id })
  return data.data
}

export async function addGroupCustomer(user_group_id: number, customer_id: number): Promise<{ id: number }> {
  const { data } = await http.post<ApiResponse<{ id: number }>>('/api/groupCustomers/addGroupCustomer', { user_group_id, customer_id })
  return data.data
}

export async function removeGroupCustomer(id: number): Promise<void> {
  await http.post('/api/groupCustomers/removeGroupCustomer', { id })
}
