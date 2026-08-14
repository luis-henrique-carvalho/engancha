import { createFileRoute } from '@tanstack/react-router'
import { VerifyEmail } from '@/features/auth/verify-email'

export const Route = createFileRoute('/auth/verify-email')({
  validateSearch: (search: Record<string, unknown>) => ({ email: String(search.email ?? '') }),
  component: VerifyEmailRoute,
})

function VerifyEmailRoute() {
  return <VerifyEmail email={Route.useSearch().email} />
}
