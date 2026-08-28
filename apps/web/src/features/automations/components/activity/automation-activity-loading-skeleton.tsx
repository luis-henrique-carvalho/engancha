import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AutomationActivityLoadingSkeleton() {
  return (
    <div
      className="space-y-4"
      data-testid="automation-activity-loading"
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((key) => (
          <Card
            key={key}
            className="space-y-3 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-7 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3.5 w-12" />
              </div>
            </div>
            <Skeleton className="h-9 w-full rounded-md bg-muted/40" />
          </Card>
        ))}
      </div>
    </div>
  )
}
