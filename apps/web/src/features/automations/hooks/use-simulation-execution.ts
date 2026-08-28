import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ExecutionStatus,
  SimulationCommentRequest,
  SimulationExecutionResponse,
} from '@engancha/contracts'
import { SimulationsApi } from '../services/simulations-api'

export type SseConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'closed'
  | 'error'

const TERMINAL_STATUSES: ExecutionStatus[] = ['COMPLETED', 'IGNORED', 'FAILED']

export interface UseSimulationExecutionOptions {
  initialExecutionId?: string | null
  onTerminalState?: (execution: SimulationExecutionResponse) => void
}

export function useSimulationExecution(options?: UseSimulationExecutionOptions) {
  const [executionId, setExecutionId] = useState<string | null>(options?.initialExecutionId ?? null)
  const [execution, setExecution] = useState<SimulationExecutionResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isRetrying, setIsRetrying] = useState<boolean>(false)
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false)
  const [connectionStatus, setConnectionStatus] = useState<SseConnectionStatus>('idle')
  const [error, setError] = useState<Error | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const executionRef = useRef<SimulationExecutionResponse | null>(null)
  executionRef.current = execution

  const onTerminalStateRef = useRef(options?.onTerminalState)
  onTerminalStateRef.current = options?.onTerminalState

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const handleTerminalState = useCallback(
    (data: SimulationExecutionResponse) => {
      closeStream()
      setConnectionStatus('closed')
      setIsReconnecting(false)
      onTerminalStateRef.current?.(data)
    },
    [closeStream],
  )

  const updateExecutionIfNewer = useCallback(
    (data?: SimulationExecutionResponse | null) => {
      if (!data || typeof data !== 'object') return

      setExecution((prev) => {
        if (!prev || (data.stateVersion ?? 0) >= (prev.stateVersion ?? 0)) {
          return data
        }
        return prev
      })

      if (TERMINAL_STATUSES.includes(data.status)) {
        handleTerminalState(data)
      }
    },
    [handleTerminalState],
  )

  const startSseStream = useCallback(
    (id: string) => {
      closeStream()

      if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
        return
      }

      setConnectionStatus('connecting')
      const url = SimulationsApi.getEventsUrl(id)
      const es = new EventSource(url, { withCredentials: true })
      eventSourceRef.current = es

      es.onopen = () => {
        setConnectionStatus('connected')
        setIsReconnecting(false)
      }

      es.addEventListener('snapshot', (event) => {
        try {
          const parsed = JSON.parse((event as MessageEvent).data)
          if (parsed?.data) {
            updateExecutionIfNewer(parsed.data)
          }
        } catch {
          // ignore parsing error on stream
        }
      })

      es.addEventListener('update', (event) => {
        try {
          const parsed = JSON.parse((event as MessageEvent).data)
          if (parsed?.data) {
            updateExecutionIfNewer(parsed.data)
          }
        } catch {
          // ignore parsing error on stream
        }
      })

      es.onerror = () => {
        setConnectionStatus('reconnecting')
        setIsReconnecting(true)

        // Fallback: authoritative HTTP GET reload
        SimulationsApi.getExecution(id)
          .then((latest) => {
            updateExecutionIfNewer(latest)
          })
          .catch(() => {
            // Keep connection attempt
          })
      }
    },
    [closeStream, updateExecutionIfNewer],
  )

  const loadExecution = useCallback(
    async (id: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await SimulationsApi.getExecution(id)
        updateExecutionIfNewer(data)
        if (!TERMINAL_STATUSES.includes(data.status)) {
          startSseStream(id)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Falha ao carregar simulação'))
      } finally {
        setIsLoading(false)
      }
    },
    [startSseStream, updateExecutionIfNewer],
  )

  useEffect(() => {
    if (executionId) {
      void loadExecution(executionId)
    } else {
      closeStream()
      setExecution(null)
      setConnectionStatus('idle')
      setIsReconnecting(false)
    }

    return () => {
      closeStream()
    }
  }, [executionId, loadExecution, closeStream])

  const submitComment = useCallback(
    async (
      payload: Omit<SimulationCommentRequest, 'idempotencyKey'> & { idempotencyKey?: string },
    ) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const key = payload.idempotencyKey || crypto.randomUUID()
        const requestPayload: SimulationCommentRequest = {
          contentId: payload.contentId,
          provider: payload.provider,
          author: payload.author,
          text: payload.text,
          commentId: payload.commentId || undefined,
          idempotencyKey: key,
        }

        const res = await SimulationsApi.submitComment(requestPayload)
        setExecutionId(res.executionId)
        return res
      } catch (err) {
        const parsedErr =
          err instanceof Error ? err : new Error('Não foi possível enviar o comentário')
        setError(parsedErr)
        throw parsedErr
      } finally {
        setIsSubmitting(false)
      }
    },
    [],
  )

  const retry = useCallback(async () => {
    if (!executionId) return

    setIsRetrying(true)
    setError(null)
    try {
      const res = await SimulationsApi.retryExecution(executionId)
      await loadExecution(res.executionId)
      return res
    } catch (err) {
      const parsedErr =
        err instanceof Error ? err : new Error('Não foi possível reprocessar a simulação')
      setError(parsedErr)
      throw parsedErr
    } finally {
      setIsRetrying(false)
    }
  }, [executionId, loadExecution])

  const reset = useCallback(() => {
    closeStream()
    setExecutionId(null)
    setExecution(null)
    setError(null)
    setConnectionStatus('idle')
    setIsReconnecting(false)
  }, [closeStream])

  return {
    executionId,
    execution,
    isLoading,
    isSubmitting,
    isRetrying,
    isReconnecting,
    connectionStatus,
    error,
    submitComment,
    retry,
    reset,
    setExecutionId,
  }
}
