import type { AutomationAction } from '@engancha/contracts'
import { describe, expect, it } from 'vitest'
import {
  buildUpdatedActions,
  getFinalAction,
  getPrivateReplyText,
  getPublicReplyText,
  orderAutomationActions,
} from './automation-action-mappers'

describe('automation-action-mappers', () => {
  const sampleActions: AutomationAction[] = [
    { type: 'PUBLIC_REPLY', text: 'Obrigado pelo comentário!' },
    { type: 'PRIVATE_REPLY', text: 'Aqui está seu presente no direct.' },
    { type: 'LINK', url: 'https://exemplo.com/cupom', label: 'Ver cupom' },
  ]

  describe('extractors', () => {
    it('extracts public reply text correctly', () => {
      expect(getPublicReplyText(sampleActions)).toBe('Obrigado pelo comentário!')
      expect(getPublicReplyText([])).toBe('')
      expect(getPublicReplyText(null)).toBe('')
      expect(getPublicReplyText(undefined)).toBe('')
    })

    it('extracts private reply text correctly', () => {
      expect(getPrivateReplyText(sampleActions)).toBe('Aqui está seu presente no direct.')
      expect(getPrivateReplyText([])).toBe('')
      expect(getPrivateReplyText(null)).toBe('')
      expect(getPrivateReplyText(undefined)).toBe('')
    })

    it('extracts final action correctly (LINK or CAPTURE_EMAIL)', () => {
      expect(getFinalAction(sampleActions)).toEqual({
        type: 'LINK',
        url: 'https://exemplo.com/cupom',
        label: 'Ver cupom',
      })

      const emailActions: AutomationAction[] = [
        { type: 'PUBLIC_REPLY', text: 'Valeu!' },
        { type: 'CAPTURE_EMAIL', prompt: 'Qual seu melhor e-mail?' },
      ]
      expect(getFinalAction(emailActions)).toEqual({
        type: 'CAPTURE_EMAIL',
        prompt: 'Qual seu melhor e-mail?',
      })

      expect(getFinalAction([])).toBeUndefined()
      expect(getFinalAction(null)).toBeUndefined()
    })
  })

  describe('orderAutomationActions', () => {
    it('sorts actions into canonical order [PUBLIC_REPLY, PRIVATE_REPLY, FINAL_ACTION]', () => {
      const outOfOrder: AutomationAction[] = [
        { type: 'LINK', url: 'https://exemplo.com', label: 'Clique aqui' },
        { type: 'PUBLIC_REPLY', text: 'Oi' },
        { type: 'PRIVATE_REPLY', text: 'Tudo bem?' },
      ]
      const sorted = orderAutomationActions(outOfOrder)
      expect(sorted.map((a) => a.type)).toEqual(['PUBLIC_REPLY', 'PRIVATE_REPLY', 'LINK'])
    })
  })

  describe('buildUpdatedActions', () => {
    it('updates public reply while preserving other actions and maintaining deterministic sequence', () => {
      const updated = buildUpdatedActions(sampleActions, {
        publicReply: 'Nova resposta pública',
      })
      expect(updated).toEqual([
        { type: 'PUBLIC_REPLY', text: 'Nova resposta pública' },
        { type: 'PRIVATE_REPLY', text: 'Aqui está seu presente no direct.' },
        { type: 'LINK', url: 'https://exemplo.com/cupom', label: 'Ver cupom' },
      ])
    })

    it('removes public reply when text is empty or null', () => {
      const updated = buildUpdatedActions(sampleActions, {
        publicReply: '',
      })
      expect(updated).toEqual([
        { type: 'PRIVATE_REPLY', text: 'Aqui está seu presente no direct.' },
        { type: 'LINK', url: 'https://exemplo.com/cupom', label: 'Ver cupom' },
      ])
    })

    it('updates private reply while preserving other actions and maintaining deterministic sequence', () => {
      const updated = buildUpdatedActions(sampleActions, {
        privateReply: 'Nova DM exclusiva',
      })
      expect(updated).toEqual([
        { type: 'PUBLIC_REPLY', text: 'Obrigado pelo comentário!' },
        { type: 'PRIVATE_REPLY', text: 'Nova DM exclusiva' },
        { type: 'LINK', url: 'https://exemplo.com/cupom', label: 'Ver cupom' },
      ])
    })

    it('updates final action with LINK while preserving public and private replies', () => {
      const updated = buildUpdatedActions(sampleActions, {
        finalAction: { type: 'LINK', url: 'https://novo.com', label: 'Acessar' },
      })
      expect(updated).toEqual([
        { type: 'PUBLIC_REPLY', text: 'Obrigado pelo comentário!' },
        { type: 'PRIVATE_REPLY', text: 'Aqui está seu presente no direct.' },
        { type: 'LINK', url: 'https://novo.com', label: 'Acessar' },
      ])
    })

    it('replaces LINK with CAPTURE_EMAIL as final action', () => {
      const updated = buildUpdatedActions(sampleActions, {
        finalAction: { type: 'CAPTURE_EMAIL', prompt: 'Digite seu e-mail:' },
      })
      expect(updated).toEqual([
        { type: 'PUBLIC_REPLY', text: 'Obrigado pelo comentário!' },
        { type: 'PRIVATE_REPLY', text: 'Aqui está seu presente no direct.' },
        { type: 'CAPTURE_EMAIL', prompt: 'Digite seu e-mail:' },
      ])
    })

    it('removes final action when finalAction is null', () => {
      const updated = buildUpdatedActions(sampleActions, {
        finalAction: null,
      })
      expect(updated).toEqual([
        { type: 'PUBLIC_REPLY', text: 'Obrigado pelo comentário!' },
        { type: 'PRIVATE_REPLY', text: 'Aqui está seu presente no direct.' },
      ])
    })

    it('handles initializing actions from empty state in canonical order', () => {
      let actions = buildUpdatedActions([], { publicReply: 'Oi!' })
      expect(actions).toEqual([{ type: 'PUBLIC_REPLY', text: 'Oi!' }])

      actions = buildUpdatedActions(actions, {
        finalAction: { type: 'LINK', url: 'https://loja.com', label: 'Comprar' },
      })
      expect(actions).toEqual([
        { type: 'PUBLIC_REPLY', text: 'Oi!' },
        { type: 'LINK', url: 'https://loja.com', label: 'Comprar' },
      ])

      actions = buildUpdatedActions(actions, { privateReply: 'Veja o link abaixo:' })
      expect(actions).toEqual([
        { type: 'PUBLIC_REPLY', text: 'Oi!' },
        { type: 'PRIVATE_REPLY', text: 'Veja o link abaixo:' },
        { type: 'LINK', url: 'https://loja.com', label: 'Comprar' },
      ])
    })
  })
})
