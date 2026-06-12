'use client'

import { useState } from 'react'
import type { PortfolioAllocations } from '@/modules/portfolio'
import { FichaSection, MethodologyNote } from './atoms'
import { bucketColor, formatCents, formatWeight } from './format'

type AllocationView = 'byAssetClass' | 'byInstitution' | 'byIssuer'

const VIEWS: Array<{ key: AllocationView; label: string }> = [
  { key: 'byAssetClass', label: 'Por classe' },
  { key: 'byInstitution', label: 'Por instituição' },
  { key: 'byIssuer', label: 'Por emissor' },
]

interface AllocationSectionProps {
  allocations: PortfolioAllocations
}

/** Deterministic composition view: stacked band + weight rows. No LLM, no spreadsheet. */
export function AllocationSection({ allocations }: AllocationSectionProps) {
  const [view, setView] = useState<AllocationView>('byAssetClass')
  const buckets = allocations[view]

  return (
    <FichaSection
      eyebrow="Composição"
      title="Como a carteira está distribuída"
      description="Percentuais calculados sobre o valor bruto do snapshot mais recente."
      actions={
        <div className="bull-segmented" role="tablist" aria-label="Visão da composição">
          {VIEWS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={view === item.key}
              data-active={view === item.key}
              className="bull-tab"
              onClick={() => setView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
    >
      {/* Stacked composition band */}
      <div className="flex h-3.5 w-full overflow-hidden rounded-full border border-white/[0.06] bg-black/30">
        {buckets.map((bucket, index) => (
          <div
            key={bucket.metricId}
            className="h-full transition-all duration-700"
            style={{
              width: `${Math.max(bucket.weight * 100, 0.75)}%`,
              backgroundColor: bucketColor(index),
              opacity: 0.85,
            }}
            title={`${bucket.label} — ${formatWeight(bucket.weight)}`}
          />
        ))}
      </div>

      {/* Weight rows */}
      <ul className="mt-6 space-y-3.5">
        {buckets.map((bucket, index) => (
          <li key={bucket.metricId} className="flex items-center gap-4">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: bucketColor(index) }}
            />
            <span className="min-w-0 flex-1 truncate text-[13px] text-starlight/75">
              {bucket.label}
              {bucket.count != null && bucket.count > 1 && (
                <span className="ml-2 text-[11px] text-starlight/35">{bucket.count} posições</span>
              )}
            </span>
            <div className="hidden h-1.5 w-36 overflow-hidden rounded-full bg-white/[0.04] sm:block">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${bucket.weight * 100}%`, backgroundColor: bucketColor(index), opacity: 0.7 }}
              />
            </div>
            <span className="w-16 text-right text-[13px] font-medium text-starlight tabular-nums">
              {formatWeight(bucket.weight)}
            </span>
            <span className="hidden w-32 text-right text-[12px] text-starlight/45 tabular-nums md:block">
              {formatCents(bucket.valueCents, { compact: true })}
            </span>
          </li>
        ))}
      </ul>

      <MethodologyNote>
        Consolidação multi-instituição a partir do import padrão Bull. Pesos = valor bruto da
        posição ÷ patrimônio bruto total do snapshot.
      </MethodologyNote>
    </FichaSection>
  )
}
