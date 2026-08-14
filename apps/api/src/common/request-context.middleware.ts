import { Injectable, type NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

export const REQUEST_ID_HEADER = 'x-request-id'

export type RequestWithContext = Request & { requestId?: string }

export function resolveRequestId(value: unknown): string {
  if (typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) {
    return value
  }

  return randomUUID()
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    const requestId = resolveRequestId(request.headers[REQUEST_ID_HEADER])
    request.requestId = requestId
    response.setHeader(REQUEST_ID_HEADER, requestId)
    next()
  }
}
