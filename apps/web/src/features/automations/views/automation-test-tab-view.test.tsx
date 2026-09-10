import type { AutomationResponse } from '@engancha/contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AutomationEditorProvider } from '../components/shared/automation-editor-provider'
import { AutomationTestTabView } from './automation-test-tab-view'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ children, to, ...props }: any) => (
      <a
        href={typeof to === 'string' ? to : '#'}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

describe('AutomationTestTabView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders guidance to configure/publish when automation is DRAFT', async () => {
    const draftAutomation: AutomationResponse = {
      id: 'auto-draft',
      status: 'DRAFT',
      createdAt: '2026-08-28T10:00:00.000Z',
      updatedAt: '2026-08-28T10:00:00.000Z',
      hasUnpublishedChanges: false,
      executionCount: 0,
      leadCount: 0,
      draft: null,
      published: null,
      current: null,
    }

    const { getByTestId, getByText } = await render(
      <AutomationEditorProvider
        workspaceId="ws-1"
        automationId="auto-draft"
        automation={draftAutomation}
      >
        <AutomationTestTabView automationId="auto-draft" />
      </AutomationEditorProvider>,
    )

    await expect.element(getByTestId('automation-test-draft-guidance')).toBeInTheDocument()
    await expect.element(getByText('Automação em rascunho')).toBeInTheDocument()
    await expect.element(getByText('Ir para Revisão e Publicação')).toBeInTheDocument()
  })

  it('renders guidance to reactivate when automation is PAUSED', async () => {
    const pausedAutomation: AutomationResponse = {
      id: 'auto-paused',
      status: 'PAUSED',
      createdAt: '2026-08-28T10:00:00.000Z',
      updatedAt: '2026-08-28T10:00:00.000Z',
      hasUnpublishedChanges: false,
      executionCount: 5,
      leadCount: 2,
      draft: null,
      published: {
        id: 'rev-pub-1',
        version: 1,
        name: 'Auto 1',
        target: {
          id: 'content-1',
          organizationId: 'ws-1',
          title: 'Post 1',
          externalContentId: 'ig-1',
          provider: 'INSTAGRAM',
          mode: 'SIMULATED',
          contentType: 'POST',
          createdAt: '2026-08-28T10:00:00.000Z',
          updatedAt: '2026-08-28T10:00:00.000Z',
        },
        keyword: 'QUERO',
        actions: [],
      },
      current: null,
    }

    const { getByTestId, getByText } = await render(
      <AutomationEditorProvider
        workspaceId="ws-1"
        automationId="auto-paused"
        automation={pausedAutomation}
      >
        <AutomationTestTabView automationId="auto-paused" />
      </AutomationEditorProvider>,
    )

    await expect.element(getByTestId('automation-test-paused-guidance')).toBeInTheDocument()
    await expect.element(getByText('Automação pausada')).toBeInTheDocument()
    await expect.element(getByText('Ir para Configuração')).toBeInTheDocument()
  })

  it('renders test form and follower chat when automation is ACTIVE with published revision', async () => {
    const activeAutomation: AutomationResponse = {
      id: 'auto-active',
      status: 'ACTIVE',
      createdAt: '2026-08-28T10:00:00.000Z',
      updatedAt: '2026-08-28T10:00:00.000Z',
      hasUnpublishedChanges: false,
      executionCount: 10,
      leadCount: 4,
      draft: null,
      published: {
        id: 'rev-pub-1',
        version: 1,
        name: 'Automação Ativa',
        target: {
          id: 'content-1',
          organizationId: 'ws-1',
          title: 'Comente PROMO para receber o desconto!',
          externalContentId: 'ext-post-1',
          provider: 'INSTAGRAM',
          mode: 'SIMULATED',
          contentType: 'POST',
          createdAt: '2026-08-28T10:00:00.000Z',
          updatedAt: '2026-08-28T10:00:00.000Z',
        },
        keyword: 'PROMO',
        actions: [],
      },
      current: null,
    }

    const { getByTestId, getByText } = await render(
      <AutomationEditorProvider
        workspaceId="ws-1"
        automationId="auto-active"
        automation={activeAutomation}
      >
        <AutomationTestTabView automationId="auto-active" />
      </AutomationEditorProvider>,
    )

    await expect.element(getByTestId('automation-test-tab-view')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-test-form-card')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-follower-chat-card')).toBeInTheDocument()
    await expect.element(getByText('Comente PROMO para receber o desconto!')).toBeInTheDocument()
  })
})
