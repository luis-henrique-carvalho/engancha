import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { User } from '../data/schema'
import { UserStatusBadge } from './users-columns'

type DataTableProps = {
  data: User[]
  isLoading: boolean
}

export function UsersTable({ data, isLoading }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pessoa</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3}>
                <Skeleton className="h-9 w-full" />
              </TableCell>
            </TableRow>
          ) : data.length ? (
            data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>
                  <UserStatusBadge user={user} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                Ainda não há membros ou convites pendentes.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
