import type { AutomationStatus } from '@engancha/contracts'
import { AUTOMATION_STATUS_MAP } from './automation-status'

export const automationStatusOptions: {
  label: string
  value: AutomationStatus
}[] = (['ACTIVE', 'DRAFT', 'PAUSED'] as const).map((status) => ({
  label: AUTOMATION_STATUS_MAP[status].label,
  value: status,
}))
