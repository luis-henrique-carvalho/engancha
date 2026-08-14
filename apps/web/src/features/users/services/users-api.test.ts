import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { listUsersResponseSchema } from '../contracts'
import { UsersApi } from './users-api'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

const axiosGet = vi.mocked(axios.get)

describe('UsersApi', () => {
  it('should send listing params as query params', async () => {
    const response = {
      items: [],
      meta: {
        page: 2,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: true,
      },
    }

    axiosGet.mockResolvedValueOnce({ data: response })

    await expect(
      UsersApi.list({
        page: 2,
        limit: 20,
        query: 'ana',
        emailVerified: true,
      }),
    ).resolves.toEqual(response)

    expect(axiosGet).toHaveBeenCalledWith('/api/v1/users', {
      params: {
        page: 2,
        limit: 20,
        query: 'ana',
        emailVerified: true,
      },
    })
  })

  it('should accept the paginated users response schema', () => {
    const parsed = listUsersResponseSchema.parse({
      items: [
        {
          id: 'user-1',
          name: 'Ana',
          email: 'ana@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })

    expect(parsed.items).toHaveLength(1)
    expect(parsed.meta.total).toBe(1)
  })
})
