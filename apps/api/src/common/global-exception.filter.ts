import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import { type RequestWithContext } from './request-context.middleware'
import { StructuredLogger } from './structured-logger'

type ErrorResponse = {
  statusCode: number
  code: string
  message: string
  requestId: string
  timestamp: string
  path: string
  issues?: unknown
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Pick<StructuredLogger, 'event'>) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<RequestWithContext>()
    const response = http.getResponse<Response>()
    const requestId = request.requestId ?? 'unknown'
    const path = request.path
    const isHttpException = exception instanceof HttpException
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const body: ErrorResponse = {
      statusCode,
      code: isHttpException ? this.publicCode(exception, statusCode) : 'INTERNAL_ERROR',
      message: isHttpException ? this.publicMessage(exception) : 'Internal server error',
      requestId,
      timestamp: new Date().toISOString(),
      path,
    }
    const payload = isHttpException ? exception.getResponse() : undefined
    if (payload && typeof payload === 'object' && 'issues' in payload) body.issues = payload.issues

    response.setHeader('x-request-id', requestId)
    response.status(statusCode).json(body)
    this.logger.event('request_error', {
      requestId,
      statusCode,
      path,
      errorType: exception instanceof Error ? exception.name : 'UnknownError',
    })
  }

  private publicCode(exception: HttpException, statusCode: number): string {
    const payload = exception.getResponse()
    return payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      typeof payload.code === 'string'
      ? payload.code
      : `HTTP_${statusCode}`
  }

  private publicMessage(exception: HttpException): string {
    const payload = exception.getResponse()
    if (typeof payload === 'string') return payload
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = payload.message
      if (typeof message === 'string') return message
      if (Array.isArray(message) && message.every((item) => typeof item === 'string'))
        return message.join(', ')
    }
    return exception.message
  }
}
