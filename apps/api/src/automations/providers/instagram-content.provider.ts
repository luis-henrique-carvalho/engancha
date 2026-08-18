import { Injectable } from '@nestjs/common'
import type { AutomationAction } from '@engancha/contracts'
import type { ContentProviderPort } from './content-provider.port'

@Injectable()
export class InstagramContentProvider implements ContentProviderPort {
  readonly provider = 'INSTAGRAM' as const
  assertPublishable(_actions: AutomationAction[]): void {
    /* capability gate; concrete delivery belongs to a future provider adapter */
  }
}
