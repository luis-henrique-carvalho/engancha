import { Bot, Contact, LayoutDashboard, MessageSquare, UserCheck, UsersRound } from 'lucide-react'
import type { ActiveWorkspaceResponse } from '@engancha/contracts'
import type { SidebarData, User } from '../types'

type SidebarDataInput = {
  user: User
  workspace: ActiveWorkspaceResponse
}

export function createSidebarData({ user, workspace }: SidebarDataInput): SidebarData {
  return {
    user,
    workspace,
    navGroups: [
      {
        title: 'Produto',
        items: [
          {
            title: 'Workspace',
            url: '/workspace',
            icon: LayoutDashboard,
          },
          {
            title: 'Automações',
            url: '/automations',
            icon: Bot,
          },
          {
            title: 'Conversas',
            url: '/conversations',
            icon: MessageSquare,
          },
          {
            title: 'Contatos',
            url: '/contacts',
            icon: Contact,
          },
          {
            title: 'Leads',
            url: '/leads',
            icon: UserCheck,
          },
          {
            title: 'Pessoas',
            url: '/users',
            icon: UsersRound,
          },
        ],
      },
    ],
  }
}
