import { z } from 'zod'

export const automationIdentificationSchema = z.object({
  name: z
    .string()
    .max(80, 'O nome da automação deve ter no máximo 80 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type AutomationIdentificationFormValues = z.infer<typeof automationIdentificationSchema>

export const automationContentSchema = z.object({
  targetId: z.string().nullable().optional().or(z.literal('')),
})

export type AutomationContentFormValues = z.infer<typeof automationContentSchema>

export const automationKeywordSchema = z.object({
  keyword: z
    .string()
    .max(120, 'A palavra-chave deve ter no máximo 120 caracteres.')
    .nullable()
    .optional()
    .or(z.literal('')),
})

export type AutomationKeywordFormValues = z.infer<typeof automationKeywordSchema>
