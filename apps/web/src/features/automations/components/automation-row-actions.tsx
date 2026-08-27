import { useNavigate } from '@tanstack/react-router'
import { Edit, Eye, MoreHorizontal } from 'lucide-react'
import type { AutomationResponse } from '@engancha/contracts'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AutomationRowActionsProps {
  automation: AutomationResponse
}

export function AutomationRowActions({ automation }: AutomationRowActionsProps) {
  const navigate = useNavigate()

  return (
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
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => {
            void (navigate as any)({
              to: `/automations/${automation.id}/identification`,
            })
          }}
        >
          <Edit className="mr-2 size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            void (navigate as any)({
              to: `/automations/${automation.id}/review`,
            })
          }}
        >
          <Eye className="mr-2 size-4" />
          Revisar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
