'use server'

import { auth } from '@/lib/auth'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'deepseek/deepseek-v4-flash:free'

export async function getStoryBrief(headline: string, tickers: string[]): Promise<string | null> {
  const session = await auth()
  if (!session?.user) return null

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  const tickerLine = tickers.filter((t) => !t.startsWith('^')).join(', ') || tickers.join(', ')

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
              'Você é um analista de mercado financeiro brasileiro. Responda sempre em português. Seja direto e objetivo.',
          },
          {
            role: 'user',
            content: `Em até 2 frases curtas, explique por que a notícia abaixo é relevante para profissionais que explicam o mercado B3. Foque no impacto prático. Não repita o título. Não use jargão desnecessário.\n\nTítulo: ${headline}\nAtivos: ${tickerLine}`,
          },
        ],
        max_tokens: 90,
        temperature: 0.4,
      }),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return null
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = data.choices?.[0]?.message?.content?.trim()
    return text ?? null
  } catch {
    return null
  }
}
