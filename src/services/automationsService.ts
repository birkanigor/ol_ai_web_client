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

export interface AutomationRule {
  id: number
  rule_name: string | null
  template_id: number | null
  user_id: number | null
  status_id: number | null
  status_name: string | null
  completion_intervals: number
  rule_scheduler: string | null
  created_at: string | null
  last_modified: string | null
  template_name: string | null
  template_description: string | null
  time_resolution: number | null
  rule_formula: string | null
  category_name: string | null
  entity_name: string | null
  severity_level_name: string | null
  user_name: string | null
}

export interface ConditionValue {
  operator: string
  value: number | null
}

export interface AddRulePayload {
  rule_name: string
  template_id: number
  status_id?: number
  completion_intervals: number
  rule_scheduler: string
  condition_values?: Record<string, ConditionValue>
  actions?: Record<string, unknown>
  include_last_appearance?: boolean
  min_appearances?: number
  appearances_window?: number
}

export interface TemplateCondition {
  id: number
  template_id: number | null
  left_table_name: string | null
  left_counter_name: string | null
  right_table_name: string | null
  right_counter_name: string | null
  condition_type: number | null
  condition_type_name: string | null
  unit_type: number | null
  unit_type_name: string | null
  unit_text: string | null
  condition_text: string | null
  condition_id: number | null
  reference_counter_name: string | null
  reference_table_name: string | null
}

export interface RuleStatus {
  id: number
  status_name: string | null
}

export interface SeverityLevel {
  id: number
  severity_level_name: string | null
}

export interface TemplateCategory {
  id: number
  category_name: string
}

export interface AutomationTemplate {
  id: number
  template_name: string | null
  template_description: string | null
  time_resolution: number | null
  entity_type_id: number | null
  entity_name: string | null
  category_id: number | null
  category_name: string | null
  severity_id: number | null
  severity_level_name: string | null
  rule_formula: string | null
  example: string | null
  alarm_additional_info: string | null
  additional_info: string | null
}

export async function getRules(): Promise<AutomationRule[]> {
  const { data } = await http.post<ApiResponse<AutomationRule[]>>('/api/automation/getRules')
  return data.data
}

export async function getRule(id: number): Promise<AutomationRule> {
  const { data } = await http.post<ApiResponse<AutomationRule>>('/api/automation/getRule', { id })
  return data.data
}

export async function getRuleStatuses(): Promise<RuleStatus[]> {
  const { data } = await http.post<ApiResponse<RuleStatus[]>>('/api/automation/getStatuses')
  return data.data
}

export async function getSeverityLevels(): Promise<SeverityLevel[]> {
  const { data } = await http.post<ApiResponse<SeverityLevel[]>>('/api/automation/getSeverityLevels')
  return data.data
}

export async function getTemplateCategories(): Promise<TemplateCategory[]> {
  const { data } = await http.post<ApiResponse<TemplateCategory[]>>('/api/automation/getTemplateCategories')
  return data.data
}

export async function getTemplates(): Promise<AutomationTemplate[]> {
  const { data } = await http.post<ApiResponse<AutomationTemplate[]>>('/api/automation/getTemplates')
  return data.data
}

export async function getTemplateConditions(templateId: number): Promise<TemplateCondition[]> {
  const { data } = await http.post<ApiResponse<TemplateCondition[]>>('/api/automation/getTemplateConditions', { templateId })
  return data.data
}

export async function addRule(payload: AddRulePayload): Promise<{ id: number }> {
  const { data } = await http.post<ApiResponse<{ id: number }>>('/api/automation/addRule', payload)
  return data.data
}
