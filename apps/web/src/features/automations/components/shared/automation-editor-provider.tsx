import React, { createContext, useContext } from 'react'
import type { AutomationResponse } from '@engancha/contracts'

export interface AutomationEditorContextType {
  workspaceId: string
  automationId: string
  automation: AutomationResponse
}

const AutomationEditorContext = createContext<AutomationEditorContextType | null>(null)

export function AutomationEditorProvider({
  children,
  workspaceId,
  automationId,
  automation,
}: {
  children: React.ReactNode
  workspaceId: string
  automationId: string
  automation: AutomationResponse
}) {
  return (
    <AutomationEditorContext.Provider value={{ workspaceId, automationId, automation }}>
      {children}
    </AutomationEditorContext.Provider>
  )
}

export function useAutomationEditor(): AutomationEditorContextType {
  const context = useContext(AutomationEditorContext)
  if (!context) {
    throw new Error('useAutomationEditor must be used within <AutomationEditorProvider>')
  }
  return context
}

export function useOptionalAutomationEditor(): AutomationEditorContextType | null {
  return useContext(AutomationEditorContext)
}
