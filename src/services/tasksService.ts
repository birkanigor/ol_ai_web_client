import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { getToken, getSessionId } from './authService'

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`

  const sessionId = getSessionId()
  if (sessionId) config.headers['x-session-id'] = sessionId

  return config
})

export interface TaskRecord {
  id: number
  request_time: string
  user_name: string
  status_name: string
  completion_time: string | null
  last_action_time: string | null
  application_name: string
  request_name: string
  request_body: Record<string, unknown> | null
  error: string | null
}

export interface GetTasksResponse {
  status: string
  data: TaskRecord[]
  message: string
}

export async function getTasks(): Promise<TaskRecord[]> {
  const { data } = await http.post<GetTasksResponse>('/api/tasks/getTasks')
  return data.data
}

export interface TaskTemplateProperty {
  type: 'string' | 'number' | 'boolean' | string
}

export interface TaskTemplateSchema {
  type: string
  required?: string[]
  properties: Record<string, TaskTemplateProperty>
  additionalProperties?: boolean
}

export interface TaskTemplate {
  id: number
  request_name: string
  request_schema: TaskTemplateSchema
  request_url: string | null
  authentication_method: string | null
}

export interface GetTaskTemplatesResponse {
  status: string
  data: TaskTemplate[]
  message: string
}

export async function getTaskTemplates(): Promise<TaskTemplate[]> {
  const { data } = await http.post<GetTaskTemplatesResponse>('/api/tasks/getTaskTemplates')
  return data.data
}

export interface CreateTaskPayload {
  application_name: string
  request_name: string
  request_body: Record<string, unknown> | null
}

export async function createTask(payload: CreateTaskPayload): Promise<void> {
  await http.post('/api/tasks/createTask', payload)
}

export interface AddNewTaskPayload {
  userId: number
  requestApplicationId: number
  requestTemplateId: number
  requestBody: Record<string, unknown> | null
}

export async function addNewTask(payload: AddNewTaskPayload): Promise<void> {
  await http.post('/api/tasks/addNewTask', payload)
}
