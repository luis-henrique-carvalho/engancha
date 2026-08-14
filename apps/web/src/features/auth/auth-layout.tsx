import { Link } from '@tanstack/react-router'
import { Logo } from '@/assets/logo'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="container grid min-h-svh max-w-none items-center justify-center py-8">
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-2">
        <div className="mb-4 flex items-center justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-medium tracking-tight"
            aria-label="Voltar para a página inicial do Engancha"
          >
            <Logo className="size-6" />
            <span>Engancha</span>
          </Link>
        </div>
        {children}
      </div>
    </main>
  )
}
