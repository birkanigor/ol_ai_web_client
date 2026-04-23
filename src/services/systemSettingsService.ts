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

export interface SystemConfig {
  id: number
  config_name: string | null
  config_text: string | null
  config_description: string | null
  config_value: string | null
}

export async function getSettings(): Promise<SystemConfig[]> {
  const { data } = await http.post<ApiResponse<SystemConfig[]>>('/api/system/getSettings')
  return data.data
}

export async function updateSetting(id: number, config_value: string): Promise<{ id: number }> {
  const { data } = await http.post<ApiResponse<{ id: number }>>('/api/system/updateSetting', { id, config_value })
  return data.data
}
