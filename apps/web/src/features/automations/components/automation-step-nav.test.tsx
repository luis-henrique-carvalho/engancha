import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AutomationStepNav } from './automation-step-nav'

let mockPathname = '/automations/auto-1/identification'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useLocation: () => ({ pathname: mockPathname }),
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...props }: any) => (
      <a href={typeof to === 'string' ? to : '#'} {...props}>
        {children}
      </a>
    ),
  }
})

describe('AutomationStepNav', () => {
  beforeEach(() => {
    mockPathname = '/automations/auto-1/identification'
  })

  it('renders all 7 step items in the desktop navigation', async () => {
    const { getByTestId } = await render(<AutomationStepNav automationId="auto-1" />)

    const desktopNav = getByTestId('automation-step-nav-desktop')
    await expect.element(desktopNav).toBeInTheDocument()
    await expect.element(getByTestId('step-link-identification')).toBeInTheDocument()
    await expect.element(getByTestId('step-link-content')).toBeInTheDocument()
    await expect.element(getByTestId('step-link-keyword')).toBeInTheDocument()
    await expect.element(getByTestId('step-link-public-reply')).toBeInTheDocument()
    await expect.element(getByTestId('step-link-direct-message')).toBeInTheDocument()
    await expect.element(getByTestId('step-link-final-action')).toBeInTheDocument()
    await expect.element(getByTestId('step-link-review')).toBeInTheDocument()
  })

  it('renders mobile navigation selector', async () => {
    const { getByTestId } = await render(<AutomationStepNav automationId="auto-1" />)

    await expect.element(getByTestId('automation-step-nav-mobile')).toBeInTheDocument()
  })
})
