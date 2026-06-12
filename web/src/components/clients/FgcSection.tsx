import { cn } from '@/lib/utils'
import type { FgcAnalysis } from '@/modules/portfolio'
import { FichaSection, MethodologyNote, SeverityBadge } from './atoms'
import { formatCents, formatDate, formatWeight } from './format'

interface FgcSectionProps {
  fgc: FgcAnalysis
}

const CONFIG_SOURCE_LABELS = {
  workspace_config: 'configuração do escritório',
  system_default: 'padrão do sistema',
  demo_default: 'padrão de demonstração',
} as const

/** The demo lead: FGC coverage per CPF×institution, covered vs uncovered, zero judgement. */
export function FgcSection({ fgc }: FgcSectionProps) {
  const { config, byInstitution, totals } = fgc
  const hasUncovered = totals.uncoveredCents > 0

  return (
    <FichaSection
      eyebrow="Cobertura FGC"
      title="Exposição por instituição"
      description={`Limite vigente de ${formatCents(config.perInstitutionLimitCents, { compact: true })} por CPF e instituição (${CONFIG_SOURCE_LABELS[config.source]}, ref. ${formatDate(config.effectiveDate)}).`}
    >
      <div className="space-y-5">
        {byInstitution.map((item) => {
          const exceeded = item.uncoveredCents > 0
          // Bar scale: the largest exposure (or the limit) fills the track.
          const scaleCents = Math.max(config.perInstitutionLimitCents, ...byInstitution.map((i) => i.exposureCents))
          const coveredPct = (item.coveredCents / scaleCents) * 100
          const uncoveredPct = (item.uncoveredCents / scaleCents) * 100
          const limitPct = (config.perInstitutionLimitCents / scaleCents) * 100

          return (
            <div key={item.metricId}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[13px] font-medium text-starlight/80">{item.institution}</p>
                <p className="text-[12px] text-starlight/50 tabular-nums">
                  {formatCents(item.exposureCents, { compact: true })} ·{' '}
                  {formatWeight(item.utilization, 0)} do limite
                </p>
              </div>
              <div className="relative mt-2 h-2.5 w-full rounded-full border border-white/[0.05] bg-black/30">
                <div className="absolute inset-y-0 left-0 flex w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-l-full bg-[#82759F]/70"
                    style={{ width: `${coveredPct}%` }}
                  />
                  {exceeded && (
                    <div className="h-full bg-[#c98c9a]/75" style={{ width: `${uncoveredPct}%` }} />
                  )}
                </div>
                {/* Limit marker */}
                <div
                  className="absolute -top-1 bottom-[-4px] w-px bg-starlight/35"
                  style={{ left: `${limitPct}%` }}
                  title={`Limite FGC: ${formatCents(config.perInstitutionLimitCents, { compact: true })}`}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-starlight/40">
                  Coberto: {formatCents(item.coveredCents, { compact: true })}
                </span>
                {exceeded ? (
                  <span className="font-medium text-[#e8bdc6]">
                    Descoberto: {formatCents(item.uncoveredCents, { compact: true })}
                  </span>
                ) : (
                  <span className="text-starlight/35">dentro do limite</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div
        className={cn(
          'mt-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3.5',
          hasUncovered
            ? 'border-[#c98c9a]/20 bg-[#c98c9a]/[0.06]'
            : 'border-white/[0.05] bg-white/[0.015]'
        )}
      >
        <div className="flex items-center gap-3">
          {hasUncovered && <SeverityBadge level="critical" />}
          <p className="text-[13px] text-starlight/70">
            {hasUncovered
              ? 'Exposição acima da cobertura do FGC neste CPF'
              : 'Toda a exposição elegível está dentro da cobertura do FGC'}
          </p>
        </div>
        <p className="text-[13px] font-medium text-starlight tabular-nums">
          {formatCents(totals.coveredCents, { compact: true })} cobertos
          {hasUncovered && (
            <span className="text-[#e8bdc6]">
              {' '}· {formatCents(totals.uncoveredCents, { compact: true })} descobertos
            </span>
          )}
        </p>
      </div>

      <MethodologyNote>
        Cálculo por CPF × instituição sobre produtos elegíveis (CDB, LCI, LCA) do snapshot.
        Exposição acima do limite por instituição é classificada como descoberta; o teto global de{' '}
        {formatCents(config.globalLimitCents, { compact: true })} por CPF é avaliado em paralelo.
      </MethodologyNote>
    </FichaSection>
  )
}
