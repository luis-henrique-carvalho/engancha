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

export const automationPublicReplySchema = z.object({
  text: z
    .string()
    .max(1000, 'A resposta pública deve ter no máximo 1.000 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type AutomationPublicReplyFormValues = z.infer<typeof automationPublicReplySchema>

export const automationDirectMessageSchema = z.object({
  text: z
    .string()
    .max(1000, 'A mensagem direta deve ter no máximo 1.000 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type AutomationDirectMessageFormValues = z.infer<typeof automationDirectMessageSchema>

export const automationFinalActionSchema = z.discriminatedUnion('actionType', [
  z.object({
    actionType: z.literal('NONE'),
  }),
  z.object({
    actionType: z.literal('LINK'),
    url: z
      .string()
      .max(2048, 'A URL deve ter no máximo 2.048 caracteres.')
      .refine(
        (val) => !val || val.trim() === '' || z.string().url().safeParse(val.trim()).success,
        'Informe uma URL válida (ex: https://seusite.com.br)',
      )
      .optional()
      .or(z.literal('')),
    label: z
      .string()
      .max(80, 'O rótulo do botão deve ter no máximo 80 caracteres.')
      .optional()
      .or(z.literal('')),
  }),
  z.object({
    actionType: z.literal('CAPTURE_EMAIL'),
    prompt: z
      .string()
      .max(300, 'A mensagem de captura deve ter no máximo 300 caracteres.')
      .optional()
      .or(z.literal('')),
  }),
])

export type AutomationFinalActionFormValues = z.infer<typeof automationFinalActionSchema>

