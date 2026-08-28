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
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  return (
    <AuthLayout>
      <Card className="max-w-sm gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">Criar conta</CardTitle>
          <CardDescription>
            Você receberá um link para confirmar seu endereço. Já tem acesso?{' '}
            <Link
              to="/auth/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Entrar
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
        <CardFooter>
          <p className="w-full text-center text-sm text-muted-foreground">
            Ao criar sua conta, você concorda com nossos termos de uso.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
