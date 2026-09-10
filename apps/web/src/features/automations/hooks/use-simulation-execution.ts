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

interface UseSimulationSseParams {
  onUpdate: (data: SimulationExecutionResponse) => void
}

function useSimulationSse({ onUpdate }: UseSimulationSseParams) {
  const [connectionStatus, setConnectionStatus] = useState<SseConnectionStatus>('idle')
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const startStream = useCallback(
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

      const handleEvent = (event: Event) => {
        try {
          const parsed = JSON.parse((event as MessageEvent).data)
          if (parsed?.data) {
            onUpdateRef.current(parsed.data)
          }
        } catch {
          // ignore parsing error on stream
        }
      }

      es.addEventListener('snapshot', handleEvent)
      es.addEventListener('update', handleEvent)

      es.onerror = () => {
        setConnectionStatus('reconnecting')
        setIsReconnecting(true)

        SimulationsApi.getExecution(id)
          .then((latest) => {
            if (latest) onUpdateRef.current(latest)
          })
          .catch(() => {})
      }
    },
    [closeStream],
  )

  const markClosed = useCallback(() => {
    closeStream()
    setConnectionStatus('closed')
    setIsReconnecting(false)
  }, [closeStream])

  const resetStream = useCallback(() => {
    closeStream()
    setConnectionStatus('idle')
    setIsReconnecting(false)
  }, [closeStream])

  return {
    connectionStatus,
    isReconnecting,
    startStream,
    closeStream,
    markClosed,
    resetStream,
  }
}

interface UseSimulationExecutionActionsParams {
  executionId: string | null
  setExecutionId: React.Dispatch<React.SetStateAction<string | null>>
  setExecution: React.Dispatch<React.SetStateAction<SimulationExecutionResponse | null>>
  updateExecutionIfNewer: (data?: SimulationExecutionResponse | null) => void
  startStream: (id: string) => void
  resetStream: () => void
}

function buildSimulationCommentPayload(
  payload: Omit<SimulationCommentRequest, 'idempotencyKey'> & { idempotencyKey?: string },
): SimulationCommentRequest {
  const key = payload.idempotencyKey || crypto.randomUUID()
  return {
    contentId: payload.contentId,
    provider: payload.provider,
    author: payload.author,
    text: payload.text,
    commentId: payload.commentId || undefined,
    idempotencyKey: key,
    originAutomationId: payload.originAutomationId ?? undefined,
  }
}

function useSimulationCommentSubmit(
  setExecutionId: React.Dispatch<React.SetStateAction<string | null>>,
  setError: React.Dispatch<React.SetStateAction<Error | null>>,
) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const submitComment = useCallback(
    async (
      payload: Omit<SimulationCommentRequest, 'idempotencyKey'> & { idempotencyKey?: string },
    ) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const res = await SimulationsApi.submitComment(buildSimulationCommentPayload(payload))
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
    [setExecutionId, setError],
  )

  return { isSubmitting, submitComment }
}

function useSimulationRetry(
  executionId: string | null,
  loadExecution: (id: string) => Promise<void>,
  setError: React.Dispatch<React.SetStateAction<Error | null>>,
) {
  const [isRetrying, setIsRetrying] = useState<boolean>(false)

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
  }, [executionId, loadExecution, setError])

  return { isRetrying, retry }
}

function useSimulationExecutionActions({
  executionId,
  setExecutionId,
  setExecution,
  updateExecutionIfNewer,
  startStream,
  resetStream,
}: UseSimulationExecutionActionsParams) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const loadExecution = useCallback(
    async (id: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await SimulationsApi.getExecution(id)
        updateExecutionIfNewer(data)
        if (!TERMINAL_STATUSES.includes(data.status)) {
          startStream(id)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Falha ao carregar simulação'))
      } finally {
        setIsLoading(false)
      }
    },
    [startStream, updateExecutionIfNewer],
  )

  const { isSubmitting, submitComment } = useSimulationCommentSubmit(setExecutionId, setError)
  const { isRetrying, retry } = useSimulationRetry(executionId, loadExecution, setError)

  const reset = useCallback(() => {
    resetStream()
    setExecutionId(null)
    setExecution(null)
    setError(null)
  }, [resetStream, setExecution, setExecutionId])

  return {
    isLoading,
    isSubmitting,
    isRetrying,
    error,
    loadExecution,
    submitComment,
    retry,
    reset,
  }
}

export function useSimulationExecution(options?: UseSimulationExecutionOptions) {
  const [executionId, setExecutionId] = useState<string | null>(options?.initialExecutionId ?? null)
  const [execution, setExecution] = useState<SimulationExecutionResponse | null>(null)
  const onTerminalStateRef = useRef(options?.onTerminalState)
  onTerminalStateRef.current = options?.onTerminalState

  const { connectionStatus, isReconnecting, startStream, closeStream, markClosed, resetStream } =
    useSimulationSse({
      onUpdate: (data) => updateExecutionIfNewer(data),
    })

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
        markClosed()
        onTerminalStateRef.current?.(data)
      }
    },
    [markClosed],
  )

  const { isLoading, isSubmitting, isRetrying, error, loadExecution, submitComment, retry, reset } =
    useSimulationExecutionActions({
      executionId,
      setExecutionId,
      setExecution,
      updateExecutionIfNewer,
      startStream,
      resetStream,
    })

  useEffect(() => {
    if (executionId) {
      void loadExecution(executionId)
    } else {
      resetStream()
      setExecution(null)
    }
    return () => {
      closeStream()
    }
  }, [executionId, loadExecution, closeStream, resetStream])

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
