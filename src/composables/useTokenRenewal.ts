import { onMounted, onBeforeUnmount } from 'vue'
import { renewJwt, setToken } from '../services/authService'
import { useToast } from './useToast'

const INTERVAL_MS = Number(import.meta.env.VITE_JWT_RENEW_INTERVAL_MS) || 60_000

export function useTokenRenewal() {
  const toast = useToast()
  let timer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    try {
      const newToken = await renewJwt()
      setToken(newToken)
    } catch {
      toast.error('Session renewal failed. Please log in again.')
    }
  }

  function start() {
    if (timer !== null) return
    timer = setInterval(refresh, INTERVAL_MS)
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(start)
  onBeforeUnmount(stop)

  return { start, stop }
}
