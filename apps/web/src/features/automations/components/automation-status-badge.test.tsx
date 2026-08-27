import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { AutomationStatusBadge } from './automation-status-badge'

describe('AutomationStatusBadge', () => {
  it('renders DRAFT status badge correctly', async () => {
    const { getByText } = await render(<AutomationStatusBadge status="DRAFT" />)
    await expect.element(getByText('Rascunho')).toBeInTheDocument()
  })

  it('renders ACTIVE status badge correctly', async () => {
    const { getByText } = await render(<AutomationStatusBadge status="ACTIVE" />)
    await expect.element(getByText('Ativa')).toBeInTheDocument()
  })

  it('renders unpublished changes badge when active with unpublished changes', async () => {
    const { getByText } = await render(
      <AutomationStatusBadge status="ACTIVE" hasUnpublishedChanges={true} />,
    )
    await expect.element(getByText('Ativa')).toBeInTheDocument()
    await expect.element(getByText('Alterações pendentes')).toBeInTheDocument()
  })

  it('renders PAUSED status badge correctly', async () => {
    const { getByText } = await render(<AutomationStatusBadge status="PAUSED" />)
    await expect.element(getByText('Pausada')).toBeInTheDocument()
  })

  it('renders ARCHIVED status badge correctly', async () => {
    const { getByText } = await render(<AutomationStatusBadge status="ARCHIVED" />)
    await expect.element(getByText('Arquivada')).toBeInTheDocument()
  })
})
