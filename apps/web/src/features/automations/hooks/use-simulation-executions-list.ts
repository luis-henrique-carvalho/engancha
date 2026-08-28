import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  ExecutionStatus,
  SimulationExecutionListQuery,
  SimulationExecutionResponse,
} from '@engancha/contracts'
import type { ActivityFilters } from '../data/activity-filter-options'
import { SimulationsApi } from '../services/simulations-api'

const TERMINAL_STATUSES: ExecutionStatus[] = ['COMPLETED', 'IGNORED', 'FAILED']

export interface UseSimulationExecutionsListOptions {
  automationId?: string
  query?: string
  filters?: ActivityFilters
  page?: number
  limit?: number
}

function useSimulationStreamsPool(params: {
  onUpdate: (item: SimulationExecutionResponse) => void
}) {
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false)
  const activeStreamsRef = useRef<Map<string, EventSource>>(new Map())
  const onUpdateRef = useRef(params.onUpdate)
  onUpdateRef.current = params.onUpdate

  const closeAllStreams = useCallback(() => {
    for (const [, es] of activeStreamsRef.current.entries()) {
      es.close()
    }
    activeStreamsRef.current.clear()
  }, [])

  const closeStreamForExecution = useCallback((id: string) => {
    const es = activeStreamsRef.current.get(id)
    if (es) {
      es.close()
      activeStreamsRef.current.delete(id)
    }
  }, [])

  const startStreamForExecution = useCallback((id: string) => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      return
    }
    if (activeStreamsRef.current.has(id)) {
      return
    }

    const url = SimulationsApi.getEventsUrl(id)
    const es = new EventSource(url, { withCredentials: true })
    activeStreamsRef.current.set(id, es)

    const handleEvent = (event: Event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data)
        if (parsed?.data) {
          onUpdateRef.current(parsed.data)
        }
      } catch {
        // ignore
      }
    }

    es.addEventListener('snapshot', handleEvent)
    es.addEventListener('update', handleEvent)

    es.onerror = () => {
      setIsReconnecting(true)
      SimulationsApi.getExecution(id)
        .then((latest) => {
          setIsReconnecting(false)
          if (latest) onUpdateRef.current(latest)
        })
        .catch(() => {})
    }
  }, [])

  return {
    isReconnecting,
    closeAllStreams,
    closeStreamForExecution,
    startStreamForExecution,
  }
}

function buildSerializedFilters(
  options?: UseSimulationExecutionsListOptions,
): Partial<SimulationExecutionListQuery> {
  const params: Partial<SimulationExecutionListQuery> = {
    limit: options?.limit ?? 20,
  }

  if (options?.page) params.page = options.page
  if (options?.automationId) params.automationId = options.automationId
  if (options?.query) params.query = options.query
  if (options?.filters?.status?.length) params.status = options.filters.status
  if (options?.filters?.provider?.length) params.provider = options.filters.provider
  if (options?.filters?.mode?.length) params.mode = options.filters.mode
  if (options?.filters?.contentType?.length) params.contentType = options.filters.contentType
  if (options?.filters?.outputType?.length) params.outputType = options.filters.outputType

  return params
}

interface UseSimulationExecutionsFetcherParams {
  options?: UseSimulationExecutionsListOptions
  startStreamForExecution: (id: string) => void
  closeAllStreams: () => void
  updateExecutionInList: (item: SimulationExecutionResponse) => void
  executions: SimulationExecutionResponse[]
  setExecutions: React.Dispatch<React.SetStateAction<SimulationExecutionResponse[]>>
}

interface FetcherBaseParams {
  serializedFilters: Partial<SimulationExecutionListQuery>
  page: number
  limit: number
  startStreamForExecution: (id: string) => void
  closeAllStreams: () => void
  setExecutions: React.Dispatch<React.SetStateAction<SimulationExecutionResponse[]>>
}

function resolveExecutionMeta(
  itemsCount: number,
  page: number,
  limit: number,
  meta?: { page: number; limit: number; total: number; totalPages: number },
) {
  return (
    meta ?? {
      page,
      limit,
      total: itemsCount,
      totalPages: Math.max(1, Math.ceil(itemsCount / limit)),
    }
  )
}

