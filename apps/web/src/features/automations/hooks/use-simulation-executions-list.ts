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

export function useSimulationExecutionsList(options?: UseSimulationExecutionsListOptions) {
  const automationId = options?.automationId
  const query = options?.query
  const filters = options?.filters
  const page = options?.page ?? 1
  const limit = options?.limit ?? 20

  const [executions, setExecutions] = useState<SimulationExecutionResponse[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [meta, setMeta] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  }>({
    page,
    limit,
    total: 0,
    totalPages: 1,
  })

  const activeStreamsRef = useRef<Map<string, EventSource>>(new Map())

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

  const startStreamForExecution = useCallback(
    (id: string) => {
      if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
        return
      }

      if (activeStreamsRef.current.has(id)) {
        return
      }

      const url = SimulationsApi.getEventsUrl(id)
      const es = new EventSource(url, { withCredentials: true })
      activeStreamsRef.current.set(id, es)

      es.addEventListener('snapshot', (event) => {
        try {
          const parsed = JSON.parse((event as MessageEvent).data)
          if (parsed?.data) {
            updateExecutionInList(parsed.data)
          }
        } catch {
          // ignore
        }
      })

      es.addEventListener('update', (event) => {
        try {
          const parsed = JSON.parse((event as MessageEvent).data)
          if (parsed?.data) {
            updateExecutionInList(parsed.data)
          }
        } catch {
          // ignore
        }
      })

      es.onerror = () => {
        setIsReconnecting(true)
        try {
          const promise = SimulationsApi.getExecution(id)
          if (promise && typeof promise.then === 'function') {
            promise
              .then((latest) => {
                setIsReconnecting(false)
                if (latest) {
                  updateExecutionInList(latest)
                }
              })
              .catch(() => {
                // Keep stream or wait
              })
          }
        } catch {
          // ignore
        }
      }
    },
    [updateExecutionInList],
  )

  const serializedFilters: SimulationExecutionListQuery = useMemo(() => {
    const params: SimulationExecutionListQuery = {
      page,
      limit,
    }
    if (automationId) params.automationId = automationId
    if (query) params.query = query
    if (filters?.status?.length) params.status = filters.status
    if (filters?.provider?.length) params.provider = filters.provider
    if (filters?.mode?.length) params.mode = filters.mode
    if (filters?.contentType?.length) params.contentType = filters.contentType
    if (filters?.outputType?.length) params.outputType = filters.outputType
    return params
  }, [
    automationId,
    query,
    filters?.status,
    filters?.provider,
    filters?.mode,
    filters?.contentType,
    filters?.outputType,
    page,
    limit,
  ])

  const fetchInitial = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    closeAllStreams()

    try {
      const res = await SimulationsApi.listExecutions(serializedFilters)

      setExecutions(res.items)
      setNextCursor(res.nextCursor)
      setHasMore(res.hasMore)
      if (res.meta) {
        setMeta(res.meta)
      } else {
        setMeta({
          page,
          limit,
          total: res.items.length,
          totalPages: Math.max(1, Math.ceil(res.items.length / limit)),
        })
      }

      for (const item of res.items) {
        if (!TERMINAL_STATUSES.includes(item.status)) {
          startStreamForExecution(item.id)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Falha ao carregar histórico de atividades'))
    } finally {
      setIsLoading(false)
    }
  }, [serializedFilters, page, limit, closeAllStreams, startStreamForExecution])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      const res = await SimulationsApi.listExecutions(serializedFilters)

      setExecutions(res.items)
      setNextCursor(res.nextCursor)
      setHasMore(res.hasMore)
      if (res.meta) {
        setMeta(res.meta)
      }

      for (const item of res.items) {
        if (!TERMINAL_STATUSES.includes(item.status)) {
          startStreamForExecution(item.id)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Falha ao atualizar atividades'))
    } finally {
      setIsRefreshing(false)
    }
  }, [serializedFilters, startStreamForExecution])

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

      for (const item of res.items) {
        if (!TERMINAL_STATUSES.includes(item.status)) {
          startStreamForExecution(item.id)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Falha ao carregar mais atividades'))
    } finally {
      setIsLoadingMore(false)
    }
  }, [nextCursor, isLoadingMore, hasMore, serializedFilters, startStreamForExecution])

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
    [startStreamForExecution, updateExecutionInList],
  )

  useEffect(() => {
    void fetchInitial()

    return () => {
      closeAllStreams()
    }
  }, [fetchInitial, closeAllStreams])

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
