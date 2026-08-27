import { Separator } from '@/components/ui/separator'

interface AutomationStepSectionProps {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AutomationStepSection({
  title,
  description,
  children,
  footer,
}: AutomationStepSectionProps) {
  return (
    <div className="flex flex-1 flex-col space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Separator />

      <div className="w-full max-w-2xl">{children}</div>

      {footer && (
        <>
          <Separator className="mt-8" />
          <div className="flex items-center justify-end gap-3 pt-2">{footer}</div>
        </>
      )}
    </div>
  )
}
