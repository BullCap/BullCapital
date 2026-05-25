'use server'

import type { AnalysisSections } from '@/lib/actions/analysis'
import { ANALYSIS_API_URL, internalApiHeaders } from '@/lib/internal-api'
import { auth } from '@/lib/auth'

export interface ConversationTurn {
  id: string
  question: string
  answer: string
  artifacts: ConversationArtifact[]
  suggestions: string[]
}

export type ConversationHistory = Array<{ role: 'user' | 'assistant'; content: string }>

export interface ConversationTableArtifact {
  template: 'table' | 'comparison'
  title?: string
  eyebrow?: string
  columns: string[]
  rows: string[][]
  note?: string
}

export interface ConversationFlowArtifact {
  template: 'flow'
  title?: string
  eyebrow?: string
  steps: string[]
  note?: string
}

export interface ConversationMetricGridArtifact {
  template: 'metric_grid'
  title?: string
  eyebrow?: string
  metrics: Array<{
    label: string
    value: string
    detail?: string
    tone?: 'positive' | 'negative' | 'neutral'
  }>
  note?: string
}

export interface ConversationPriceChartArtifact {
  template: 'price_chart'
  title?: string
  range?: '1d' | '1mo' | '3mo'
  chart_note?: string
}

export interface ConversationBarChartArtifact {
  template: 'bar_chart'
  eyebrow?: string
  title?: string
  chart_note?: string
  bars: Array<{ label: string; value: number }>
}

export interface ConversationRadarChartArtifact {
  template: 'radar_chart'
  title?: string
  chart_note?: string
  radarData?: Record<string, number>
}

export type ConversationArtifact =
  | ConversationTableArtifact
  | ConversationFlowArtifact
  | ConversationMetricGridArtifact
  | ConversationPriceChartArtifact
  | ConversationBarChartArtifact
  | ConversationRadarChartArtifact

export interface ConversationResult {
  answer: string
  artifacts: ConversationArtifact[]
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
    const session = await auth()
    if (!session?.user) return null

    const res = await fetch(`${ANALYSIS_API_URL}/conversation`, {
      method: 'POST',
      headers: internalApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ subject: ticker, context, analysis, history, question }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      answer: data.answer ?? '',
      artifacts: Array.isArray(data.artifacts) ? data.artifacts : [],
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      guardrailTriggered: Boolean(data.guardrail_triggered),
    }
  } catch {
    return null
  }
}
