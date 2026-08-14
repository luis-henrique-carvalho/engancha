import { ConsoleLogger, Injectable } from '@nestjs/common'

const nestStartupContexts = new Set(['RoutesResolver', 'RouterExplorer', 'NestApplication'])

function formatLogValue(value: unknown): string {
  if (typeof value === 'string') {
    return /\s/.test(value) ? JSON.stringify(value) : value
  }

  if (value === undefined) return 'undefined'
  if (value === null) return 'null'

  try {
    return JSON.stringify(value)
  } catch {
    return '[unserializable]'
  }
}

export function formatLogEvent(event: string, details: Record<string, unknown> = {}): string {
  const fields = Object.entries(details).map(([key, value]) => `${key}=${formatLogValue(value)}`)
  return [event, ...fields].join(' ')
}

export function shouldSuppressNestStartupLog(context: string | undefined): boolean {
  return context !== undefined && nestStartupContexts.has(context)
}

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  constructor(private readonly service: string) {
    super({ colors: true, compact: true, timestamp: true })
  }

  event(event: string, details: Record<string, unknown> = {}): void {
    this.log(formatLogEvent(event, details), this.service)
  }

  override log(message: unknown, context?: string): void {
    if (shouldSuppressNestStartupLog(context)) return
    super.log(message, context)
  }
}
