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

export interface UserGroup {
  id: number
  group_name: string | null
  group_status: number | null
  profile_id: number | null
  profile_name: string | null
  created_at: string | null
  last_updated: string | null
}

export interface Profile {
  id: number
  profile_name: string | null
}

interface ApiResponse<T> {
  status: string
  data: T
  message: string
}

export async function getGroups(): Promise<UserGroup[]> {
  const { data } = await http.post<ApiResponse<UserGroup[]>>('/api/userGroups/getGroups')
  return data.data
}

export async function getProfiles(): Promise<Profile[]> {
  const { data } = await http.post<ApiResponse<Profile[]>>('/api/userGroups/getProfiles')
  return data.data
}

export async function addGroup(payload: {
  group_name: string
  group_status: number
  profile_id?: number | null
}): Promise<{ id: number }> {
  const { data } = await http.post<ApiResponse<{ id: number }>>('/api/userGroups/addGroup', payload)
  return data.data
}

export async function updateGroup(payload: {
  id: number
  group_name: string
  group_status: number
  profile_id?: number | null
}): Promise<{ id: number }> {
  const { data } = await http.post<ApiResponse<{ id: number }>>('/api/userGroups/updateGroup', payload)
  return data.data
}
