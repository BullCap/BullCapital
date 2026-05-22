'use client'

import { useEffect, useState } from 'react'
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
    label: 'Tendências do pregão',
    prompt: 'Foque nos sinais de tendência do pregão e momentum de curto prazo.',
  },
  {
    id: 'risco-liquidez',
    label: 'Risco e liquidez',
    prompt: 'Foque em risco, volatilidade e liquidez do ativo no pregão atual.',
  },
  {
    id: 'pressao-compra-venda',
    label: 'Pressão compradora/vendedora',
    prompt: 'Descreva sinais de pressão compradora ou vendedora e o que isso indica.',
  },
  {
    id: 'qualidade-valor',
    label: 'Qualidade e valor',
    prompt: 'Traduza os scores de qualidade em leitura de valor e estabilidade.',
  },
  {
    id: 'o-que-monitorar',
    label: 'O que monitorar',
    prompt: 'Liste os pontos de monitoramento mais importantes para os próximos dias.',
  },
  {
    id: 'cenario-sessao',
    label: 'Cenário da sessão',
    prompt: 'Resuma o clima da sessão e como o ativo se posiciona dentro dele.',
  },
]

interface AnalysisClientProps {
  ticker?: string
  focusLabel: string
}

export default function AnalysisClient({ ticker, focusLabel }: AnalysisClientProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  async function run(t: string, template?: AnalysisTemplate) {
    setLoading(true)
    setError(false)
    setResult(null)
    setActiveTemplate(template?.id ?? null)
    const data = await requestAnalysis(t, template?.prompt)
    if (data) {
      setResult(data)
    } else {
      setError(true)
    }
    setLoading(false)
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
          <div className="my-auto flex flex-col items-center px-4 py-10 text-center">
            <span className="bull-advisor-orb animate-pulse">
              <span className="bull-brand-mark scale-[1.65]" />
            </span>
            <p className="mt-6 text-sm text-[#DBEAFE]/60">Analisando {focusLabel}</p>
            <h2 className="mt-2 max-w-[15rem] font-serif text-3xl leading-tight text-[#F4F0FF]">
              Lendo os sinais…
            </h2>
          </div>
        ) : error ? (
          <div className="my-auto flex flex-col items-center px-4 py-10 text-center">
            <p className="text-sm text-[#F4F0FF]/50">Análise indisponível</p>
            <p className="mt-1 text-xs text-[#F4F0FF]/35">
              Verifique sua conexão com o serviço de análise.
            </p>
            {ticker && (
              <button
                onClick={() => run(ticker)}
                className="mt-6 inline-flex min-h-10 items-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-2 text-sm text-[#F4F0FF]/70 transition hover:bg-white/[0.09]"
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
                Combine preço, radar e cenário antes da próxima leitura.
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

      {result?.artifacts?.length ? (
        <>
          {result.artifacts.map((artifact, index) => (
            <ScrollFocus key={`${artifact.template}-${index}`}>
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
                    {artifact.bullets.map((item, itemIndex) => (
                      <li key={`${item}-${itemIndex}`} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {artifact.template === 'metrics' && artifact.metrics?.length ? (
                  <div className="mt-4 grid gap-3">
                    {artifact.metrics.map((metric, metricIndex) => (
                      <div
                        key={`${metric.label}-${metricIndex}`}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                      >
                        <span className="text-xs uppercase tracking-[0.2em] text-[#F4F0FF]/40">
                          {metric.label}
                        </span>
                        <span className="text-sm text-[#F4F0FF]">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            </ScrollFocus>
          ))}
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
    </>
  )
}
