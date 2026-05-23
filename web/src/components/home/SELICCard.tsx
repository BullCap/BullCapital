'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import MetricStoryModal from '@/components/analysis/MetricStoryModal'

interface SELICCardProps {
  selic: { rate: string; date: string } | null
}

export default function SELICCard({ selic }: SELICCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleAskAdvisor = (question: string) => {
    // Redirect to analysis page in direct question mode (source=news)
    router.push(`/analysis?ticker=%5EBVSP&q=${encodeURIComponent(question)}&source=news`)
  }

  return (
    <>
      <button
        onClick={() => {
          if (selic !== null) setIsOpen(true)
        }}
        disabled={selic === null}
        className="bull-panel flex w-full min-h-[9.5rem] flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6 text-left hover:border-[#8B5CF6]/30 hover:bg-[#1A1625]/60 cursor-pointer transition-all duration-300 group active:scale-[0.99]"
      >
        <GlassHighlight widthPercent={60} />

        <div className="min-w-0">
          <p className="bull-eyebrow group-hover:text-[#A78BFA] transition-colors">Taxa SELIC</p>
          <p className="mt-2 max-w-[12rem] text-sm leading-5 text-[#DBEAFE]/50">
            Referência para o custo do dinheiro no Brasil. Clique para ver histórico.
          </p>
        </div>

        <div className="min-w-0 lg:max-w-[10rem] lg:text-right">
          {selic === null ? (
            <p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
          ) : (
            <>
              <p className="font-serif text-3xl font-bold leading-none text-[#F4F0FF] lg:text-[2.75rem] flex items-baseline gap-1 lg:justify-end">
                {selic.rate}
                <span className="text-xs opacity-0 group-hover:opacity-100 group-hover:text-[#8B5CF6] transition-all duration-300">↗</span>
              </p>
              <p className="mt-2 text-xs leading-5 text-[#F4F0FF]/40">Atualizado em {selic.date}</p>
            </>
          )}
        </div>
      </button>

      {selic !== null && (
        <MetricStoryModal
          metricLabel="SELIC"
          metricValue={selic.rate}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onAskAdvisor={handleAskAdvisor}
        />
      )}
    </>
  )
}
