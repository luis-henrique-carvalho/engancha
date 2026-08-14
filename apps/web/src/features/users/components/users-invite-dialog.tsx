import { useUsers } from './users-provider'
import { useUsersForm } from '../hooks/use-users-form'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { toast } from 'sonner'
import { useState } from 'react'

export function UsersInviteDialog() {
  const { open, setOpen } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useUsersForm()

  const handleClose = () => {
    setOpen(null)
    form.reset()
  }

  const onSubmit = async (values: { name: string; email: string }) => {
    setIsSubmitting(true)
    // Simulate sending invite
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    toast.success(`Invitation sent successfully to ${values.email}`)
    handleClose()
  }

  return (
    <Dialog open={open === 'invite'} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation link to a user. They will receive an email with
            instructions.
          </DialogDescription>
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
                    <Input placeholder="Enter user's name" {...field} />
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
                      placeholder="user@example.com"
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
                {isSubmitting ? 'Sending Invite...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
