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
  if (token)     config.headers['Authorization']  = `Bearer ${token}`
  if (sessionId) config.headers['x-session-id']   = sessionId
  return config
})

export interface ScheduledReport {
  id: number
  report_name: string | null
  report_query: string | null
  data_source_id: number | null
  source_name: string | null
  result_format: string | null
  report_scheduler: string | null
  delivery_list: string | null
  report_status_id: number | null
  status_name: string | null
  last_run_time: string | null
  runtime_error: string | null
}

interface GetScheduledReportsResponse {
  status: string
  data: ScheduledReport[]
  message: string
}

export async function getScheduledReports(): Promise<ScheduledReport[]> {
  const { data } = await http.post<GetScheduledReportsResponse>('/api/reports/getScheduledReports')
  return data.data
}

interface GetReportResponse {
  status: string
  data: ScheduledReport
  message: string
}

export async function getReportById(reportId: number): Promise<ScheduledReport | null> {
  const { data } = await http.post<GetReportResponse>('/api/reports/getReport', { reportId })
  return data.data ?? null
}

// ── Data Sources ──────────────────────────────────────────────────────────

export interface DataSource {
  id: number
  source_name: string | null
  connection_data: Record<string, unknown> | null
}

interface GetDataSourcesResponse {
  status: string
  data: DataSource[]
  message: string
}

export async function getDataSources(): Promise<DataSource[]> {
  const { data } = await http.post<GetDataSourcesResponse>('/api/reports/getDataSources')
  return data.data
}

// ── Add Report ────────────────────────────────────────────────────────────

export interface AddReportPayload {
  report_name: string
  report_query: string
  data_source_id?: number | null
  result_format: 'CSV' | 'XLSX'
  report_scheduler: string
  delivery_list: string
  report_status_id?: 1 | 4
}

interface AddReportResponse {
  status: string
  data: { id: number }
  message: string
}

export async function addReport(payload: AddReportPayload): Promise<number> {
  const { data } = await http.post<AddReportResponse>('/api/reports/addReport', payload)
  return data.data.id
}

export interface UpdateReportPayload extends AddReportPayload {
  report_id: number
}

export async function updateReport(payload: UpdateReportPayload): Promise<void> {
  await http.post('/api/reports/updateReport', payload)
}

export async function runReport(reportId: number): Promise<void> {
  await http.post('/api/reports/runReport', { reportId })
}

export async function deleteReport(reportId: number): Promise<void> {
  await http.post('/api/reports/deleteReport', { id: reportId })
}
