import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { IconGmail } from '@/assets/brand-icons'
import { authClient, webCallbackUrl } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  email: z.email({
    error: (issue) => (issue.input === '' ? 'Informe seu e-mail.' : 'Informe um e-mail válido.'),
  }),
  password: z.string().min(1, 'Informe sua senha.'),
})

export function UserAuthForm({ className, ...props }: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError('')
    const result = await authClient.signIn.email(data).catch(() => ({ error: true }))
    setIsLoading(false)
    if ('error' in result && result.error) {
      setError('Não foi possível entrar. Verifique os dados ou confirme seu e-mail.')
      return
    }
    await navigate({ to: '/workspace' })
  }

  async function signInWithGoogle() {
    setError('')
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: webCallbackUrl('/workspace'),
    })
    if (result.error) setError('O acesso com Google não pôde ser concluído.')
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="nome@exemplo.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to="/auth/forgot-password"
                className="absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75"
              >
                Esqueci minha senha
              </Link>
            </FormItem>
          )}
        />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button
          className="mt-2 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}Entrar
        </Button>
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
          </div>
        </div>
        <Button variant="outline" type="button" disabled={isLoading} onClick={signInWithGoogle}>
          <IconGmail className="h-4 w-4" />
          Google
        </Button>
      </form>
    </Form>
  )
}
