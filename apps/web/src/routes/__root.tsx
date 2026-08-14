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
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Manrope:wght@200..800&display=swap',
      },
      { rel: 'stylesheet', href: appStyles },
    ],
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
