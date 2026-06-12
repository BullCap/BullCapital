import type { ConcentrationAnalysis } from '@/modules/portfolio'
import { FichaSection, MethodologyNote, SeverityBadge } from './atoms'
import { formatCents, formatWeight } from './format'

interface ConcentrationSectionProps {
  concentration: ConcentrationAnalysis
}

const KIND_LABELS = {
  issuer: 'Emissor',
  institution: 'Instituição',
  asset_class: 'Classe de ativo',
} as const

/** Concentração vs. thresholds do workspace — réguas determinísticas, severidade visual calma. */
export function ConcentrationSection({ concentration }: ConcentrationSectionProps) {
  const { alerts, thresholds } = concentration

  return (
    <FichaSection
      eyebrow="Concentração"
      title="Pontos de atenção da carteira"
      description="Exposições próximas ou acima das réguas configuradas para o workspace."
    >
      {alerts.length === 0 ? (
        <p className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-4 text-[13px] text-starlight/55">
          Nenhuma exposição acima de 90% das réguas configuradas. Os thresholds vigentes estão em
          Configurações do workspace.
        </p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => {
            const ratio = Math.min(alert.weight / alert.threshold, 1.5)
            return (
              <li
                key={alert.metricId}
                className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <SeverityBadge level={alert.level} />
                    <p className="text-[13px] text-starlight/80">
                      <span className="font-medium">{alert.label}</span>
                      <span className="ml-2 text-[11px] uppercase tracking-[0.1em] text-starlight/35">
                        {KIND_LABELS[alert.kind]}
                      </span>
                    </p>
                  </div>
                  <p className="text-[12px] text-starlight/55 tabular-nums">
                    {formatWeight(alert.weight)} da carteira · régua {formatWeight(alert.threshold, 0)}
                    {alert.excessValueCents != null && (
                      <span className="ml-2 font-medium text-[#e8bdc6]">
                        {formatCents(alert.excessValueCents, { compact: true })} acima
                      </span>
                    )}
                  </p>
                </div>
                <div className="relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-black/30">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#82759F]/50 to-[#c98c9a]/70 transition-all duration-700"
                    style={{ width: `${(ratio / 1.5) * 100}%` }}
                  />
                  <div className="absolute inset-y-0 w-px bg-starlight/45" style={{ left: `${(1 / 1.5) * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <MethodologyNote>
        Réguas vigentes: emissor {formatWeight(thresholds.issuerMaxWeight, 0)} · instituição{' '}
        {formatWeight(thresholds.institutionMaxWeight, 0)} · classe{' '}
        {formatWeight(thresholds.assetClassMaxWeight, 0)}. Defaults conservadores de demonstração —
        os números finais são definidos com o escritório no onboarding.
      </MethodologyNote>
    </FichaSection>
  )
}
