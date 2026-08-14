import { Controller, Get } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'

@Controller('status')
@AllowAnonymous()
export class AppController {
  @Get()
  status(): { status: string; service: string } {
    return { status: 'ok', service: 'api' }
  }
}
