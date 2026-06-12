import type { MaturityCalendarBucket } from '@/modules/portfolio'
import { FichaSection, MethodologyNote } from './atoms'
import { formatCents, formatMonth } from './format'

interface MaturitySectionProps {
  calendar: MaturityCalendarBucket[]
}

/** Vencimentos de renda fixa agrupados por mês — colunas determinísticas, sem eixo de planilha. */
export function MaturitySection({ calendar }: MaturitySectionProps) {
  if (calendar.length === 0) {
    return (
      <FichaSection
        eyebrow="Vencimentos"
        title="Sem vencimentos mapeados"
        description="As posições do snapshot atual não têm data de vencimento informada."
      >
        <p className="text-[13px] text-starlight/45">
          Importe a planilha com as colunas de vencimento preenchidas para acompanhar o calendário.
        </p>
      </FichaSection>
    )
  }

  const maxValue = Math.max(...calendar.map((bucket) => bucket.valueCents))

  return (
    <FichaSection
      eyebrow="Vencimentos"
      title="Calendário de liquidez"
      description="Volume de renda fixa e títulos públicos vencendo por mês."
    >
      <div className="flex items-end gap-3 overflow-x-auto pb-1" role="img" aria-label="Calendário de vencimentos por mês">
        {calendar.map((bucket) => {
          const heightPct = Math.max((bucket.valueCents / maxValue) * 100, 6)
          return (
            <div key={bucket.metricId} className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-2">
              <p className="text-[11px] font-medium text-starlight/70 tabular-nums">
                {formatCents(bucket.valueCents, { compact: true })}
              </p>
              <div className="flex h-36 w-full items-end">
                <div
                  className="w-full rounded-t-lg border border-b-0 border-white/[0.07] bg-gradient-to-t from-[#5F5675]/40 to-[#82759F]/55 transition-all duration-700"
                  style={{ height: `${heightPct}%` }}
                  title={`${formatMonth(bucket.month)} — ${formatCents(bucket.valueCents)} em ${bucket.count} posição(ões)`}
                />
              </div>
              <p className="text-[11px] text-starlight/45">{formatMonth(bucket.month)}</p>
              <p className="text-[10px] text-starlight/30">
                {bucket.count} {bucket.count === 1 ? 'posição' : 'posições'}
              </p>
            </div>
          )
        })}
      </div>

      <MethodologyNote>
        Extraído das datas de vencimento das posições de renda fixa do snapshot (CDB, LCI, LCA,
        títulos públicos). Crédito privado sem feed de preço envelhece até o próximo re-import.
      </MethodologyNote>
    </FichaSection>
  )
}
