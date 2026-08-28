import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit, Eye, MoreHorizontal, Pause } from 'lucide-react'
import type { AutomationResponse } from '@engancha/contracts'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAutomationMutations } from '../../hooks/use-automation-mutations'

interface AutomationRowActionsProps {
  automation: AutomationResponse
  workspaceId?: string
}

export function AutomationRowActions({ automation, workspaceId = '' }: AutomationRowActionsProps) {
  const navigate = useNavigate()
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false)
  const { pauseAutomation, isPausing } = useAutomationMutations(workspaceId, automation.id)

  const isArchived = automation.status === 'ARCHIVED'
  const isActive = automation.status === 'ACTIVE'

  const handleConfirmPause = async () => {
    await pauseAutomation()
    setIsPauseDialogOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex size-8 p-0 data-[state=open]:bg-muted"
            aria-label="Abrir menu de ações"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[160px]"
        >
          {!isArchived && (
            <DropdownMenuItem
              onClick={() => {
                void navigate({
                  to: '/automations/$automationId/identification',
                  params: { automationId: automation.id },
                })
              }}
            >
              <Edit className="mr-2 size-4" />
              Editar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              void navigate({
                to: '/automations/$automationId/review',
                params: { automationId: automation.id },
              })
            }}
          >
            <Eye className="mr-2 size-4" />
            Revisar
          </DropdownMenuItem>
          {isActive && (
            <DropdownMenuItem
              onClick={() => setIsPauseDialogOpen(true)}
              data-testid="automation-pause-action"
            >
              <Pause className="mr-2 size-4" />
              Pausar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={isPauseDialogOpen}
        onOpenChange={setIsPauseDialogOpen}
        title="Pausar automação"
        desc="Deseja pausar esta automação? Ela deixará de responder novos comentários e DMs imediatamente."
        confirmText="Pausar"
        cancelBtnText="Cancelar"
        destructive
        isLoading={isPausing}
        handleConfirm={handleConfirmPause}
      />
    </>
  )
}
