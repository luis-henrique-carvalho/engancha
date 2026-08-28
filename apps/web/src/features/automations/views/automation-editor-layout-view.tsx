import { Link, Outlet } from '@tanstack/react-router'
import { ArrowLeft, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AutomationEditorProvider } from '../components/automation-editor-provider'
import { AutomationStatusBadge } from '../components/automation-status-badge'
import { AutomationStepNav } from '../components/automation-step-nav'
import { useAutomation } from '../hooks/use-automation'

interface AutomationEditorLayoutViewProps {
  workspaceId: string
  automationId: string
  children?: React.ReactNode
}

export function AutomationEditorLayoutView({
  workspaceId,
  automationId,
  children,
}: AutomationEditorLayoutViewProps) {
  const { data: automation, isLoading, isError } = useAutomation(workspaceId, automationId)

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="automation-editor-loading">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-6 md:flex-row">
          <Skeleton className="h-64 w-full md:w-56" />
          <Skeleton className="h-96 flex-1" />
        </div>
      </div>
    )
  }

  if (isError || !automation) {
    return (
      <div
        className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
        role="alert"
        data-testid="automation-editor-not-found"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Bot className="size-7" />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">Automação não encontrada</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          A automação solicitada não existe ou não pertence a este workspace.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/automations" search={{ page: 1, limit: 20 }}>
            <ArrowLeft className="mr-2 size-4" />
            Voltar para automações
          </Link>
        </Button>
      </div>
    )
  }

  const name = automation.current?.name?.trim() || 'Rascunho de automação'

  return (
    <AutomationEditorProvider
      workspaceId={workspaceId}
      automationId={automationId}
      automation={automation}
    >
      <div className="space-y-6" data-testid="automation-editor-layout">
        {/* Editor Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild aria-label="Voltar para a listagem">
              <Link to="/automations" search={{ page: 1, limit: 20 }}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2
                  className="text-2xl font-bold tracking-tight"
                  data-testid="automation-editor-title"
                >
                  {name}
                </h2>
                <AutomationStatusBadge
                  status={automation.status}
                  hasUnpublishedChanges={automation.hasUnpublishedChanges}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Configure cada etapa antes de publicar no Instagram.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Editor Main with Guided Step Navigation */}
        <div className="flex flex-1 flex-col space-y-6 md:space-y-6 lg:flex-row lg:space-y-0 lg:space-x-8">
          <aside className="top-0 lg:sticky lg:w-60 shrink-0">
            <AutomationStepNav automationId={automationId} />
          </aside>
          <div className="flex-1 min-w-0">{children ?? <Outlet />}</div>
        </div>
      </div>
    </AutomationEditorProvider>
  )
}
