import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  login as apiLogin,
  logout as apiLogout,
  setToken,
  clearToken,
  getToken,
  setSessionId,
  clearSessionId,
  getSessionId,
  type LoginPayload,
} from '../services/authService'

const USER_ID_KEY = 'user_id'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref<boolean>(
    sessionStorage.getItem('auth') === 'true' &&
      getToken() !== null &&
      getSessionId() !== null &&
      sessionStorage.getItem(USER_ID_KEY) !== null,
  )
  const errorMessage = ref<string>('')
  const userId = ref<number | null>(
    sessionStorage.getItem(USER_ID_KEY) !== null
      ? Number(sessionStorage.getItem(USER_ID_KEY))
      : null,
  )

  function setAuthenticated(value: boolean) {
    isAuthenticated.value = value
    if (value) {
      sessionStorage.setItem('auth', 'true')
    } else {
      sessionStorage.removeItem('auth')
      sessionStorage.removeItem(USER_ID_KEY)
      userId.value = null
      clearToken()
      clearSessionId()
    }
  }

  async function login(payload: LoginPayload): Promise<boolean> {
    errorMessage.value = ''
    try {
      const response = await apiLogin(payload)
      userId.value = response.data.userId
      sessionStorage.setItem(USER_ID_KEY, String(response.data.userId))
      setToken(response.data.jwtToken)
      setSessionId(response.data.appSessionId)
      setAuthenticated(true)
      return true
    } catch (err: unknown) {
      setAuthenticated(false)
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response
      ) {
        const data = (err.response as { data?: { message?: string } }).data
        errorMessage.value = data?.message ?? 'Login failed. Please try again.'
      } else {
        errorMessage.value = 'Unable to reach the server. Please try again.'
      }
      return false
    }
  }

  async function logout(): Promise<void> {
    try {
      if (userId.value !== null) {
        await apiLogout(userId.value)
      }
    } finally {
      setAuthenticated(false)
    }
  }

  return { isAuthenticated, userId, errorMessage, login, logout }
})
