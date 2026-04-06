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

export interface Customer {
  id: number
  customer_name: string
  customer_description: string | null
  reference_id: string | null
  billing_address: string | null
  created_date: string | null
  customer_status_id: number | null
  status_name: string | null
  additional_config: Record<string, unknown> | null
}

interface ApiResponse<T> { status: string; data: T; message: string }

export async function getCustomers(): Promise<Customer[]> {
  const { data } = await http.post<ApiResponse<Customer[]>>('/api/customers/getCustomers')
  return data.data
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const { data } = await http.post<ApiResponse<Customer>>('/api/customers/getCustomer', { id })
  return data.data ?? null
}

export interface AddCustomerPayload {
  customer_name: string
  customer_description?: string | null
  reference_id?: string | null
  billing_address?: string | null
  customer_status_id?: 1 | 2 | 3 | 4
  additional_config?: Record<string, unknown> | null
}

export async function addCustomer(payload: AddCustomerPayload): Promise<number> {
  const { data } = await http.post<ApiResponse<{ id: number }>>('/api/customers/addCustomer', payload)
  return data.data.id
}

export interface UpdateCustomerPayload extends AddCustomerPayload {
  id: number
}

export async function updateCustomer(payload: UpdateCustomerPayload): Promise<void> {
  await http.post('/api/customers/updateCustomer', payload)
}

export async function changeCustomerStatus(id: number, customer_status_id: 1 | 2 | 3 | 4): Promise<void> {
  await http.post('/api/customers/changeCustomerStatus', { id, customer_status_id })
}
