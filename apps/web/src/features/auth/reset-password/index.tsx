import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '../auth-layout'

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const token = new URLSearchParams(window.location.search).get('token') ?? ''
    const result = await authClient
      .resetPassword({ newPassword: password, token })
      .catch(() => ({ error: true }))
    setLoading(false)
    if (result.error) {
      setError('Este link não é válido ou expirou.')
      return
    }
    setMessage('Senha atualizada. Redirecionando para o login…')
    setTimeout(() => void navigate({ to: '/auth/login' }), 700)
  }
  return (
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">Definir nova senha</CardTitle>
          <CardDescription>Escolha uma senha segura para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <Label htmlFor="reset-password" className="grid gap-2">
              Nova senha
              <Input
                id="reset-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </Label>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-muted-foreground" role="status">
                {message}
              </p>
            )}
            <Button disabled={loading}>{loading ? 'Salvando…' : 'Atualizar senha'}</Button>
          </form>
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