function useSimulationExecutionsQuery(params: FetcherBaseParams) {
  const { serializedFilters, page, limit, startStreamForExecution, closeAllStreams, setExecutions } = params
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number; totalPages: number }>({
    page,
    limit,
    total: 0,
    totalPages: 1,
  })

  const attachStreams = useCallback(
    (items: SimulationExecutionResponse[]) => {
      for (const item of items) {
        if (!TERMINAL_STATUSES.includes(item.status)) {
          startStreamForExecution(item.id)
        }
      }
    },
    [startStreamForExecution],
  )

  const fetchInitial = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    closeAllStreams()
    try {
      const res = await SimulationsApi.listExecutions(serializedFilters)
      setExecutions(res.items)
      setNextCursor(res.nextCursor)
      setHasMore(res.hasMore)
      setMeta(resolveExecutionMeta(res.items.length, page, limit, res.meta))
      attachStreams(res.items)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Falha ao carregar histórico de atividades'))
    } finally {
      setIsLoading(false)
    }
  }, [serializedFilters, page, limit, closeAllStreams, attachStreams, setExecutions])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const res = await SimulationsApi.listExecutions(serializedFilters)
      setExecutions(res.items)
      setNextCursor(res.nextCursor)
      setHasMore(res.hasMore)
      if (res.meta) setMeta(res.meta)
      attachStreams(res.items)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Falha ao atualizar atividades'))
    } finally {
      setIsRefreshing(false)
    }
  }, [serializedFilters, attachStreams, setExecutions])

  useEffect(() => {
    void fetchInitial()
    return () => {
      closeAllStreams()
    }
  }, [fetchInitial, closeAllStreams])

  return {
    isLoading,
    isRefreshing,
    error,
    nextCursor,
    setNextCursor,
    hasMore,
    setHasMore,
    meta,
    refresh,
    attachStreams,
  }
}

function useSimulationExecutionsPagination(params: {
  serializedFilters: Partial<SimulationExecutionListQuery>
  nextCursor: string | null
  setNextCursor: React.Dispatch<React.SetStateAction<string | null>>
  hasMore: boolean
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>
  attachStreams: (items: SimulationExecutionResponse[]) => void
  setExecutions: React.Dispatch<React.SetStateAction<SimulationExecutionResponse[]>>
  setError: React.Dispatch<React.SetStateAction<Error | null>>
}) {
  const {
    serializedFilters,
    nextCursor,
    setNextCursor,
    hasMore,
    setHasMore,
    attachStreams,
    setExecutions,
    setError,
  } = params
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const res = await SimulationsApi.listExecutions({
        ...serializedFilters,
        cursor: nextCursor,
      })
      setExecutions((prev) => {
        const existingIds = new Set(prev.map((e) => e.id))
        const newItems = res.items.filter((item) => !existingIds.has(item.id))
        return [...prev, ...newItems]
      })
      setNextCursor(res.nextCursor)
      setHasMore(res.hasMore)
      attachStreams(res.items)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Falha ao carregar mais atividades'))
    } finally {
      setIsLoadingMore(false)
    }
  }, [nextCursor, isLoadingMore, hasMore, serializedFilters, attachStreams, setExecutions, setNextCursor, setHasMore, setError])

  return { isLoadingMore, loadMore }
}

