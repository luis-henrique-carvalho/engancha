import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { DirectionProvider } from '../context/direction-provider'
import { FontProvider } from '../context/font-provider'
import { ThemeProvider } from '../context/theme-provider'
import { NavigationProgress } from '../components/navigation-progress'
import { Toaster } from '../components/ui/sonner'
import { GeneralError } from '../features/errors/general-error'
import { NotFoundError } from '../features/errors/not-found-error'
import appStyles from '../styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'Engancha · Acesso' },
      {
        name: 'description',
        content: 'Acesse o Engancha para organizar e acompanhar seu trabalho.',
      },
      { name: 'theme-color', content: '#020817' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'pt_BR' },
      { property: 'og:title', content: 'Engancha' },
      {
        property: 'og:description',
        content: 'Acesse o Engancha para organizar e acompanhar seu trabalho.',
      },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Engancha' },
      {
        name: 'twitter:description',
        content: 'Acesse o Engancha para organizar e acompanhar seu trabalho.',
      },
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
  errorComponent: GeneralError,
  notFoundComponent: NotFoundError,
})

function RootDocument() {
  const { options } = useRouter()
  const { queryClient } = options.context

  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <FontProvider>
              <DirectionProvider>
                <NavigationProgress />
                <Outlet />
                <Toaster duration={5000} />
                {import.meta.env.DEV && (
                  <>
                    <ReactQueryDevtools buttonPosition="bottom-left" />
                    <TanStackRouterDevtools position="bottom-right" />
                  </>
                )}
                <Scripts />
              </DirectionProvider>
            </FontProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
