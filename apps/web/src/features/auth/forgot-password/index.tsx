import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  return (
    <AuthLayout>
      <Card className="max-w-sm gap-4 sm:min-w-sm">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">Recuperar senha</CardTitle>
          <CardDescription>
            Informe o e-mail da sua conta e enviaremos um link para redefinir a senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>
          <p className="mx-auto text-center text-sm text-balance text-muted-foreground">
            Lembrou sua senha?{' '}
            <Link to="/auth/login" className="underline underline-offset-4 hover:text-primary">
              Voltar para o login
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
