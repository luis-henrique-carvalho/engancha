import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Building2, ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import type { ActiveWorkspaceResponse, WorkspaceListResponse } from '@engancha/contracts'
import { apiFetch } from '@/lib/api-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { authClient } from '@/lib/auth-client'

type TeamSwitcherProps = {
  workspace: ActiveWorkspaceResponse
  onWorkspaceChange: (workspace: ActiveWorkspaceResponse) => void
}

export function TeamSwitcher({ workspace, onWorkspaceChange }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const queryClient = useQueryClient()
  const workspaces = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => apiFetch<WorkspaceListResponse>('/workspaces'),
  })
  const switchWorkspace = useMutation({
    mutationFn: async (organizationId: string) => {
      await authClient.organization.setActive({ organizationId }).catch(() => {})
      return apiFetch<ActiveWorkspaceResponse>('/workspaces/active', {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      })
    },
    onSuccess: async (nextWorkspace) => {
      onWorkspaceChange(nextWorkspace)
      await queryClient.invalidateQueries()
    },
  })
  const createWorkspace = useMutation({
    mutationFn: async (workspaceName: string) => {
      const created = await apiFetch<ActiveWorkspaceResponse>('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: workspaceName }),
      })
      await authClient.organization.setActive({ organizationId: created.id }).catch(() => {})
      return created
    },
    onSuccess: async (created) => {
      onWorkspaceChange(created)
      setName('')
      setCreateOpen(false)
      await queryClient.invalidateQueries()
    },
  })

  const submitWorkspace = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createWorkspace.mutate(name)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{workspace.name}</span>
                <span className="truncate text-xs text-muted-foreground">Workspace ativo</span>
              </div>
              <ChevronsUpDown className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Seus workspaces
            </DropdownMenuLabel>
            {workspaces.isLoading ? (
              <DropdownMenuItem disabled>
                <Loader2 className="animate-spin" /> Carregando workspaces…
              </DropdownMenuItem>
            ) : workspaces.isError ? (
              <DropdownMenuItem disabled>Não foi possível carregar workspaces.</DropdownMenuItem>
            ) : (
              workspaces.data?.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  disabled={item.id === workspace.id || switchWorkspace.isPending}
                  onSelect={() => switchWorkspace.mutate(item.id)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Building2 className="size-4 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.role}</p>
                  </div>
                  {item.id === workspace.id && <span className="text-xs">Ativo</span>}
                </DropdownMenuItem>
              ))
            )}
            {switchWorkspace.isError && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Não foi possível trocar o workspace.</DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
              <Plus /> Criar workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar workspace</DialogTitle>
            <DialogDescription>
              Você será definido como owner e este workspace passará a ser o ativo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitWorkspace} className="grid gap-4">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do workspace"
              minLength={2}
              maxLength={80}
              required
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createWorkspace.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createWorkspace.isPending}>
                {createWorkspace.isPending ? 'Criando…' : 'Criar workspace'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  )
}
