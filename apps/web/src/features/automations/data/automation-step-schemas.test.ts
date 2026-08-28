import { describe, expect, it } from 'vitest'
import {
  automationContentSchema,
  automationIdentificationSchema,
  automationKeywordSchema,
} from './automation-step-schemas'

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

describe('automationContentSchema', () => {
  it('allows selecting a targetId string', () => {
    const result = automationContentSchema.safeParse({ targetId: 'content-123' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.targetId).toBe('content-123')
    }
  })

  it('allows empty or null targetId for drafts', () => {
    expect(automationContentSchema.safeParse({}).success).toBe(true)
    expect(automationContentSchema.safeParse({ targetId: '' }).success).toBe(true)
    expect(automationContentSchema.safeParse({ targetId: null }).success).toBe(true)
    expect(automationContentSchema.safeParse({ targetId: undefined }).success).toBe(true)
  })
})

describe('automationKeywordSchema', () => {
  it('allows valid keywords up to 120 characters', () => {
    const result = automationKeywordSchema.safeParse({ keyword: 'QUERO DESCONTO' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.keyword).toBe('QUERO DESCONTO')
    }
  })

  it('allows empty or omitted keyword for drafts', () => {
    expect(automationKeywordSchema.safeParse({}).success).toBe(true)
    expect(automationKeywordSchema.safeParse({ keyword: '' }).success).toBe(true)
    expect(automationKeywordSchema.safeParse({ keyword: null }).success).toBe(true)
    expect(automationKeywordSchema.safeParse({ keyword: undefined }).success).toBe(true)
  })

  it('rejects keywords with more than 120 characters', () => {
    const longKeyword = 'k'.repeat(121)
    const result = automationKeywordSchema.safeParse({ keyword: longKeyword })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('120')
    }
  })
})
