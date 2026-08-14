import { apiBaseUrl } from './auth-client'

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  const body = (await response.json().catch(() => ({}))) as T & { message?: string }
  if (!response.ok) {
    throw new ApiClientError(
      body.message ?? 'Não foi possível concluir a operação.',
      response.status,
    )
  }
  return body
}
