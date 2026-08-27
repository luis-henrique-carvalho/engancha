import { apiBaseUrl } from './auth-client'

export interface ApiClientErrorOptions {
  status: number
  code?: string
  issues?: unknown
  requestId?: string
}

export class ApiClientError extends Error {
  readonly status: number
  readonly code?: string
  readonly issues?: unknown
  readonly requestId?: string

  constructor(message: string, options: ApiClientErrorOptions | number) {
    super(message)
    this.name = 'ApiClientError'
    if (typeof options === 'number') {
      this.status = options
    } else {
      this.status = options.status
      this.code = options.code
      this.issues = options.issues
      this.requestId = options.requestId
    }
  }
}

interface ApiErrorPayload {
  statusCode?: number
  code?: string
  message?: string
  requestId?: string
  issues?: unknown
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorPayload
  if (!response.ok) {
    const requestId = response.headers.get('x-request-id') ?? body.requestId
    throw new ApiClientError(body.message ?? 'Não foi possível concluir a operação.', {
      status: response.status,
      code: body.code,
      issues: body.issues,
      requestId: requestId ?? undefined,
    })
  }
  return body as T
}
