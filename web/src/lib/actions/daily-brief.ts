'use server'

import { auth } from '@/lib/auth'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'deepseek/deepseek-v4-flash:free'

export interface DailyBrief {
  headline: string
  summary: string
  focusPoints: [string, string, string]
}

export interface DailyBriefInput {
  ibovChange: number | null
  sp500Change: number | null
  vix: number | null
  selicValue: string | null
  marketOpen: boolean
  storyHeadlines: string[]
}

function fmt(v: number | null) {
  if (v === null) return 'indisponível'
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function extractJson(raw: string): string {
  // Strip ```json ... ``` or ``` ... ``` wrappers if present
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced?.[1]) return fenced[1].trim()
  // Try to find first { ... } block
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end > start) return raw.slice(start, end + 1)
  return raw.trim()
}

export async function getDailyBrief(input: DailyBriefInput): Promise<DailyBrief | null> {
  const session = await auth()
  if (!session?.user) return null

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  const { ibovChange, sp500Change, vix, selicValue, marketOpen, storyHeadlines } = input

  const marketStatus = marketOpen ? 'pregão em andamento' : 'fora do horário regular'
  const headlinesList = storyHeadlines.length
    ? storyHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
    : 'Nenhuma manchete disponível no momento.'

  const userPrompt = `Dados do mercado agora (${marketStatus}):
- Ibovespa: ${fmt(ibovChange)}
- S&P 500: ${fmt(sp500Change)}
- VIX: ${vix !== null ? vix.toFixed(1) : 'indisponível'}
- SELIC: ${selicValue ?? 'indisponível'}

Principais manchetes do dia:
${headlinesList}

Gere um briefing diário em português brasileiro para profissionais financeiros que explicam o mercado B3 a clientes ou audiência.
Retorne SOMENTE um objeto JSON válido, sem markdown, sem explicações, sem texto fora do JSON:
{
  "headline": "Uma frase direta sobre o humor do mercado hoje (máximo 10 palavras)",
  "summary": "Um parágrafo editorial com 70 a 95 palavras, conectando macro, exterior, volatilidade e manchetes sem recomendar compra ou venda.",
  "focusPoints": [
    "Primeiro ponto de atenção (máximo 12 palavras)",
    "Segundo ponto de atenção (máximo 12 palavras)",
    "Terceiro ponto de atenção (máximo 12 palavras)"
  ]
}`

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://bullcapital.app',
        'X-Title': 'BullCapital',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Você é um analista de mercado financeiro brasileiro experiente. Responda sempre em português brasileiro. Seja direto, analítico e objetivo. Nunca faça recomendações de compra ou venda de ativos específicos. Retorne apenas JSON válido quando solicitado.',
          },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 600,
        temperature: 0.6,
      }),
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return null

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const raw = data.choices?.[0]?.message?.content
    if (!raw) return null

    const jsonStr = extractJson(raw)
    const parsed = JSON.parse(jsonStr) as Partial<DailyBrief>

    if (
      typeof parsed.headline !== 'string' ||
      typeof parsed.summary !== 'string' ||
      !Array.isArray(parsed.focusPoints) ||
      parsed.focusPoints.length < 3
    ) return null

    return {
      headline: parsed.headline.trim(),
      summary: parsed.summary.trim(),
      focusPoints: [
        String(parsed.focusPoints[0]).trim(),
        String(parsed.focusPoints[1]).trim(),
        String(parsed.focusPoints[2]).trim(),
      ],
    }
  } catch {
    return null
  }
}
