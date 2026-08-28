import { describe, expect, it } from 'vitest'
import { extractSimulationOutputs, getExecutionStatusViewModel } from './simulation-view-mappers'

describe('simulation-view-mappers', () => {
  it('extracts simulation outputs for public reply, private reply, link delivery and email capture', () => {
    const outputs = [
      {
        id: 'out-1',
        key: 'k1',
        position: 0,
        type: 'PUBLIC_REPLY' as const,
        payload: { text: 'Olá!' },
        createdAt: '2026-08-28T10:00:00.000Z',
      },
      {
        id: 'out-2',
        key: 'k2',
        position: 1,
        type: 'PRIVATE_REPLY' as const,
        payload: { text: 'Aqui está seu link:' },
        createdAt: '2026-08-28T10:00:01.000Z',
      },
      {
        id: 'out-3',
        key: 'k3',
        position: 2,
        type: 'LINK_DELIVERY' as const,
        payload: { url: 'https://exemplo.com', buttonText: 'Abrir link' },
        createdAt: '2026-08-28T10:00:02.000Z',
      },
      {
        id: 'out-4',
        key: 'k4',
        position: 3,
        type: 'EMAIL_CAPTURE_REQUEST' as const,
        payload: { prompt: 'Qual seu e-mail?' },
        createdAt: '2026-08-28T10:00:03.000Z',
      },
    ]

    const extracted = extractSimulationOutputs(outputs)

    expect(extracted.publicReply?.text).toBe('Olá!')
    expect(extracted.privateReply?.text).toBe('Aqui está seu link:')
    expect(extracted.linkDelivery?.url).toBe('https://exemplo.com')
    expect(extracted.linkDelivery?.buttonText).toBe('Abrir link')
    expect(extracted.emailCapture?.prompt).toBe('Qual seu e-mail?')
  })

  it('maps execution status to user-safe view models without technical jargon', () => {
    expect(getExecutionStatusViewModel('PENDING', null).label).toBe('Aguardando')
    expect(getExecutionStatusViewModel('PROCESSING', null).label).toBe('Processando')
    expect(getExecutionStatusViewModel('COMPLETED', true).label).toBe('Concluído')
    expect(getExecutionStatusViewModel('IGNORED', false).description).toContain(
      'Nenhuma automação ativa reconheceu a palavra-chave',
    )
    expect(
      getExecutionStatusViewModel('FAILED', true, {
        code: 'SIM_ERR',
        message: 'Erro amigável',
      }).description,
    ).toBe('Erro amigável')
  })
})
