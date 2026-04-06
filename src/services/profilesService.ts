import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { getToken, getSessionId } from './authService'

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

http.interceptors.request.use((config) => {
  const token     = getToken()
  const sessionId = getSessionId()
  if (token)     config.headers['Authorization'] = `Bearer ${token}`
  if (sessionId) config.headers['x-session-id']  = sessionId
  return config
})

/** Ordered list of screens — must match the backend AVAILABLE_SCREENS constant. */
export const AVAILABLE_SCREENS = ['tasks', 'reports', 'admin'] as const
export type ScreenName = (typeof AVAILABLE_SCREENS)[number]

export const SCREEN_LABELS: Record<ScreenName, string> = {
  tasks:   'Tasks',
  reports: 'Reports',
  admin:   'Admin',
}

export type ProfileConfig = Partial<Record<ScreenName, boolean>>

export interface Profile {
  id: number
  profile_name: string | null
  profile_config: ProfileConfig | null
}

interface ApiResponse<T> {
  status: string
  data: T
  message: string
}

export async function getProfiles(): Promise<Profile[]> {
  const { data } = await http.post<ApiResponse<Profile[]>>('/api/profiles/getProfiles')
  return data.data
}

export async function addProfile(payload: {
  profile_name: string
  profile_config: ProfileConfig | null
}): Promise<{ id: number }> {
  const { data } = await http.post<ApiResponse<{ id: number }>>('/api/profiles/addProfile', payload)
  return data.data
}

export async function updateProfile(payload: {
  id: number
  profile_name: string
  profile_config: ProfileConfig | null
}): Promise<{ id: number }> {
  const { data } = await http.post<ApiResponse<{ id: number }>>('/api/profiles/updateProfile', payload)
  return data.data
}
