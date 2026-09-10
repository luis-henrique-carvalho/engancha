import { useUsers } from './users-provider'
import { useUsersMutations } from '../hooks/use-users-mutations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { useState } from 'react'

export function UsersInviteDialog() {
  const { open, setOpen, workspaceId } = useUsers()
  const [email, setEmail] = useState('')
  const { inviteMember, isInviting } = useUsersMutations(workspaceId)

  const handleClose = () => {
    setOpen(null)
    setEmail('')
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await inviteMember(email)
    handleClose()
  }

  return (
    <Dialog
      open={open === 'invite'}
      onOpenChange={handleClose}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convidar pessoa</DialogTitle>
          <DialogDescription>
            A pessoa entra como membro após autenticar e confirmar o mesmo e-mail.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="pessoa@empresa.com"
            required
          />
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isInviting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isInviting}
            >
              {isInviting ? 'Enviando…' : 'Enviar convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
