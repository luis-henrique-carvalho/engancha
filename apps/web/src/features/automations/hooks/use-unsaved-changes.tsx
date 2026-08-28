import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ConfirmDialog } from '@/components/confirm-dialog'

export interface UseUnsavedChangesOptions {
  isDirty: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export function useUnsavedChanges({
  isDirty,
  title = 'Alterações não salvas',
  description = 'Você possui alterações não salvas nesta etapa. Se sair agora, os dados preenchidos serão descartados. Deseja continuar?',
  confirmText = 'Descartar e sair',
  cancelText = 'Continuar editando',
}: UseUnsavedChangesOptions) {
  const router = useRouter({ warn: false })
  const [blockedRetry, setBlockedRetry] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  useEffect(() => {
    if (!isDirty || !router?.history) return

    const unblock = router.history.block((retry: () => void) => {
      setBlockedRetry(() => retry)
    })

    return () => {
      unblock()
    }
  }, [isDirty, router?.history])

  const isBlocked = blockedRetry !== null

  const handleConfirm = () => {
    const retry = blockedRetry
    setBlockedRetry(null)
    retry?.()
  }

  const handleCancel = (open: boolean) => {
    if (!open) {
      setBlockedRetry(null)
    }
  }

  const UnsavedChangesDialog = () => (
    <ConfirmDialog
      open={isBlocked}
      onOpenChange={handleCancel}
      title={title}
      desc={description}
      confirmText={confirmText}
      cancelBtnText={cancelText}
      destructive
      handleConfirm={handleConfirm}
    />
  )

  return {
    isBlocked,
    proceed: handleConfirm,
    reset: () => setBlockedRetry(null),
    UnsavedChangesDialog,
  }
}
