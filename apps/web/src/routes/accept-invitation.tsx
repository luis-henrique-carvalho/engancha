import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export const Route = createFileRoute('/accept-invitation')({
  validateSearch: (search: Record<string, unknown>) => ({
    invitationId: typeof search.invitationId === 'string' ? search.invitationId : undefined,
  }),
  component: AcceptInvitationPage,
})

function AcceptInvitationPage() {
  const { invitationId } = Route.useSearch()
  const navigate = useNavigate()
  const session = authClient.useSession()
  const [error, setError] = useState<string>()
  const [isAccepting, setIsAccepting] = useState(false)

  const accept = async () => {
    if (!invitationId) return
    setIsAccepting(true)
    setError(undefined)
    const result = await authClient.organization.acceptInvitation({ invitationId })
    if (result.error) {
      setError(result.error.message ?? 'Não foi possível aceitar este convite.')
      setIsAccepting(false)
      return
    }
    await navigate({ to: '/workspace', replace: true })
  }

  const unavailable = !invitationId
  const unauthenticated = !session.isPending && !session.data?.user

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar convite</CardTitle>
          <CardDescription>
            Entre com a conta do mesmo e-mail convidado e confirme o endereço antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {unavailable ? (
            <p className="text-sm text-destructive">Este link de convite é inválido.</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {unauthenticated ? (
            <Button asChild>
              <Link to="/auth/login">Entrar para aceitar</Link>
            </Button>
          ) : null}
          {!unavailable && !unauthenticated ? (
            <Button onClick={() => void accept()} disabled={session.isPending || isAccepting}>
              {isAccepting ? 'Aceitando…' : 'Aceitar convite'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
