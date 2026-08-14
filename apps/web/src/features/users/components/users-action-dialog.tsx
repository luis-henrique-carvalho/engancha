import { useEffect } from 'react'
import { useUsers } from './users-provider'
import { useUsersForm } from '../hooks/use-users-form'
import { useUsersMutations } from '../hooks/use-users-mutations'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'

export function UsersActionDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()
  const isEdit = open === 'edit'

  const form = useUsersForm({
    name: currentRow?.name || '',
    email: currentRow?.email || '',
  })

  const { createUser, updateUser, isCreating, isUpdating } = useUsersMutations()
  const isSubmitting = isCreating || isUpdating

  useEffect(() => {
    if (currentRow) {
      form.reset({
        name: currentRow.name,
        email: currentRow.email,
      })
    } else {
      form.reset({
        name: '',
        email: '',
      })
    }
  }, [currentRow, form])

  const handleClose = () => {
    setOpen(null)
    setCurrentRow(null)
    form.reset()
  }

  const onSubmit = async (values: { name: string; email: string }) => {
    if (isEdit && currentRow) {
      await updateUser({ id: currentRow.id, data: values })
    } else {
      await createUser(values)
    }
    handleClose()
  }

  return (
    <Dialog open={open === 'add' || open === 'edit'} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      disabled={isEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : isEdit
                    ? 'Save Changes'
                    : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
