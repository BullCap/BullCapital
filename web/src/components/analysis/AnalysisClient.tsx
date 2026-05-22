'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Eye,
  Lightbulb,
  TrendingUp,
} from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { MarkdownBody } from '@/components/atoms/MarkdownBody'
import ScrollFocus from '@/components/ui/ScrollFocus'
import {
  requestAnalysis,
  type AnalysisArtifact,
  type AnalysisResult,
  type AnalysisSections,
} from '@/lib/actions/analysis'
import type { ConversationHistory, ConversationTurn } from '@/lib/actions/conversation'
import { ConversationDisclaimer } from './ConversationDisclaimer'
import { ConversationInput } from './ConversationInput'
import { ConversationSuggestions } from './ConversationSuggestions'
import { ConversationThread } from './ConversationThread'
import { AnalysisSkeleton } from './AnalysisSkeleton'
import { PriceChartArtifact } from './artifacts/PriceChartArtifact'
import { RadarChartArtifact } from './artifacts/RadarChartArtifact'
import { BarChartArtifact } from './artifacts/BarChartArtifact'

interface SectionConfig {
  key: keyof AnalysisSections
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const SECTIONS: SectionConfig[] = [
  { key: 'o_que_aconteceu', label: 'O que aconteceu', icon: Activity },
  { key: 'por_que_importa', label: 'Por que importa', icon: Lightbulb },
  { key: 'impacto_potencial', label: 'Impacto potencial', icon: TrendingUp },
  { key: 'o_que_acompanhar', label: 'O que acompanhar', icon: Eye },
  { key: 'riscos_e_incertezas', label: 'Riscos e incertezas', icon: AlertTriangle },
]

const TONE_STYLES: Record<NonNullable<AnalysisArtifact['tone']>, string> = {
  neutral: 'text-[#F4F0FF]/70',
  positive: 'text-[#8B5CF6]',
  negative: 'text-[#F43F5E]',
}

interface AnalysisTemplate {
  id: string
  label: string
  prompt: string
}

const TEMPLATE_CHOICES: AnalysisTemplate[] = [
  {
    id: 'tendencias-pregao',
    label: 'O que está em tendência',
    prompt: 'Foque nos movimentos de tendência do dia e nos sinais de curto prazo, explicando de forma clara o que está acontecendo.',
  },
  {
    id: 'risco-liquidez',
    label: 'Riscos e pontos de atenção',
    prompt: 'Explique os principais riscos e pontos de atenção do ativo hoje, em linguagem acessível.',
  },
  {
    id: 'pressao-compra-venda',
    label: 'Sinais de compra e venda',
    prompt: 'Descreva os sinais de interesse comprador ou vendedor e o que isso pode indicar sobre o momento do ativo.',
  },
  {
    id: 'qualidade-valor',
    label: 'Qualidade e valor',
    prompt: 'Traduza os indicadores de qualidade em uma leitura simples sobre o valor e a estabilidade do ativo.',
  },
  {
    id: 'o-que-monitorar',
    label: 'O que acompanhar agora',
    prompt: 'Liste os pontos mais importantes para ficar de olho nos próximos dias, de forma direta e sem jargão.',
  },
  {
    id: 'cenario-sessao',
    label: 'Clima do dia',
    prompt: 'Explique como está o clima do mercado hoje e como o ativo se posiciona nesse contexto.',
  },
]

function extractInitialSuggestions(result: AnalysisResult): string[] {
  const candidates: string[] = []
  const acompanhar = result.sections?.o_que_acompanhar
  const riscos = result.sections?.riscos_e_incertezas
  if (acompanhar) candidates.push('O que devo acompanhar em ' + (result.subject ?? 'este ativo') + '?')
  if (riscos) candidates.push('Quais são os principais riscos?')
  const firstArtifact = result.artifacts?.[0]
  if (firstArtifact?.title) candidates.push(`Me explique mais sobre "${firstArtifact.title.slice(0, 40)}"`)
  return candidates.slice(0, 3)
}

interface AnalysisClientProps {
  ticker?: string
  focusLabel: string
  initialQuestion?: string
}

export default function AnalysisClient({ ticker, focusLabel, initialQuestion }: AnalysisClientProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  // Conversation state
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [sending, setSending] = useState(false)
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([])
  const [history, setHistory] = useState<ConversationHistory>([])
  const [pendingQuestion, setPendingQuestion] = useState(initialQuestion ?? '')

  // Auto-scroll ref — points to first result element
  const resultsRef = useRef<HTMLDivElement>(null)

  async function run(t: string, template?: AnalysisTemplate) {
    setLoading(true)
    setError(false)
    setResult(null)
    setActiveTemplate(template?.id ?? null)
    // Reset conversation when re-running analysis
    setTurns([])
    setHistory([])
    setCurrentSuggestions([])
    const data = await requestAnalysis(t, template?.prompt)
    if (data) {
      setResult(data)
      const seedSuggestions = extractInitialSuggestions(data)
      setCurrentSuggestions(seedSuggestions)
      // Auto-scroll to results after paint
      requestAnimationFrame(() => {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 120)
      })
    } else {
      setError(true)
    }
    setLoading(false)
  }

