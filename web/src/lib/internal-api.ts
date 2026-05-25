export const ANALYSIS_API_URL = process.env.ANALYSIS_API_URL ?? 'http://localhost:8001/api/v1'

const INTERNAL_API_TOKEN = process.env.API_SHARED_SECRET

export function internalApiHeaders(extra?: HeadersInit): HeadersInit {
  const headers = new Headers(extra)
  if (INTERNAL_API_TOKEN) {
    headers.set('X-Bull-Internal-Token', INTERNAL_API_TOKEN)
  }
  return headers
}
