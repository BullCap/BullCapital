'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X, Lightbulb, TrendingUp, Table, BookOpen, Send } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis, XAxis } from 'recharts'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { getMetricStory, type MetricStory } from '@/lib/metric-stories'
import { MarkdownBody } from '@/components/atoms/MarkdownBody'

interface MetricStoryModalProps {
  metricLabel: string
  metricValue: string
  isOpen: boolean
  onClose: () => void
  onAskAdvisor: (question: string) => void
}

type TabType = 'concept' | 'chart' | 'quotes' | 'impact'

export default function MetricStoryModal({
  metricLabel,
  metricValue,
  isOpen,
  onClose,
  onAskAdvisor,
}: MetricStoryModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('concept')
  const [mounted, setMounted] = useState(false)
  const story = getMetricStory(metricLabel)

  // Reset tab when modal opens for a new metric
  useEffect(() => {
    if (isOpen) {
      setActiveTab('concept')
    }
  }, [isOpen, metricLabel])

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Mount logic to prevent SSR hydration mismatches in Next.js
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Fallback if no matching pre-defined story exists
  const fallbackStory: MetricStory = {
    id: 'generic',
    title: metricLabel,
    category: 'Métrica Financeira',
    description: `Mapeamento e leitura de dados para ${metricLabel}.`,
    whatItIs: `A métrica ${metricLabel} é um indicador financeiro que auxilia investidores e analistas na leitura de valuation, qualidade ou performance operacional de um ativo no mercado brasileiro.`,
    howItWorks: `Valores são calculados a partir dos dados consolidados mais recentes disponibilizados por APIs financeiras de mercado (como a B3 ou o Banco Central).`,
    pocketImpact: `Métricas operacionais e de múltiplos servem como margem de segurança para tomada de decisões financeiras informadas, permitindo diferenciar ruído de movimentos sólidos de valor.`,
    yAxisDomain: ['auto', 'auto'],
    chartData: [],
    recentQuotes: [],
  }

  const activeStory = story ?? fallbackStory
  const actualValue = metricValue || 'n/d'

  const handleAskClick = () => {
    onClose()
    const promptText = `Me explique melhor a relevância do indicador ${activeStory.title} (atualmente em ${actualValue}) no contexto atual de mercado e quais pontos de atenção devo monitorar.`
    onAskAdvisor(promptText)
  }

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Glassmorphic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Window Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#1A1625]/95 shadow-2xl backdrop-blur-2xl"
          >
          {/* Subtle Ambient Glowing Orbs */}
          <div className="absolute -left-12 -top-12 -z-10 h-48 w-48 rounded-full bg-[#8B5CF6]/15 blur-[60px]" />
          <div className="absolute -bottom-12 -right-12 -z-10 h-48 w-48 rounded-full bg-[#F43F5E]/10 blur-[60px]" />

          <GlassHighlight widthPercent={60} />

          {/* Modal Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B5CF6]">
                {activeStory.category}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[#F4F0FF]">
                {activeStory.title}
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Main value display */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <p className="text-[9px] uppercase tracking-wider text-[#F4F0FF]/40">Valor Atual</p>
                <p className="font-serif text-lg font-bold text-[#F4F0FF]">{actualValue}</p>
              </div>

              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#F4F0FF]/40 transition hover:bg-white/[0.08] hover:text-[#F4F0FF]"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Description Banner */}
          <div className="mx-6 rounded-2xl bg-white/[0.02] px-5 py-3 border border-white/[0.05]">
            <p className="text-sm leading-relaxed text-[#F4F0FF]/70">
              {activeStory.description}
            </p>
          </div>

          {/* Premium Nav Tabs */}
          <div className="mt-5 flex gap-6 border-b border-white/[0.06] px-6 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => setActiveTab('concept')}
              className={`flex shrink-0 items-center gap-2 border-b-2 pb-3 text-xs font-semibold tracking-wide transition ${
                activeTab === 'concept'
                  ? 'border-[#8B5CF6] text-white'
                  : 'border-transparent text-[#F4F0FF]/40 hover:text-[#F4F0FF]/60'
              }`}
            >
              <BookOpen size={13} />
              Conceito
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`flex shrink-0 items-center gap-2 border-b-2 pb-3 text-xs font-semibold tracking-wide transition ${
                activeTab === 'chart'
                  ? 'border-[#8B5CF6] text-white'
                  : 'border-transparent text-[#F4F0FF]/40 hover:text-[#F4F0FF]/60'
              }`}
            >
              <TrendingUp size={13} />
              Histórico
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex shrink-0 items-center gap-2 border-b-2 pb-3 text-xs font-semibold tracking-wide transition ${
                activeTab === 'quotes'
                  ? 'border-[#8B5CF6] text-white'
                  : 'border-transparent text-[#F4F0FF]/40 hover:text-[#F4F0FF]/60'
              }`}
            >
              <Table size={13} />
              Cotações Diárias
            </button>
            <button
              onClick={() => setActiveTab('impact')}
              className={`flex shrink-0 items-center gap-2 border-b-2 pb-3 text-xs font-semibold tracking-wide transition ${
                activeTab === 'impact'
                  ? 'border-[#8B5CF6] text-white'
                  : 'border-transparent text-[#F4F0FF]/40 hover:text-[#F4F0FF]/60'
              }`}
            >
              <Lightbulb size={13} />
              Impacto Prático
            </button>
          </div>

          {/* Modal Tab Content Area */}
          <div className="bull-scroll h-[280px] overflow-y-auto px-6 py-5">
            {activeTab === 'concept' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-sm"
              >
                <div>
                  <h4 className="font-semibold text-white">O que é?</h4>
                  <div className="mt-1.5">
                    <MarkdownBody>{activeStory.whatItIs}</MarkdownBody>
                  </div>
                </div>
                <div className="pt-2">
                  <h4 className="font-semibold text-white">Como funciona?</h4>
                  <div className="mt-1.5">
                    <MarkdownBody>{activeStory.howItWorks}</MarkdownBody>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'chart' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full flex-col justify-between"
              >
                {activeStory.chartData.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <p className="text-xs text-[#F4F0FF]/30">Série histórica indisponível para este indicador</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] uppercase tracking-wider text-[#F4F0FF]/40 mb-3">
                      Evolução Histórica Recente (Ciclos Anuais)
                    </p>
                    <div className="flex-1 min-h-[180px] overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-black/20 p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activeStory.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.0} />
                          </linearGradient>
                          <XAxis 
                            dataKey="date" 
                            stroke="rgba(255,255,255,0.2)" 
                            fontSize={10} 
                            tickLine={false}
                          />
                          <YAxis 
                            domain={activeStory.yAxisDomain} 
                            stroke="rgba(255,255,255,0.2)" 
                            fontSize={10} 
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#110D20',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '0.75rem',
                              fontSize: 11,
                              color: '#F4F0FF',
                            }}
                            formatter={(v) => [`${v}%`, activeStory.title]}
                            labelFormatter={(label) => `Ano: ${label}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            fill="url(#metricGrad)"
                            dot={{ fill: '#8B5CF6', r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'quotes' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col justify-between"
              >
                {activeStory.recentQuotes.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <p className="text-xs text-[#F4F0FF]/30">Cotações diárias indisponíveis para este indicador</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-black/20">
                    <div className="bull-scroll h-full overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-[#161222] text-[#F4F0FF]/40 border-b border-white/[0.08] z-10">
                          <tr>
                            <th className="px-4 py-3 font-semibold uppercase tracking-wider">Data</th>
                            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Abertura</th>
                            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Fechamento</th>
                            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Variação</th>
                            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Mínimo</th>
                            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Máximo</th>
                            <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Volume</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-[#F4F0FF]/80">
                          {activeStory.recentQuotes.map((quote, idx) => {
                            const changeColor =
                              quote.changeType === 'up'
                                ? 'text-[#22C55E]'
                                : quote.changeType === 'down'
                                  ? 'text-[#F43F5E]'
                                  : 'text-[#F4F0FF]/40'

                            return (
                              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 font-medium text-[#F4F0FF]">{quote.date}</td>
                                <td className="px-4 py-3 text-right">{quote.open}</td>
                                <td className="px-4 py-3 text-right font-semibold text-[#F4F0FF]">{quote.close}</td>
                                <td className={`px-4 py-3 text-right font-bold ${changeColor}`}>{quote.change}</td>
                                <td className="px-4 py-3 text-right text-[#F4F0FF]/60">{quote.min}</td>
                                <td className="px-4 py-3 text-right text-[#F4F0FF]/60">{quote.max}</td>
                                <td className="px-4 py-3 text-right text-[#F4F0FF]/50">{quote.volume}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'impact' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-sm"
              >
                <div className="rounded-2xl border border-white/[0.04] bg-[#8B5CF6]/5 p-4 text-[#C4B5FD]">
                  <h4 className="flex items-center gap-1.5 font-semibold text-white">
                    <Lightbulb size={15} />
                    Como isso afeta os seus investimentos?
                  </h4>
                  <div className="mt-3">
                    <MarkdownBody>{activeStory.pocketImpact}</MarkdownBody>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Premium Footer with LLM Ask Bridge */}
          <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/10 px-6 py-4">
            <p className="text-[11px] text-[#F4F0FF]/35">
              Dados consolidados BullCapital radar.
            </p>
            
            <button
              onClick={handleAskClick}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 text-xs font-semibold text-[#C4B5FD] transition hover:bg-[#8B5CF6]/20 hover:text-white"
            >
              <Send size={12} />
              Perguntar ao Advisor
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
