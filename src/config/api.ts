const protocol = import.meta.env.VITE_API_PROTOCOL ?? 'http'
const host = import.meta.env.VITE_API_HOST ?? 'localhost'
const port = import.meta.env.VITE_API_PORT ?? '8890'

export const API_BASE_URL = `${protocol}://${host}:${port}`
