'use server'

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

export async function getDailyBrief(input: DailyBriefInput): Promise<DailyBrief | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  const { ibovChange, sp500Change, vix, selicValue, marketOpen, storyHeadlines } = input

  const marketStatus = marketOpen ? 'pregão em andamento' : 'fora do horário regular'
  const headlinesList = storyHeadlines.length
    ? storyHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
    : 'Nenhuma manchete disponível.'

  const userPrompt = `Dados do mercado agora (${marketStatus}):
- Ibovespa: ${fmt(ibovChange)}
- S&P 500: ${fmt(sp500Change)}
- VIX: ${vix !== null ? vix.toFixed(1) : 'indisponível'}
- SELIC: ${selicValue ?? 'indisponível'}

Principais manchetes do dia:
${headlinesList}

Gere um briefing diário em português para investidores brasileiros no mercado B3.
Responda APENAS com JSON válido neste formato exato (sem markdown, sem explicações):
{
  "headline": "Uma frase direta capturando o humor do mercado hoje (máximo 18 palavras)",
  "summary": "Dois ou três parágrafos curtos conectando os dados e manchetes, explicando o contexto do dia.",
  "focusPoints": [
    "Ponto de atenção 1 — máximo 20 palavras",
    "Ponto de atenção 2 — máximo 20 palavras",
    "Ponto de atenção 3 — máximo 20 palavras"
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
              'Você é um analista de mercado financeiro brasileiro. Responda sempre em português. Seja direto, claro e objetivo. Nunca use jargão excessivo. Nunca faça recomendações de compra ou venda.',
          },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) return null
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const raw = data.choices?.[0]?.message?.content?.trim()
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DailyBrief>
    if (
      typeof parsed.headline !== 'string' ||
      typeof parsed.summary !== 'string' ||
      !Array.isArray(parsed.focusPoints) ||
      parsed.focusPoints.length < 3
    ) return null

    return {
      headline: parsed.headline,
      summary: parsed.summary,
      focusPoints: [parsed.focusPoints[0]!, parsed.focusPoints[1]!, parsed.focusPoints[2]!],
    }
  } catch {
    return null
  }
}
