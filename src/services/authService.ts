import axios from 'axios'
import { API_BASE_URL } from '../config/api'

const TOKEN_KEY = 'jwt_token'
const SESSION_KEY = 'app_session_id'

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function getSessionId(): string | null {
  return sessionStorage.getItem(SESSION_KEY)
}

export function setSessionId(sessionId: string): void {
  sessionStorage.setItem(SESSION_KEY, sessionId)
}

export function clearSessionId(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Attach Bearer token and session ID to every request if present
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const sessionId = getSessionId()
  if (sessionId) {
    config.headers['x-session-id'] = sessionId
  }

  return config
})

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginData {
  userId: number
  appSessionId: string
  jwtToken: string
}

export interface LoginResponse {
  status: string
  data: LoginData
  message: string
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/api/auth/login', payload)
  return data
}

export async function logout(userId: number): Promise<void> {
  await http.post('/api/auth/logout', { userId })
}

export interface RenewJwtResponse {
  status: string
  data: { jwtToken: string }
  message: string
}

export async function renewJwt(): Promise<string> {
  const { data } = await http.post<RenewJwtResponse>('/api/auth/renewJwt')
  return data.data.jwtToken
}

export interface UserRecord {
  id: number
  user_name: string
  first_name: string
  last_name: string
  user_phone_number: string
  user_email: string
  user_type: string
  status: string
  last_update: string
  user_group_id: number | null
  group_name: string | null
}

export interface GetUsersResponse {
  status: string
  data: UserRecord[]
  message: string
}

export async function getUsers(): Promise<UserRecord[]> {
  const { data } = await http.post<GetUsersResponse>('/api/auth/getUsers')
  return data.data
}

export interface AddUserPayload {
  user_name: string
  first_name: string
  last_name: string
  user_phone_number: string
  user_email: string
  user_type: 1 | 2 | 3
  password: string
  user_group_id?: number | null
}

interface AddUserResponse {
  status: string
  data: { userId: number }
  message: string
}

export async function addUser(payload: AddUserPayload): Promise<number> {
  const { data } = await http.post<AddUserResponse>('/api/auth/addNewUser', payload)
  return data.data.userId
}

export interface UpdateUserPayload {
  userId: number
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  userGroupId?: number | null
}

interface UpdateUserResponse {
  status: string
  data: { userId: number }
  message: string
}

export async function updateUser(payload: UpdateUserPayload): Promise<void> {
  await http.post<UpdateUserResponse>('/api/auth/updateUser', payload)
}
