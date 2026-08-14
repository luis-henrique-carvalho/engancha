import { Building2 } from 'lucide-react'
import type { ActiveWorkspaceResponse } from '@engancha/contracts'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

type TeamSwitcherProps = {
  workspace: ActiveWorkspaceResponse
}

export function TeamSwitcher({ workspace }: TeamSwitcherProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-start text-sm leading-tight">
            <span className="truncate font-semibold">{workspace.name}</span>
            <span className="truncate text-xs text-muted-foreground">Workspace ativo</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
