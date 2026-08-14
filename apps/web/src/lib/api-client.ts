import { apiBaseUrl } from './auth-client'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  const body = (await response.json().catch(() => ({}))) as T & { message?: string }
  if (!response.ok) throw new Error(body.message ?? 'Não foi possível concluir a operação.')
  return body
}
