import { describe, expect, it } from 'vitest'
import { automationIdentificationSchema } from './automation-step-schemas'

describe('automationIdentificationSchema', () => {
  it('allows valid automation names up to 80 characters', () => {
    const validData = { name: 'Automação de Black Friday 2026' }
    const result = automationIdentificationSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Automação de Black Friday 2026')
    }
  })

  it('allows empty or omitted name for drafts', () => {
    expect(automationIdentificationSchema.safeParse({}).success).toBe(true)
    expect(automationIdentificationSchema.safeParse({ name: '' }).success).toBe(true)
    expect(automationIdentificationSchema.safeParse({ name: undefined }).success).toBe(true)
  })

  it('rejects names with more than 80 characters', () => {
    const longName = 'a'.repeat(81)
    const result = automationIdentificationSchema.safeParse({ name: longName })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('80')
    }
  })
})
