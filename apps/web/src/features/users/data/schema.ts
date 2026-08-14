import { workspaceMemberSchema } from '@engancha/contracts'

export const userUiSchema = workspaceMemberSchema
export type User = typeof userUiSchema._output