  async function handleQuestion(question: string) {
    if (!ticker || sending) return
    setSending(true)

    const turnId = crypto.randomUUID()
    setTurns((prev) => [...prev, { id: turnId, question, answer: '', suggestions: [] }])
    setCurrentSuggestions([])

    let fullAnswer = ''

    // Word-by-word display — o stream alimenta receivedText, o intervalo
    // consome uma palavra por tick independente da velocidade do LLM
    let receivedText = ''
    let displayedWords = 0
    let displayInterval = 0

    const startWordInterval = () => {
      if (displayInterval) return
      displayInterval = window.setInterval(() => {
        const words = receivedText.split(' ')
        if (displayedWords >= words.length) return
        displayedWords++
        const shown = words.slice(0, displayedWords).join(' ')
        setTurns((prev) =>
          prev.map((t) => (t.id === turnId ? { ...t, answer: shown } : t))
        )
      }, 65) // ~15 palavras por segundo — fluido mas legível
    }

    try {
      const res = await fetch('/api/conversation/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticker,
          context: {},
          analysis: result?.sections ?? {},
          history,
          question,
        }),
      })

      if (!res.ok || !res.body) throw new Error('stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as Record<string, unknown>
            if (event.type === 'text') {
              receivedText = String(event.text ?? '')
              fullAnswer = receivedText
              startWordInterval()
            } else if (event.type === 'done') {
              // Para o intervalo e exibe o texto final completo
              if (displayInterval) { clearInterval(displayInterval); displayInterval = 0 }
              const finalAnswer = String(event.answer ?? fullAnswer)
              const suggestions = Array.isArray(event.suggestions)
                ? (event.suggestions as string[])
                : []
              fullAnswer = finalAnswer
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === turnId ? { ...t, answer: finalAnswer, suggestions } : t
                )
              )
              setCurrentSuggestions(suggestions)
              setHistory((prev) => [
                ...prev,
                { role: 'user', content: question },
                { role: 'assistant', content: finalAnswer },
              ])
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
      if (displayInterval) { clearInterval(displayInterval); displayInterval = 0 }
    } catch {
      const errMsg = 'Não foi possível gerar uma resposta. Tente novamente.'
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, answer: errMsg } : t))
      )
    }

    setSending(false)
  }

  useEffect(() => {
    if (ticker) run(ticker)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker])

  const focusSubject = ticker ?? focusLabel

  const AdvisorStage = (
    <ScrollFocus>
      <section className="bull-advisor-stage flex min-h-[28rem] flex-col p-5">
        {loading ? (
          <div className="my-auto flex flex-col items-center px-4 py-8 text-center">
            <span className="bull-advisor-orb animate-pulse">
              <span className="bull-brand-mark scale-[1.65]" />
            </span>
            <p className="mt-5 text-sm text-[#DBEAFE]/60">Analisando {focusLabel}</p>
            <h2 className="mt-1.5 max-w-[15rem] font-serif text-2xl leading-tight text-[#F4F0FF]">
              Lendo os sinais…
            </h2>
          </div>
        ) : error ? (
          <div className="my-auto flex flex-col items-center px-4 py-10 text-center">
            <p className="text-sm text-[#F4F0FF]/50">Análise indisponível</p>
            <p className="mt-1 text-xs text-[#F4F0FF]/35">
              Verifique sua conexão com o serviço de análise.
            </p>
            {pendingQuestion && (
              <div className="mt-5 max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-left">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#DBEAFE]/38">Sua pergunta</p>
                <p className="mt-1.5 text-sm leading-5 text-[#F4F0FF]/70">{pendingQuestion}</p>
              </div>
            )}
            {ticker && (
              <button
                onClick={() => run(ticker)}
                className="mt-5 inline-flex min-h-10 items-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-2 text-sm text-[#F4F0FF]/70 transition hover:bg-white/[0.09]"
              >
                Tentar novamente
              </button>
            )}
          </div>
        ) : result ? (
          <div className="my-auto flex flex-col items-center px-4 py-6 text-center">
            <span className="bull-advisor-orb">
              <span className="bull-brand-mark scale-[1.65]" />
            </span>
            <p className="mt-6 text-sm text-[#DBEAFE]/60">{result.subject}</p>
            <h2 className="mt-2 max-w-[18rem] font-serif text-2xl leading-tight text-[#F4F0FF]">
              Análise concluída
            </h2>
          </div>
        ) : (
          <>
            <div className="my-auto flex flex-col items-center px-4 py-10 text-center">
              <span className="bull-advisor-orb">
                <span className="bull-brand-mark scale-[1.65]" />
              </span>
              <p className="mt-6 text-sm text-[#DBEAFE]/60">Advisor BullCapital</p>
              <h2 className="mt-2 max-w-[15rem] font-serif text-3xl leading-tight text-[#F4F0FF]">
                Pergunte sobre {focusLabel}
              </h2>
              <p className="mt-3 max-w-[17rem] text-sm leading-6 text-[#F4F0FF]/60">
                Escolha um ângulo abaixo para começar a análise.
              </p>
            </div>

            <div className="mb-3 w-full">
              <div className="bull-scroll flex max-h-40 w-full flex-col gap-3 overflow-y-auto pb-1 pr-1 scroll-smooth snap-y snap-mandatory">
              {TEMPLATE_CHOICES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => run(focusSubject, template)}
                  disabled={loading}
                    className={`bull-suggestion-pill w-full snap-start px-5 py-2 text-sm font-extrabold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0B14] ${
                    activeTemplate === template.id
                        ? 'border-white/25 bg-white/[0.12] text-[#F4F0FF] shadow-[0_10px_26px_rgba(139,92,246,0.18)]'
                        : 'border-white/15 text-[#F4F0FF]/85 hover:border-white/25 hover:text-[#F4F0FF] hover:shadow-[0_10px_24px_rgba(139,92,246,0.12)]'
                  } ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {template.label}
                </button>
              ))}
              </div>
            </div>
          </>
        )}
      </section>
    </ScrollFocus>
  )

  return (
    <>
      {AdvisorStage}

      {/* Skeleton while loading */}
      {loading && <AnalysisSkeleton />}

      {/* Results anchor for auto-scroll */}
      <div ref={resultsRef} />

      {result?.artifacts?.length ? (
        <>
          {result.artifacts.map((artifact, index) => {
            const key = `${artifact.template}-${index}`

            if (artifact.template === 'price_chart' && ticker) {
              return (
                <ScrollFocus key={key}>
                  <PriceChartArtifact
                    ticker={ticker}
                    title={artifact.title}
                    range={artifact.range ?? '1mo'}
                    chartNote={artifact.chart_note}
                  />
                </ScrollFocus>
              )
            }

            if (artifact.template === 'radar_chart' && result.data?.radar) {
              return (
                <ScrollFocus key={key}>
                  <RadarChartArtifact
                    title={artifact.title}
                    chartNote={artifact.chart_note}
                    radarData={result.data.radar}
                  />
                </ScrollFocus>
              )
            }

            if (artifact.template === 'bar_chart' && artifact.bars?.length) {
              return (
                <ScrollFocus key={key}>
                  <BarChartArtifact
                    eyebrow={artifact.eyebrow}
                    title={artifact.title}
                    bars={artifact.bars}
                    chartNote={artifact.chart_note}
                  />
                </ScrollFocus>
              )
            }

            return (
              <ScrollFocus key={key}>
                <section className="bull-panel p-5">
                  <GlassHighlight widthPercent={55} />
                  {artifact.eyebrow && <p className="bull-eyebrow">{artifact.eyebrow}</p>}
                  {artifact.title && (
                    <h3 className="mt-2 font-serif text-xl text-[#F4F0FF]">{artifact.title}</h3>
                  )}
                  {artifact.body && (
                    <MarkdownBody className={`mt-3 ${TONE_STYLES[artifact.tone ?? 'neutral']}`}>
                      {artifact.body}
                    </MarkdownBody>
                  )}
                  {artifact.template === 'signal_list' && artifact.bullets?.length ? (
                    <ul className="mt-4 space-y-2 text-sm text-[#F4F0FF]/70">
                      {artifact.bullets.map((item, i) => (
                        <li key={`${item}-${i}`} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {artifact.template === 'metrics' && artifact.metrics?.length ? (
                    <div className="mt-4 grid gap-3">
                      {artifact.metrics.map((metric, i) => (
                        <div
                          key={`${metric.label}-${i}`}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                        >
                          <span className="text-xs uppercase tracking-[0.2em] text-[#F4F0FF]/40">{metric.label}</span>
                          <span className="text-sm text-[#F4F0FF]">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              </ScrollFocus>
            )
          })}
        </>
      ) : null}

      {result && (
        <>
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const text = result.sections[key]
            if (!text) return null
            return (
              <ScrollFocus key={key}>
                <section className="bull-panel p-5">
                  <GlassHighlight widthPercent={60} />
                  <div className="mb-3 flex items-center gap-2">
                    <Icon size={13} className="text-[#F4F0FF]/40" />
                    <p className="bull-eyebrow">{label}</p>
                  </div>
                  <MarkdownBody>{text}</MarkdownBody>
                </section>
              </ScrollFocus>
            )
          })}

          {ticker && (
            <button
              onClick={() => run(ticker)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm text-[#F4F0FF]/50 transition hover:bg-white/[0.08] hover:text-[#F4F0FF]/75"
            >
              Atualizar análise
            </button>
          )}
        </>
      )}

      {/* ── Conversation area — only when analysis is ready ── */}
      {result && ticker && (
        <>
          <ConversationSuggestions
            suggestions={currentSuggestions}
            onSelect={handleQuestion}
            disabled={sending}
          />

          <ConversationThread turns={turns} sending={sending} />

          <ConversationInput
            onSubmit={handleQuestion}
            disabled={sending}
            ticker={ticker}
            initialValue={pendingQuestion}
          />

          <ConversationDisclaimer variant="footer" />
        </>
      )}
    </>
  )
}
