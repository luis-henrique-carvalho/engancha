import { Injectable } from '@nestjs/common'
import type { ContentProviderPort } from '../../domain/ports/content-provider.port'

@Injectable()
export class InstagramContentProvider implements ContentProviderPort {
  readonly provider = 'INSTAGRAM' as const
  assertPublishable(): void {
    /* capability gate; concrete delivery belongs to a future provider adapter */
  }
}
