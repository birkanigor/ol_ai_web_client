import { ref } from 'vue'

export type ToastType = 'error' | 'success' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])
let _id = 0

function show(message: string, type: ToastType, duration = 4500) {
  const id = ++_id
  toasts.value.push({ id, message, type })
  setTimeout(() => remove(id), duration)
}

function remove(id: number) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

export function useToast() {
  return {
    toasts,
    error:   (msg: string) => show(msg, 'error'),
    success: (msg: string) => show(msg, 'success'),
    info:    (msg: string) => show(msg, 'info'),
    remove,
  }
}
