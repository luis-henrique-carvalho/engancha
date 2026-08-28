import type { SimulationExecutionResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { SimulationFollowerChat } from './simulation-follower-chat'

describe('SimulationFollowerChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state initially when no execution is provided', async () => {
    const { getByTestId, getByText } = await render(<SimulationFollowerChat execution={null} />)

    await expect.element(getByTestId('simulation-empty-state')).toBeInTheDocument()
    await expect.element(getByText('Nenhum teste em execução')).toBeInTheDocument()
  })

  it('renders follower comment, public reply, DM and link delivery when positive LINK flow is completed', async () => {
    const mockExecution: SimulationExecutionResponse = {
      id: 'exec-link',
      status: 'COMPLETED',
      simulated: true,
      provider: 'INSTAGRAM',
      contentId: 'content-1',
      input: {
        author: '@maria.teste',
        text: 'QUERO',
        commentId: null,
        submittedAt: '2026-08-28T10:00:00.000Z',
      },
      matched: true,
      automation: { id: 'auto-1', revisionId: 'rev-1', version: 1 },
      outputs: [
        {
          id: 'out-1',
          key: 'exec-link:0:PUBLIC_REPLY',
          position: 0,
          type: 'PUBLIC_REPLY',
          payload: { text: 'Acabei de enviar no seu direct!' },
          createdAt: '2026-08-28T10:00:01.000Z',
        },
        {
          id: 'out-2',
          key: 'exec-link:1:PRIVATE_REPLY',
          position: 1,
          type: 'PRIVATE_REPLY',
          payload: { text: 'Olá! Aqui está o link que você pediu:' },
          createdAt: '2026-08-28T10:00:02.000Z',
        },
        {
          id: 'out-3',
          key: 'exec-link:2:LINK_DELIVERY',
          position: 2,
          type: 'LINK_DELIVERY',
          payload: { url: 'https://exemplo.com/guia', buttonText: 'Baixar Guia' },
          createdAt: '2026-08-28T10:00:03.000Z',
        },
      ],
      attempts: 1,
      error: null,
      stateVersion: 4,
    }

    const { getByTestId, getByText } = await render(
      <SimulationFollowerChat execution={mockExecution} />,
    )

    await expect.element(getByTestId('simulation-step-comment')).toBeInTheDocument()
    await expect.element(getByText('@maria.teste')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-step-public-reply')).toBeInTheDocument()
    await expect.element(getByText('Acabei de enviar no seu direct!')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-step-direct-message')).toBeInTheDocument()
    await expect.element(getByText('Olá! Aqui está o link que você pediu:')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-step-link-delivery')).toBeInTheDocument()
    await expect.element(getByText('Baixar Guia')).toBeInTheDocument()
    await expect.element(getByText('https://exemplo.com/guia')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-completed-banner')).toBeInTheDocument()
  })

  it('renders email capture request with simulated disclaimer when positive CAPTURE_EMAIL flow is completed', async () => {
    const mockExecution: SimulationExecutionResponse = {
      id: 'exec-email',
      status: 'COMPLETED',
      simulated: true,
      provider: 'INSTAGRAM',
      contentId: 'content-1',
      input: {
        author: '@joao.teste',
        text: 'INFO',
        commentId: null,
        submittedAt: '2026-08-28T10:00:00.000Z',
      },
      matched: true,
      automation: { id: 'auto-1', revisionId: 'rev-1', version: 1 },
      outputs: [
        {
          id: 'out-1',
          key: 'exec-email:0:PUBLIC_REPLY',
          position: 0,
          type: 'PUBLIC_REPLY',
          payload: { text: 'Respondido no direct!' },
          createdAt: '2026-08-28T10:00:01.000Z',
        },
        {
          id: 'out-2',
          key: 'exec-email:1:PRIVATE_REPLY',
          position: 1,
          type: 'PRIVATE_REPLY',
          payload: { text: 'Para receber o material, informe seu e-mail.' },
          createdAt: '2026-08-28T10:00:02.000Z',
        },
        {
          id: 'out-3',
          key: 'exec-email:2:EMAIL_CAPTURE_REQUEST',
          position: 2,
          type: 'EMAIL_CAPTURE_REQUEST',
          payload: { prompt: 'Qual seu melhor e-mail?' },
          createdAt: '2026-08-28T10:00:03.000Z',
        },
      ],
      attempts: 1,
      error: null,
      stateVersion: 4,
    }

    const { getByTestId, getByText } = await render(
      <SimulationFollowerChat execution={mockExecution} />,
    )

    await expect.element(getByTestId('simulation-step-email-capture')).toBeInTheDocument()
    await expect.element(getByText('Qual seu melhor e-mail?')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-email-notice')).toBeInTheDocument()
    await expect
      .element(
        getByText('Simulação: a jornada encerra na solicitação. Nenhum dado real foi coletado.'),
      )
      .toBeInTheDocument()
  })

  it('renders ignored alert when status is IGNORED', async () => {
    const mockExecution: SimulationExecutionResponse = {
      id: 'exec-ignored',
      status: 'IGNORED',
      simulated: true,
      provider: 'INSTAGRAM',
      contentId: 'content-1',
      input: {
        author: '@visitante',
        text: 'Comentário sem palavra-chave',
        commentId: null,
        submittedAt: '2026-08-28T10:00:00.000Z',
      },
      matched: false,
      automation: null,
      outputs: [],
      attempts: 1,
      error: null,
      stateVersion: 2,
    }

    const { getByTestId, getByText } = await render(
      <SimulationFollowerChat execution={mockExecution} />,
    )

    await expect.element(getByTestId('simulation-ignored-alert')).toBeInTheDocument()
    await expect
      .element(
        getByText(
          'Nenhuma automação ativa reconheceu a palavra-chave configurada para esta publicação.',
        ),
      )
      .toBeInTheDocument()
  })

  it('renders failed alert with retry button when status is FAILED', async () => {
    const onRetry = vi.fn()
    const mockExecution: SimulationExecutionResponse = {
      id: 'exec-failed',
      status: 'FAILED',
      simulated: true,
      provider: 'INSTAGRAM',
      contentId: 'content-1',
      input: {
        author: '@visitante',
        text: 'QUERO',
        commentId: null,
        submittedAt: '2026-08-28T10:00:00.000Z',
      },
      matched: true,
      automation: { id: 'auto-1', revisionId: 'rev-1', version: 1 },
      outputs: [],
      attempts: 4,
      error: {
        code: 'SIMULATION_EXECUTION_FAILED',
        message: 'A simulação falhou ao processar as ações configuradas.',
      },
      stateVersion: 2,
    }

    const { getByTestId, getByText } = await render(
      <SimulationFollowerChat
        execution={mockExecution}
        onRetry={onRetry}
      />,
    )

    await expect.element(getByTestId('simulation-failed-alert')).toBeInTheDocument()
    await expect
      .element(getByText('A simulação falhou ao processar as ações configuradas.'))
      .toBeInTheDocument()

    const retryBtn = getByTestId('simulation-retry-btn')
    await retryBtn.click()

    expect(onRetry).toHaveBeenCalled()
  })

  it('renders reconnecting badge when isReconnecting is true', async () => {
    const { getByTestId } = await render(
      <SimulationFollowerChat
        execution={null}
        isReconnecting={true}
      />,
    )

    await expect.element(getByTestId('simulation-reconnecting-badge')).toBeInTheDocument()
  })
})
