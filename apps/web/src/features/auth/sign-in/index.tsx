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
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  return (
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">Entrar</CardTitle>
          <CardDescription>
            Use seu e-mail e senha para acessar o workspace. Ainda não tem uma conta?{' '}
            <Link
              to="/auth/register"
              className="text-nowrap underline underline-offset-4 hover:text-primary"
            >
              Criar conta
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
        <CardFooter>
          <p className="w-full text-center text-sm text-muted-foreground">
            Ao entrar, você concorda com nossos termos de uso.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
