import { Injectable } from '@nestjs/common'
import { auth } from '../auth/auth'

type RequestHeaders = Record<string, string | string[] | undefined>

function toHeaders(headers: RequestHeaders | undefined): Headers {
  const result = new Headers()
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (typeof value === 'string') result.set(key, value)
    else if (Array.isArray(value)) result.set(key, value.join(', '))
  }
  return result
}

@Injectable()
export class OrganizationGateway {
  createOrganization(input: { name: string; slug: string; userId: string }) {
    return auth.api.createOrganization({
      body: { ...input, keepCurrentActiveOrganization: false },
    })
  }

  createInvitation(input: { email: string; organizationId: string; headers?: RequestHeaders }) {
    return auth.api.createInvitation({
      body: { email: input.email, role: 'member', organizationId: input.organizationId },
      headers: toHeaders(input.headers),
    })
  }
}
