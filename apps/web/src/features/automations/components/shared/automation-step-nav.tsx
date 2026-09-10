import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AUTOMATION_STEPS } from '../../data/automation-steps'

interface AutomationStepNavProps {
  automationId: string
  className?: string
}

export function AutomationStepNav({ automationId, className }: AutomationStepNavProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const currentStep =
    AUTOMATION_STEPS.find((step) => pathname.endsWith(`/${step.path}`)) ?? AUTOMATION_STEPS[0]

  const handleSelect = (stepPath: string) => {
    void (navigate as any)({
      to: `/automations/${automationId}/${stepPath}`,
    })
  }

  return (
    <>
      {/* Mobile Select */}
      <div
        className="p-1 md:hidden"
        data-testid="automation-step-nav-mobile"
      >
        <Select
          value={currentStep.path}
          onValueChange={handleSelect}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Etapa da automação" />
          </SelectTrigger>
          <SelectContent>
            {AUTOMATION_STEPS.map((step) => {
              const Icon = step.icon
              return (
                <SelectItem
                  key={step.id}
                  value={step.path}
                >
                  <div className="flex items-center gap-2.5 px-1 py-0.5">
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{step.title}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop / Tablet Navigation with Horizontal Scroll on md and Vertical List on lg */}
      <ScrollArea
        orientation="horizontal"
        type="always"
        className="hidden w-full min-w-40 bg-background px-1 py-2 md:block lg:p-0"
      >
        <nav
          className={cn('flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0', className)}
          data-testid="automation-step-nav-desktop"
        >
          {AUTOMATION_STEPS.map((step) => {
            const Icon = step.icon
            const isActive = pathname.endsWith(`/${step.path}`)
            const href = `/automations/${automationId}/${step.path}`

            return (
              <Link
                key={step.id}
                to={href as any}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  isActive
                    ? 'bg-muted font-semibold text-foreground hover:bg-muted'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  'justify-start h-10 px-3 whitespace-nowrap',
                )}
                data-testid={`step-link-${step.id}`}
              >
                <Icon
                  className={cn(
                    'mr-2.5 size-4 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="truncate">{step.title}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </>
  )
}
