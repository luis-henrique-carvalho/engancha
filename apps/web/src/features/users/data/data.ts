import { ShieldCheck, UserRound } from 'lucide-react'
import type { User } from './schema'

export const userStatusStyles = new Map<User['status'], string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['invited', 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'],
])

export const roles = [
  {
    label: 'Owner',
    value: 'owner',
    icon: ShieldCheck,
  },
  {
    label: 'Admin',
    value: 'admin',
    icon: ShieldCheck,
  },
  {
    label: 'Membro',
    value: 'member',
    icon: UserRound,
  },
] as const
