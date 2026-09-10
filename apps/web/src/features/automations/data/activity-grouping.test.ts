import { describe, expect, it } from 'vitest'
import type { SimulationExecutionResponse } from '@engancha/contracts'
import {
  formatActivityDate,
  formatActivityTime,
  groupExecutionsByDate,
  getAutomationMatchDescription,
} from './activity-grouping'

describe('activity-grouping', () => {
  const baseExecution: SimulationExecutionResponse = {
    id: 'exec-1',
    status: 'COMPLETED',
    simulated: true,
    provider: 'INSTAGRAM',
    contentId: 'content-1',
    input: {
      author: 'Lucas',
      text: 'Quero saber mais',
      commentId: null,
      submittedAt: new Date().toISOString(),
    },
    matched: true,
    automation: {
      id: 'auto-1',
      revisionId: 'rev-1',
      version: 1,
      name: 'Promoção Especial',
    },
    outputs: [],
    attempts: 0,
    error: null,
    stateVersion: 1,
    createdAt: new Date().toISOString(),
  }

  it('groups executions by date correctly', () => {
    const today = new Date().toISOString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const exec1 = { ...baseExecution, id: '1', createdAt: today }
    const exec2 = { ...baseExecution, id: '2', createdAt: today }
    const exec3 = { ...baseExecution, id: '3', createdAt: yesterday }

    const groups = groupExecutionsByDate([exec1, exec2, exec3])
    expect(groups.length).toBe(2)
    expect(groups[0].dateLabel).toBe('Hoje')
    expect(groups[0].executions.length).toBe(2)
    expect(groups[1].dateLabel).toBe('Ontem')
    expect(groups[1].executions.length).toBe(1)
  })

  it('provides appropriate match description for current automation', () => {
    const desc = getAutomationMatchDescription(baseExecution, 'auto-1')
    expect(desc.type).toBe('matched')
    expect(desc.label).toBe('Automação: Promoção Especial')
  })

  it('provides appropriate match description when matched with another automation', () => {
    const desc = getAutomationMatchDescription(baseExecution, 'auto-different')
    expect(desc.type).toBe('other-matched')
    expect(desc.label).toContain('Promoção Especial')
  })

  it('provides unmatched description for ignored status', () => {
    const ignoredExec: SimulationExecutionResponse = {
      ...baseExecution,
      status: 'IGNORED',
      matched: false,
      automation: null,
    }
    const desc = getAutomationMatchDescription(ignoredExec, 'auto-1')
    expect(desc.type).toBe('unmatched')
    expect(desc.label).toBe('Sem correspondência')
  })

  it('provides failed description for failed status without exposing technical stack', () => {
    const failedExec: SimulationExecutionResponse = {
      ...baseExecution,
      status: 'FAILED',
      error: {
        code: 'SIMULATION_ERROR',
        message: 'Falha temporária ao simular resposta',
      },
    }
    const desc = getAutomationMatchDescription(failedExec, 'auto-1')
    expect(desc.type).toBe('failed')
    expect(desc.label).toBe('Falha na simulação')
    expect(desc.description).toBe('Falha temporária ao simular resposta')
  })

  it('formats activity date and time safely', () => {
    const now = new Date().toISOString()
    expect(formatActivityDate(now)).toBe('Hoje')
    expect(formatActivityDate(undefined)).toBe('Data recente')
    expect(formatActivityTime(now)).toMatch(/\d{2}:\d{2}/)
    expect(formatActivityTime(undefined)).toBe('')
  })
})
