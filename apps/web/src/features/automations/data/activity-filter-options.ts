import type {
  ContentMode,
  ContentProvider,
  ContentType,
  ExecutionOutputType,
  ExecutionStatus,
} from '@engancha/contracts'

export interface ActivityFilters {
  status?: ExecutionStatus[]
  provider?: ContentProvider[]
  mode?: ContentMode[]
  contentType?: ContentType[]
  outputType?: ExecutionOutputType[]
}

export const activityStatusOptions: {
  label: string
  value: ExecutionStatus
}[] = [
  { label: 'Concluída', value: 'COMPLETED' },
  { label: 'Processando', value: 'PROCESSING' },
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Sem correspondência', value: 'IGNORED' },
  { label: 'Falha', value: 'FAILED' },
]

export const activityProviderOptions: {
  label: string
  value: ContentProvider
}[] = [
  { label: 'Instagram', value: 'INSTAGRAM' },
  { label: 'TikTok', value: 'TIKTOK' },
]

export const activityModeOptions: {
  label: string
  value: ContentMode
}[] = [
  { label: 'Simulado', value: 'SIMULATED' },
  { label: 'Real', value: 'REAL' },
]

export const activityContentTypeOptions: {
  label: string
  value: ContentType
}[] = [
  { label: 'Post', value: 'POST' },
  { label: 'Vídeo / Reel', value: 'VIDEO' },
]

export const activityOutputTypeOptions: {
  label: string
  value: ExecutionOutputType
}[] = [
  { label: 'Resposta pública', value: 'PUBLIC_REPLY' },
  { label: 'Mensagem direta', value: 'PRIVATE_REPLY' },
  { label: 'Envio de link', value: 'LINK_DELIVERY' },
  { label: 'Captura de email', value: 'EMAIL_CAPTURE_REQUEST' },
]
