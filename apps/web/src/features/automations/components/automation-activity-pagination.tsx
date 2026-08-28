import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, getPageNumbers } from '@/lib/utils'

export interface AutomationActivityPaginationProps {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (limit: number) => void
  className?: string
}

export function AutomationActivityPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  className,
}: AutomationActivityPaginationProps) {
  const currentPage = Math.max(1, page)
  const safeTotalPages = Math.max(1, totalPages)
  const pageNumbers = getPageNumbers(currentPage, safeTotalPages)

  return (
    <div
      className={cn(
        'flex items-center justify-between overflow-clip px-2',
        '@max-2xl/content:flex-col-reverse @max-2xl/content:gap-4',
        className,
      )}
      style={{ overflowClipMargin: 1 }}
      data-testid="activity-pagination"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex w-25 items-center justify-center text-xs font-medium text-muted-foreground @2xl/content:hidden">
          Página {currentPage} de {safeTotalPages} ({total} itens)
        </div>

        <div className="flex items-center gap-2 @max-2xl/content:flex-row-reverse">
          <Select
            value={`${limit}`}
            onValueChange={(value) => {
              onPageSizeChange(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-17.5 text-xs" data-testid="activity-page-size-trigger">
              <SelectValue placeholder={limit} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="hidden text-xs font-medium text-muted-foreground sm:block">
            Itens por página
          </p>
        </div>
      </div>

      <div className="flex items-center sm:space-x-6 lg:space-x-8">
        <div className="flex w-36 items-center justify-center text-xs font-medium text-muted-foreground @max-3xl/content:hidden">
          Página {currentPage} de {safeTotalPages} ({total} itens)
        </div>

        <div className="flex items-center space-x-1.5">
          <Button
            variant="outline"
            className="size-8 p-0 @max-md/content:hidden"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            data-testid="activity-first-page-button"
          >
            <span className="sr-only">Primeira página</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            data-testid="activity-prev-page-button"
          >
            <span className="sr-only">Página anterior</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {pageNumbers.map((pageNumber, index) => (
            <div key={`${pageNumber}-${index}`} className="flex items-center">
              {pageNumber === '...' ? (
                <span className="px-1 text-xs text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                  className="h-8 min-w-8 px-2 text-xs"
                  onClick={() => onPageChange(pageNumber as number)}
                  data-testid={`activity-page-${pageNumber}-button`}
                >
                  <span className="sr-only">Página {pageNumber}</span>
                  {pageNumber}
                </Button>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= safeTotalPages}
            data-testid="activity-next-page-button"
          >
            <span className="sr-only">Próxima página</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="size-8 p-0 @max-md/content:hidden"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={currentPage >= safeTotalPages}
            data-testid="activity-last-page-button"
          >
            <span className="sr-only">Última página</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
