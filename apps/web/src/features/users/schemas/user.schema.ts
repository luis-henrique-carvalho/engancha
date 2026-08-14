import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  emailVerified: z.boolean().default(false),
  image: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).nullable().optional(),
})

export type User = z.infer<typeof userSchema>
