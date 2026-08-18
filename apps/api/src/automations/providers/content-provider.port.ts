import { ConflictException, Injectable } from '@nestjs/common'
import type { AutomationAction } from '@engancha/contracts'

export type ProviderName = 'INSTAGRAM' | 'TIKTOK'

export interface ContentProviderPort {
  readonly provider: ProviderName
  assertPublishable(actions: AutomationAction[]): void
}

export const CONTENT_PROVIDER_PORTS = Symbol('CONTENT_PROVIDER_PORTS')

@Injectable()
export class ContentProviderRegistry {
  constructor(private readonly providers: ContentProviderPort[]) {}
  assertPublishable(provider: ProviderName, actions: AutomationAction[]): void {
    const adapter = this.providers.find((candidate) => candidate.provider === provider)
    if (!adapter)
      throw new ConflictException({
        code: 'PROVIDER_NOT_SUPPORTED',
        message: 'Provider is not supported',
      })
    adapter.assertPublishable(actions)
  }
}
