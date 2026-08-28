import { clearCookies } from '@/test-utils/cookies'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { getCookie, setCookie } from '@/lib/cookies'
import { DirectionProvider } from '@/context/direction-provider'
import { LayoutProvider } from '@/context/layout-provider'
import { ThemeProvider } from '@/context/theme-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ConfigDrawer } from './config-drawer'

async function renderConfigDrawer({
  sidebarDefaultOpen = true,
}: {
  sidebarDefaultOpen?: boolean
} = {}) {
  return await render(
    <DirectionProvider>
      <ThemeProvider>
        <LayoutProvider>
          <SidebarProvider defaultOpen={sidebarDefaultOpen}>
            <ConfigDrawer />
          </SidebarProvider>
        </LayoutProvider>
      </ThemeProvider>
    </DirectionProvider>
  )
}

async function openDrawer() {
  await userEvent.click(
    page.getByRole('button', { name: /^Open theme settings$/i })
  )
  await expect
    .element(page.getByRole('dialog', { name: /theme settings/i }))
    .toBeInTheDocument()
}

describe('ConfigDrawer (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCookies()
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.removeAttribute('dir')
  })

  it('opens the drawer and renders the sections', async () => {
    await renderConfigDrawer()
    await openDrawer()

    const drawer = page.getByRole('dialog', { name: /theme settings/i })

    await expect.element(drawer).toBeInTheDocument()
    await expect.element(drawer.getByText(/^Theme$/i)).toBeInTheDocument()
    await expect.element(drawer.getByText(/^Layout$/i)).toBeInTheDocument()
    await expect.element(drawer.getByText(/^Sidebar$/i).first()).toBeInTheDocument()
    await expect.element(drawer.getByText(/^Direction$/i)).toBeInTheDocument()
    await expect
      .element(
        page.getByRole('button', {
          name: /reset all settings to default values/i,
        })
      )
      .toBeInTheDocument()
  })

  describe('updates theme', () => {
    it('applies light theme to <html> and cookie', async () => {
      await renderConfigDrawer()
      await openDrawer()

      await userEvent.click(page.getByRole('radio', { name: /select light/i }))

      await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBe('light'))
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('applies dark theme to <html> and cookie', async () => {
      await renderConfigDrawer()
      await openDrawer()

      await userEvent.click(page.getByRole('radio', { name: /select dark/i }))

      await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBe('dark'))
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })
  })

  describe('updates direction', () => {
    it('applies RTL direction to <html> and cookie', async () => {
      await renderConfigDrawer()
      await openDrawer()

      await userEvent.click(
        page.getByRole('radio', { name: /select right to left/i })
      )

      await vi.waitFor(() => expect(getCookie('dir')).toBe('rtl'))
      expect(document.documentElement.getAttribute('dir')).toBe('rtl')
    })

    it('applies LTR direction to <html> and cookie', async () => {
      setCookie('dir', 'rtl')

      await renderConfigDrawer()
      await openDrawer()

      await userEvent.click(
        page.getByRole('radio', { name: /select left to right/i })
      )

      await vi.waitFor(() => expect(getCookie('dir')).toBe('ltr'))
      expect(document.documentElement.getAttribute('dir')).toBe('ltr')
    })
  })

  describe('updates sidebar variant', () => {
    it('selecting floating updates layout_variant cookie', async () => {
      await renderConfigDrawer()
      await openDrawer()

      await userEvent.click(
        page.getByRole('radio', { name: /select floating/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_variant')).toBe('floating')
      )
    })

    it('selecting inset updates layout_variant cookie after another variant', async () => {
      await renderConfigDrawer()
      await openDrawer()

      await userEvent.click(
        page.getByRole('radio', { name: /select floating/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_variant')).toBe('floating')
      )

      await userEvent.click(
        page.getByRole('radio', { name: /select inset/i })
      )
      await vi.waitFor(() => expect(getCookie('layout_variant')).toBe('inset'))
    })
  })

  it('selecting full layout sets collapsible to offcanvas and closes sidebar', async () => {
    await renderConfigDrawer({ sidebarDefaultOpen: true })
    await openDrawer()

    await userEvent.click(
      page.getByRole('radio', { name: /select full layout/i })
    )
    await vi.waitFor(() =>
      expect(getCookie('layout_collapsible')).toBe('offcanvas')
    )
    await vi.waitFor(() => expect(getCookie('sidebar_state')).toBe('false'))
  })

  describe('section reset buttons', () => {
    it('resets theme via section control after choosing dark', async () => {
      await renderConfigDrawer()
      await openDrawer()

      await userEvent.click(page.getByRole('radio', { name: /select dark/i }))
      await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBe('dark'))

      await userEvent.click(
        page.getByRole('button', {
          name: /reset theme preference to default/i,
        })
      )
      await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBe('system'))
    })

    it('resets sidebar style via section control after choosing floating', async () => {
      await renderConfigDrawer()
      await openDrawer()

      await userEvent.click(
        page.getByRole('radio', { name: /select floating/i })
      )
      await vi.waitFor(() =>
        expect(getCookie('layout_variant')).toBe('floating')
      )

      await userEvent.click(
        page.getByRole('button', {
          name: /reset sidebar style to default/i,
        })
      )
      await vi.waitFor(() => expect(getCookie('layout_variant')).toBe('inset'))
    })
  })

  it('updates layout: selecting non-default closes sidebar and changes layout cookie', async () => {
    await renderConfigDrawer()
    await openDrawer()

    await userEvent.click(
      page.getByRole('radio', { name: /select compact/i })
    )

    await vi.waitFor(() =>
      expect(getCookie('layout_collapsible')).toBe('icon')
    )
    await vi.waitFor(() => expect(getCookie('sidebar_state')).toBe('false'))
  })

  it('reset restores defaults across sidebar/theme/layout/direction', async () => {
    await renderConfigDrawer()
    await openDrawer()

    await userEvent.click(page.getByRole('radio', { name: /select dark/i }))
    await userEvent.click(
      page.getByRole('radio', { name: /select right to left/i })
    )
    await userEvent.click(
      page.getByRole('radio', { name: /select floating/i })
    )
    await userEvent.click(
      page.getByRole('radio', { name: /select compact/i })
    )

    await userEvent.click(
      page.getByRole('button', {
        name: /reset all settings to default values/i,
      })
    )

    await vi.waitFor(() => expect(getCookie('vite-ui-theme')).toBeUndefined())
    await vi.waitFor(() => expect(getCookie('dir')).toBeUndefined())
    expect(document.documentElement.getAttribute('dir')).toBe('ltr')
    await vi.waitFor(() => expect(getCookie('sidebar_state')).toBe('true'))
  })
})
