import { z } from 'zod'

export const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

export const userRoleSchema = z.union([z.literal('admin'), z.literal('user')])
export type UserRole = z.infer<typeof userRoleSchema>

export const userUiSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  status: userStatusSchema.default('active'),
  role: userRoleSchema.default('user'),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable().optional(),
})
export type User = z.infer<typeof userUiSchema>
