import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/automations/$automationId/activity')({
  component: AutomationActivityRoutePage,
})

function AutomationActivityRoutePage() {
  return (
    <div
      className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center"
      data-testid="automation-activity-tab"
    >
      <h4 className="text-sm font-semibold">Atividade de execuções</h4>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        O histórico de execuções e interações da automação será exibido aqui após os primeiros
        testes.
      </p>
    </div>
  )
}
