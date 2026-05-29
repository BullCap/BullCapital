'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import MetricStoryModal from '@/components/analysis/MetricStoryModal'

interface MacroIndicator {
  label: string
  rate: string
  date: string
  description: string
  analysisQuery: string
}

interface SELICCardProps {
  selic: { rate: string; date: string } | null
  ipca?: { rate: string; date: string } | null
}

export function SELICCardSkeleton() {
  return (
    <div
      className="bull-panel grid h-full min-h-[9.5rem] grid-cols-2 divide-x divide-white/[0.06]"
      aria-hidden="true"
    >
      <GlassHighlight widthPercent={60} />
      {(['SELIC', 'IPCA 12m'] as const).map((label, i) => (
        <div key={label} className="flex flex-col justify-between gap-3 p-5">
          <div>
            <p className="bull-eyebrow">{label}</p>
            <div
              className="mt-2 h-3 w-20 animate-pulse rounded-full bg-white/[0.05]"
              style={{ animationDelay: `${i * 80 + 40}ms` }}
            />
          </div>
          <div>
            <div
              className="h-8 w-20 animate-pulse rounded-lg bg-white/[0.08]"
              style={{ animationDelay: `${i * 80 + 80}ms` }}
            />
            <div
              className="mt-1.5 h-2.5 w-14 animate-pulse rounded-full bg-white/[0.04]"
              style={{ animationDelay: `${i * 80 + 120}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SELICCard({ selic, ipca }: SELICCardProps) {
  const [activeModal, setActiveModal] = useState<MacroIndicator | null>(null)
  const router = useRouter()

  const handleAskAdvisor = (question: string) => {
    router.push(`/analysis?ticker=%5EBVSP&q=${encodeURIComponent(question)}&source=news`)
  }

  const indicators: MacroIndicator[] = []
  if (selic) {
    indicators.push({
      label: 'SELIC',
      rate: selic.rate,
      date: selic.date,
      description: 'Custo do dinheiro.',
      analysisQuery: 'Como a taxa SELIC está impactando o mercado de ações agora?',
    })
  }
  if (ipca) {
    indicators.push({
      label: 'IPCA 12m',
      rate: ipca.rate,
      date: ipca.date,
      description: 'Inflação em 12 meses.',
      analysisQuery: 'Como o IPCA atual está influenciando as decisões do Banco Central e o mercado?',
    })
  }

  if (indicators.length === 0) {
    return (
      <div className="bull-panel flex h-full min-h-[9.5rem] items-center p-5 lg:p-6">
        <GlassHighlight widthPercent={60} />
        <p className="text-sm text-[#F4F0FF]/40">Indicadores macro indisponíveis</p>
      </div>
    )
  }

  return (
    <>
      <div className={`bull-panel grid h-full min-h-[9.5rem] divide-x divide-white/[0.06] ${indicators.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <GlassHighlight widthPercent={60} />
        {indicators.map((indicator) => (
          <button
            key={indicator.label}
            onClick={() => setActiveModal(indicator)}
            className="flex flex-col justify-between gap-3 p-5 text-left hover:bg-white/[0.025] transition-colors duration-200 group active:scale-[0.99]"
          >
            <div>
              <p className="bull-eyebrow group-hover:text-[#A78BFA] transition-colors">{indicator.label}</p>
              <p className="mt-1.5 text-xs leading-5 text-[#DBEAFE]/45">{indicator.description}</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-bold leading-none text-[#F4F0FF] lg:text-3xl flex items-baseline gap-1">
                {indicator.rate}
                <span className="text-xs opacity-0 group-hover:opacity-100 group-hover:text-[#8B5CF6] transition-all duration-300">↗</span>
              </p>
              <p className="mt-1.5 text-xs text-[#F4F0FF]/35">Ref. {indicator.date}</p>
            </div>
          </button>
        ))}
      </div>

      {activeModal && (
        <MetricStoryModal
          metricLabel={activeModal.label}
          metricValue={activeModal.rate}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onAskAdvisor={handleAskAdvisor}
        />
      )}
    </>
  )
}
