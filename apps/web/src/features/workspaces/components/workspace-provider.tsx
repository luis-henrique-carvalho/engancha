import { useRouter } from '@tanstack/react-router'
import { createContext, useContext, useEffect, useState } from 'react'
import type { ActiveWorkspaceResponse } from '@engancha/contracts'
import type { User } from '@/components/layout/types'
import { authClient } from '@/lib/auth-client'
import { ApiClientError } from '@/lib/api-client'
import { bootstrapWorkspace } from '../services/workspace-api'

type WorkspaceContextValue = {
  error?: ApiClientError | Error
  isLoading: boolean
  retry: () => void
  setWorkspace: (workspace: ActiveWorkspaceResponse) => void
  user?: User
  workspace?: ActiveWorkspaceResponse
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = authClient.useSession()
  const [workspace, setWorkspace] = useState<ActiveWorkspaceResponse>()
  const [error, setError] = useState<ApiClientError | Error>()
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (session.isPending) return

    if (!session.data?.user) {
      setWorkspace(undefined)
      setLoading(false)
      setError(new ApiClientError('Sua sessão não está disponível.', 401))
      void router.navigate({ to: '/auth/login', replace: true })
      return
    }

    let cancelled = false

    setLoading(true)
    setError(undefined)
    setWorkspace(undefined)

    void bootstrapWorkspace()
      .then((value) => {
        if (!cancelled) setWorkspace(value)
      })
      .catch((cause: unknown) => {
        if (cancelled) return

        const nextError =
          cause instanceof Error ? cause : new Error('Não foi possível preparar o workspace.')

        setError(nextError)

        if (nextError instanceof ApiClientError && nextError.status === 401) {
          void router.navigate({ to: '/auth/login', replace: true })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt, router, session.data?.user?.id, session.isPending])

  const user = session.data?.user
  const contextValue: WorkspaceContextValue = {
    error,
    isLoading: session.isPending || loading,
    retry: () => setAttempt((value) => value + 1),
    setWorkspace,
    user: user
      ? {
          name: user.name || 'Minha conta',
          email: user.email || '',
          image: user.image,
        }
      : undefined,
    workspace,
  }

  return <WorkspaceContext value={contextValue}>{children}</WorkspaceContext>
}

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext)

  if (!workspace) {
    throw new Error('useWorkspace deve ser usado dentro de WorkspaceProvider.')
  }

  return workspace
}
