import { describe, expect, it } from 'vitest'
import {
  automationContentSchema,
  automationDirectMessageSchema,
  automationFinalActionSchema,
  automationIdentificationSchema,
  automationKeywordSchema,
  automationPublicReplySchema,
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

describe('automationPublicReplySchema', () => {
  it('allows valid public reply text up to 1000 characters', () => {
    const result = automationPublicReplySchema.safeParse({ text: 'Obrigado pelo seu comentário!' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.text).toBe('Obrigado pelo seu comentário!')
    }
  })

  it('allows empty or omitted text for drafts', () => {
    expect(automationPublicReplySchema.safeParse({}).success).toBe(true)
    expect(automationPublicReplySchema.safeParse({ text: '' }).success).toBe(true)
    expect(automationPublicReplySchema.safeParse({ text: undefined }).success).toBe(true)
  })

  it('rejects public reply text with more than 1000 characters', () => {
    const longText = 'a'.repeat(1001)
    const result = automationPublicReplySchema.safeParse({ text: longText })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('1.000')
    }
  })
})

describe('automationDirectMessageSchema', () => {
  it('allows valid direct message text up to 1000 characters', () => {
    const result = automationDirectMessageSchema.safeParse({
      text: 'Olá! Segue seu link promocional.',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.text).toBe('Olá! Segue seu link promocional.')
    }
  })

  it('allows empty or omitted text for drafts', () => {
    expect(automationDirectMessageSchema.safeParse({}).success).toBe(true)
    expect(automationDirectMessageSchema.safeParse({ text: '' }).success).toBe(true)
    expect(automationDirectMessageSchema.safeParse({ text: undefined }).success).toBe(true)
  })

  it('rejects direct message text with more than 1000 characters', () => {
    const longText = 'm'.repeat(1001)
    const result = automationDirectMessageSchema.safeParse({ text: longText })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('1.000')
    }
  })
})

describe('automationFinalActionSchema', () => {
  it('validates LINK mode with valid URL and label', () => {
    const result = automationFinalActionSchema.safeParse({
      actionType: 'LINK',
      url: 'https://exemplo.com.br/oferta',
      label: 'Pegar desconto',
    })
    expect(result.success).toBe(true)
  })

  it('validates LINK mode with empty URL on drafts', () => {
    const result = automationFinalActionSchema.safeParse({
      actionType: 'LINK',
      url: '',
      label: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects LINK mode with invalid URL', () => {
    const result = automationFinalActionSchema.safeParse({
      actionType: 'LINK',
      url: 'nao-e-uma-url',
      label: 'Clique aqui',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('URL válida')
    }
  })

  it('rejects LINK mode with label > 80 characters', () => {
    const result = automationFinalActionSchema.safeParse({
      actionType: 'LINK',
      url: 'https://exemplo.com',
      label: 'x'.repeat(81),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('80')
    }
  })

  it('validates CAPTURE_EMAIL mode with valid prompt', () => {
    const result = automationFinalActionSchema.safeParse({
      actionType: 'CAPTURE_EMAIL',
      prompt: 'Digite seu melhor e-mail para receber o material:',
    })
    expect(result.success).toBe(true)
  })

  it('rejects CAPTURE_EMAIL mode with prompt > 300 characters', () => {
    const result = automationFinalActionSchema.safeParse({
      actionType: 'CAPTURE_EMAIL',
      prompt: 'e'.repeat(301),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('300')
    }
  })

  it('validates NONE mode', () => {
    const result = automationFinalActionSchema.safeParse({
      actionType: 'NONE',
    })
    expect(result.success).toBe(true)
  })
})
