import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, UserPlus } from 'lucide-react'
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
  name: z.string().min(1, 'Informe seu nome.'),
  email: z.email({
    error: (issue) => (issue.input === '' ? 'Informe seu e-mail.' : 'Informe um e-mail válido.'),
  }),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
})

export function SignUpForm({ className, ...props }: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '' },
  })
  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError('')
    const result = await authClient.signUp
      .email({ ...data, callbackURL: webCallbackUrl('/workspace') })
      .catch(() => ({ error: true }))
    setIsLoading(false)
    if ('error' in result && result.error) {
      setError('Não foi possível criar a conta. Verifique os dados informados.')
      return
    }
    await navigate({ to: '/auth/verify-email', search: { email: data.email } })
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Seu nome"
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  placeholder="nome@exemplo.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="********"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <p
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        <Button
          className="mt-2"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus />}Criar conta
        </Button>
      </form>
    </Form>
  )
}
