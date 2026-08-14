import React from 'react'
import useDialogState from '#/hooks/use-dialog-state'

type UsersDialogType = 'invite'

type UsersContextType = {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  workspaceId: string
}

const UsersContext = React.createContext<UsersContextType | null>(null)

export function UsersProvider({
  children,
  workspaceId,
}: {
  children: React.ReactNode
  workspaceId: string
}) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)

  return (
    <UsersContext.Provider value={{ open, setOpen, workspaceId }}>{children}</UsersContext.Provider>
  )
}

export const useUsers = () => {
  const usersContext = React.useContext(UsersContext)

  if (!usersContext) {
    throw new Error('useUsers must be used within a <UsersProvider>')
  }

  return usersContext
}
