import type { ActiveWorkspaceResponse } from '@engancha/contracts'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { createSidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import type { User } from './types'

type AppSidebarProps = {
  user: User
  workspace: ActiveWorkspaceResponse
  onWorkspaceChange: (workspace: ActiveWorkspaceResponse) => void
}

export function AppSidebar({ user, workspace, onWorkspaceChange }: AppSidebarProps) {
  const { collapsible, variant } = useLayout()
  const sidebarData = createSidebarData({ user, workspace })

  return (
    <Sidebar
      collapsible={collapsible}
      variant={variant}
    >
      <SidebarHeader>
        <TeamSwitcher
          workspace={workspace}
          onWorkspaceChange={onWorkspaceChange}
        />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup
            key={props.title}
            {...props}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
