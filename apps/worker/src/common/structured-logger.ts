import { ConsoleLogger, Injectable } from '@nestjs/common'

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  constructor(private readonly service: string) {
    super({ json: true })
  }

  event(event: string, details: Record<string, unknown> = {}): void {
    this.log(JSON.stringify({ service: this.service, event, ...details }))
  }
}
