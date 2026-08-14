import { Badge } from '#/components/ui/badge'
import type { User } from '../data/schema'

export function UserStatusBadge({ user }: { user: User }) {
  return <Badge variant="outline">{user.status === 'invited' ? 'Convite pendente' : 'Ativo'}</Badge>
}
