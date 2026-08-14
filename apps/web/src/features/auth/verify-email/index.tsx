import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient, webCallbackUrl } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'

type VerifyEmailProps = { email: string }

export function VerifyEmail({ email }: VerifyEmailProps) {
  const [message, setMessage] = useState('Confira sua caixa de entrada para confirmar o endereço.')
  const [loading, setLoading] = useState(false)

  async function resend() {
    setLoading(true)
    const result = await authClient
      .sendVerificationEmail({ email, callbackURL: webCallbackUrl('/workspace') })
      .catch(() => ({ error: true }))
    setLoading(false)
    setMessage(
      result.error
        ? 'Aguarde alguns minutos e tente novamente.'
        : 'Se o endereço puder receber mensagens, um novo link foi enviado.',
    )
  }

  return (
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">Confirme seu e-mail</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">{email || 'Seu endereço de e-mail'}</p>
          <Button onClick={resend} disabled={loading}>
            {loading ? 'Enviando…' : 'Reenviar confirmação'}
          </Button>
        </CardContent>
        <CardFooter>
          <Link
            to="/auth/login"
            className="mx-auto text-sm underline underline-offset-4 hover:text-primary"
          >
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
