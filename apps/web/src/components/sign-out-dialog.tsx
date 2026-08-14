import { useNavigate } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()

  const handleSignOut = () => {
    void authClient.signOut().finally(() => {
      void navigate({ to: '/auth/login', replace: true })
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sair da conta"
      desc="Sua sessão atual será encerrada neste navegador."
      confirmText="Sair"
      cancelBtnText="Cancelar"
      destructive
      handleConfirm={handleSignOut}
      className="sm:max-w-sm"
    />
  )
}
