import { Controller, Get } from '@nestjs/common'

@Controller('status')
export class AppController {
  @Get()
  status(): { status: string; service: string } {
    return { status: 'ok', service: 'api' }
  }
}
