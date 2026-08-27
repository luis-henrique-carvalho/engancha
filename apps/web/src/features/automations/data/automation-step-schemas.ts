import { z } from 'zod'

export const automationIdentificationSchema = z.object({
  name: z
    .string()
    .max(80, 'O nome da automação deve ter no máximo 80 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type AutomationIdentificationFormValues = z.infer<typeof automationIdentificationSchema>
