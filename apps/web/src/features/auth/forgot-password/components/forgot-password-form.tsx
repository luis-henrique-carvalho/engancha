import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2 } from 'lucide-react'
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

const formSchema = z.object({
  email: z.email({
    error: (issue) => (issue.input === '' ? 'Informe seu e-mail.' : 'Informe um e-mail válido.'),
  }),
})

export function ForgotPasswordForm({ className, ...props }: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    await authClient
      .requestPasswordReset({
        email: data.email,
        redirectTo: webCallbackUrl('/auth/reset-password'),
      })
      .catch(() => undefined)
    setIsLoading(false)
    setMessage('Se este endereço estiver cadastrado, você receberá instruções em alguns instantes.')
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-2', className)}
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
        {message && (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        )}
        <Button className="mt-2" disabled={isLoading}>
          Enviar instruções
          {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        </Button>
      </form>
    </Form>
  )
}