function useSimulationExecutionRetry(params: {
  startStreamForExecution: (id: string) => void
  updateExecutionInList: (item: SimulationExecutionResponse) => void
  setExecutions: React.Dispatch<React.SetStateAction<SimulationExecutionResponse[]>>
  setError: React.Dispatch<React.SetStateAction<Error | null>>
}) {
  const { startStreamForExecution, updateExecutionInList, setExecutions, setError } = params
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const retry = useCallback(
    async (executionId: string) => {
      setRetryingId(executionId)
      setError(null)
      try {
        const res = await SimulationsApi.retryExecution(executionId)
        setExecutions((prev) =>
          prev.map((item) =>
            item.id === executionId
              ? {
                  ...item,
                  status: 'PENDING',
                  attempts: item.attempts + 1,
                  error: null,
                  stateVersion: (item.stateVersion ?? 1) + 1,
                }
              : item,
          ),
        )
        startStreamForExecution(res.executionId)
        const fresh = await SimulationsApi.getExecution(executionId)
        updateExecutionInList(fresh)
        return res
      } catch (err) {
        const parsedErr =
          err instanceof Error ? err : new Error('Não foi possível reprocessar a interação')
        setError(parsedErr)
        throw parsedErr
      } finally {
        setRetryingId(null)
      }
    },
    [startStreamForExecution, updateExecutionInList, setExecutions, setError],
  )

  return { retryingId, retry }
}

function useSimulationExecutionsFetcher({
  options,
  startStreamForExecution,
  closeAllStreams,
  updateExecutionInList,
  setExecutions,
}: UseSimulationExecutionsFetcherParams) {
  const page = options?.page ?? 1
  const limit = options?.limit ?? 20

  const serializedFilters = useMemo(() => buildSerializedFilters(options), [
    options?.automationId,
    options?.query,
    options?.filters?.status,
    options?.filters?.provider,
    options?.filters?.mode,
    options?.filters?.contentType,
    options?.filters?.outputType,
    page,
    limit,
  ])

  const {
    isLoading,
    isRefreshing,
    error,
    nextCursor,
    setNextCursor,
    hasMore,
    setHasMore,
    meta,
    refresh,
    attachStreams,
  } = useSimulationExecutionsQuery({
    serializedFilters,
    page,
    limit,
    startStreamForExecution,
    closeAllStreams,
    setExecutions,
  })

  const [paginationError, setPaginationError] = useState<Error | null>(null)

  const { isLoadingMore, loadMore } = useSimulationExecutionsPagination({
    serializedFilters,
    nextCursor,
    setNextCursor,
    hasMore,
    setHasMore,
    attachStreams,
    setExecutions,
    setError: setPaginationError,
  })

  const [retryError, setRetryError] = useState<Error | null>(null)

  const { retryingId, retry } = useSimulationExecutionRetry({
    startStreamForExecution,
    updateExecutionInList,
    setExecutions,
    setError: setRetryError,
  })

  return {
    meta,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error: error || paginationError || retryError,
    hasMore,
    retryingId,
    loadMore,
    refresh,
    retry,
  }
}

export function useSimulationExecutionsList(options?: UseSimulationExecutionsListOptions) {
  const automationId = options?.automationId
  const [executions, setExecutions] = useState<SimulationExecutionResponse[]>([])

  const {
    isReconnecting,
    closeAllStreams,
    closeStreamForExecution,
    startStreamForExecution,
  } = useSimulationStreamsPool({
    onUpdate: (item) => updateExecutionInList(item),
  })

  const updateExecutionInList = useCallback(
    (item: SimulationExecutionResponse) => {
      setExecutions((prev) => {
        const index = prev.findIndex((e) => e.id === item.id)
        if (index >= 0) {
          const existing = prev[index]
          if ((item.stateVersion ?? 0) >= (existing.stateVersion ?? 0)) {
            const next = [...prev]
            next[index] = item
            return next
          }
          return prev
        }
        if (
          !automationId ||
          item.automation?.id === automationId ||
          item.originAutomationId === automationId
        ) {
          return [item, ...prev]
        }
        return prev
      })

      if (TERMINAL_STATUSES.includes(item.status)) {
        closeStreamForExecution(item.id)
      }
    },
    [automationId, closeStreamForExecution],
  )

  const {
    meta,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    retryingId,
    loadMore,
    refresh,
    retry,
  } = useSimulationExecutionsFetcher({
    options,
    startStreamForExecution,
    closeAllStreams,
    updateExecutionInList,
    executions,
    setExecutions,
  })

  return {
    executions,
    meta,
    isLoading,
    isLoadingMore,
    isRefreshing,
    isReconnecting,
    error,
    hasMore,
    retryingId,
    loadMore,
    refresh,
    retry,
    updateExecutionInList,
  }
}
