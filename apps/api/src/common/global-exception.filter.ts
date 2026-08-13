import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  LoggerService,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'

type ErrorResponse = {
  statusCode: number
  code: string
  message: string
  requestId: string
  timestamp: string
  path: string
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()
    const requestId = this.requestId(request)
    const isHttpException = exception instanceof HttpException
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const body: ErrorResponse = {
      statusCode,
      code: isHttpException ? `HTTP_${statusCode}` : 'INTERNAL_ERROR',
      message: isHttpException ? this.publicMessage(exception) : 'Internal server error',
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    response.setHeader('x-request-id', requestId)
    response.status(statusCode).json(body)
    this.logger.error(
      JSON.stringify({
        service: 'api',
        event: 'request_error',
        requestId,
        statusCode,
        path: request.url,
      }),
    )
  }

  private requestId(request: Request): string {
    const header = request.headers['x-request-id']
    return typeof header === 'string' && header.length > 0 ? header.slice(0, 128) : randomUUID()
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
