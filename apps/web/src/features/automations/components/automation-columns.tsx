import type { ColumnDef } from '@tanstack/react-table'
import type { AutomationResponse } from '@engancha/contracts'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { AutomationStatusBadge } from './automation-status-badge'
import { AutomationRowActions } from './automation-row-actions'

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateString
  }
}

export function createAutomationColumns(
  workspaceId?: string,
): ColumnDef<AutomationResponse>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => {
        const name = row.original.current?.name?.trim() || 'Rascunho sem nome'
        return (
          <span className="font-medium text-foreground" data-testid="automation-name">
            {name}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <AutomationStatusBadge
          status={row.original.status}
          hasUnpublishedChanges={row.original.hasUnpublishedChanges}
        />
      ),
      enableSorting: false,
    },
    {
      id: 'target',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Conteúdo" />,
      cell: ({ row }) => {
        const title = row.original.current?.target?.title || '—'
        return (
          <span className="text-muted-foreground truncate max-w-[200px] inline-block" title={title}>
            {title}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: 'keyword',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Palavra-chave" />,
      cell: ({ row }) => {
        const keyword = row.original.current?.keyword || '—'
        return <span className="text-muted-foreground">{keyword}</span>
      },
      enableSorting: false,
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Atualização" />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'executionCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Execuções" />,
      cell: ({ row }) => (
        <span className="text-sm font-mono text-center block w-full">
          {row.original.executionCount}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'leadCount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Leads" />,
      cell: ({ row }) => (
        <span className="text-sm font-mono text-center block w-full">{row.original.leadCount}</span>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <AutomationRowActions automation={row.original} workspaceId={workspaceId} />
      ),
    },
  ]
}

export const automationColumns: ColumnDef<AutomationResponse>[] = createAutomationColumns()
