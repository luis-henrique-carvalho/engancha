import type { AutomationAction } from '@engancha/contracts'

export type FinalAutomationAction =
  | (AutomationAction & { type: 'LINK' })
  | (AutomationAction & { type: 'CAPTURE_EMAIL' })

export function getPublicReplyText(actions: AutomationAction[] | null | undefined): string {
  if (!actions) return ''
  const action = actions.find((item) => item.type === 'PUBLIC_REPLY')
  return action && action.type === 'PUBLIC_REPLY' ? action.text : ''
}

export function getPrivateReplyText(actions: AutomationAction[] | null | undefined): string {
  if (!actions) return ''
  const action = actions.find((item) => item.type === 'PRIVATE_REPLY')
  return action && action.type === 'PRIVATE_REPLY' ? action.text : ''
}

export function getFinalAction(
  actions: AutomationAction[] | null | undefined,
): FinalAutomationAction | undefined {
  if (!actions) return undefined
  const action = actions.find((item) => item.type === 'LINK' || item.type === 'CAPTURE_EMAIL')
  return action as FinalAutomationAction | undefined
}

export function orderAutomationActions(actions: AutomationAction[]): AutomationAction[] {
  const publicReply = actions.find((action) => action.type === 'PUBLIC_REPLY')
  const privateReply = actions.find((action) => action.type === 'PRIVATE_REPLY')
  const finalAction = actions.find(
    (action) => action.type === 'LINK' || action.type === 'CAPTURE_EMAIL',
  )

  const ordered: AutomationAction[] = []
  if (publicReply) ordered.push(publicReply)
  if (privateReply) ordered.push(privateReply)
  if (finalAction) ordered.push(finalAction)

  return ordered
}

export interface BuildActionsOptions {
  publicReply?: string | null
  privateReply?: string | null
  finalAction?: FinalAutomationAction | null
}


export function buildUpdatedActions(
  currentActions: AutomationAction[] | null | undefined,
  update: BuildActionsOptions,
): AutomationAction[] {
  const existingActions = currentActions ? [...currentActions] : []

  let publicReplyAction = existingActions.find((a) => a.type === 'PUBLIC_REPLY')
  let privateReplyAction = existingActions.find((a) => a.type === 'PRIVATE_REPLY')
  let finalAction = existingActions.find((a) => a.type === 'LINK' || a.type === 'CAPTURE_EMAIL')

  if ('publicReply' in update) {
    const trimmed = update.publicReply?.trim()
    publicReplyAction = trimmed ? { type: 'PUBLIC_REPLY', text: trimmed } : undefined
  }

  if ('privateReply' in update) {
    const trimmed = update.privateReply?.trim()
    privateReplyAction = trimmed ? { type: 'PRIVATE_REPLY', text: trimmed } : undefined
  }

  if ('finalAction' in update) {
    finalAction = update.finalAction ? update.finalAction : undefined
  }

  const result: AutomationAction[] = []
  if (publicReplyAction) result.push(publicReplyAction)
  if (privateReplyAction) result.push(privateReplyAction)
  if (finalAction) result.push(finalAction)

  return result
}
