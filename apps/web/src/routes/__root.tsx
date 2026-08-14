import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { DirectionProvider } from '../context/direction-provider'
import { FontProvider } from '../context/font-provider'
import { ThemeProvider } from '../context/theme-provider'
import { NavigationProgress } from '../components/navigation-progress'
import { Toaster } from '../components/ui/sonner'
import appStyles from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'Engancha · Acesso' },
    ],
    links: [{ rel: 'stylesheet', href: appStyles }],
  }),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <NavigationProgress />
              <Outlet />
              <Toaster duration={5000} />
              <Scripts />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
