import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import { userStatusStyles } from '../data/data'
import type { User } from '../data/schema'

export function UserStatusBadge({ user }: { user: User }) {
  return (
    <Badge
      variant="outline"
      className={cn('capitalize', userStatusStyles.get(user.status))}
    >
      {user.status === 'invited' ? 'Convite pendente' : 'Ativo'}
    </Badge>
  )
}

export const usersColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Pessoa',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-sm text-muted-foreground">{row.original.email}</p>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'role',
    header: 'Papel',
    cell: ({ row }) => <span className="capitalize">{row.original.role}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => <UserStatusBadge user={row.original} />,
  },
]
