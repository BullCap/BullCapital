'use server'

import type { AnalysisSections } from '@/lib/actions/analysis'

const ANALYSIS_API_URL = process.env.ANALYSIS_API_URL ?? 'http://localhost:8001/api/v1'

export interface ConversationTurn {
  id: string
  question: string
  answer: string
  suggestions: string[]
}

export type ConversationHistory = Array<{ role: 'user' | 'assistant'; content: string }>

export interface ConversationResult {
  answer: string
  suggestions: string[]
  guardrailTriggered: boolean
}

export async function requestConversation(
  ticker: string,
  context: Record<string, unknown>,
  analysis: Partial<AnalysisSections>,
  history: ConversationHistory,
  question: string
): Promise<ConversationResult | null> {
  try {
    const res = await fetch(`${ANALYSIS_API_URL}/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: ticker, context, analysis, history, question }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      answer: data.answer ?? '',
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      guardrailTriggered: Boolean(data.guardrail_triggered),
    }
  } catch {
    return null
  }
}
