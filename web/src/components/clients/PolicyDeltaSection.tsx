import { cn } from '@/lib/utils'
import type { PortfolioPolicyDelta } from '@/modules/portfolio'
import { FichaSection, MethodologyNote } from './atoms'
import { ASSET_CLASS_LABELS, formatDeltaPp, formatSignedCents, formatWeight } from './format'

interface PolicyDeltaSectionProps {
  policy: PortfolioPolicyDelta | null
  clientId: string
}

/** Delta carteira vs. política-alvo do assessor — aritmética da política dele, nunca sugestão. */
export function PolicyDeltaSection({ policy, clientId }: PolicyDeltaSectionProps) {
  if (!policy) {
    return (
      <FichaSection
        eyebrow="Política-alvo"
        title="Nenhuma política definida"
        description="Defina a alocação-alvo por classe para acompanhar o delta da carteira em relação ao plano."
      >
        <a href={`/clients/${clientId}/policy`} className="bull-action-primary">
          Definir política-alvo
        </a>
      </FichaSection>
    )
  }

  const scaleMax = Math.max(
    ...policy.targets.map((t) => Math.max(t.currentWeight, t.targetWeight)),
    0.01
  )

  return (
    <FichaSection
      eyebrow="Política-alvo"
      title="Carteira vs. plano definido"
      description={
        policy.scope === 'client'
          ? 'Política específica deste cliente, definida pelo assessor.'
          : 'Política padrão do workspace, definida pelo assessor.'
      }
    >
      <ul className="space-y-5">
        {policy.targets.map((target) => {
          const over = target.deltaWeight > 0.001
          const under = target.deltaWeight < -0.001
          const currentPct = (target.currentWeight / scaleMax) * 100
          const targetPct = (target.targetWeight / scaleMax) * 100

          return (
            <li key={target.metricId}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[13px] font-medium text-starlight/80">
                  {ASSET_CLASS_LABELS[target.assetClass]}
                </p>
                <p className="text-[12px] tabular-nums">
                  <span className="text-starlight/55">
                    {formatWeight(target.currentWeight)} atual · alvo {formatWeight(target.targetWeight)}
                  </span>
                  <span
                    className={cn(
                      'ml-2 font-medium',
                      over && 'text-[#ead9ad]',
                      under && 'text-[#B1A9C4]',
                      !over && !under && 'text-starlight/40'
                    )}
                  >
                    {over || under
                      ? `${formatDeltaPp(target.deltaWeight)} (${formatSignedCents(target.deltaValueCents)})`
                      : 'no alvo'}
                  </span>
                </p>
              </div>
              <div className="relative mt-2 h-2 w-full rounded-full border border-white/[0.05] bg-black/30">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full transition-all duration-700',
                    over ? 'bg-[#d0b982]/60' : 'bg-[#82759F]/65'
                  )}
                  style={{ width: `${currentPct}%` }}
                />
                <div
                  className="absolute -top-1 bottom-[-4px] w-px bg-starlight/45"
                  style={{ left: `${targetPct}%` }}
                  title={`Alvo: ${formatWeight(target.targetWeight)}`}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <MethodologyNote>
        Delta = peso atual − peso-alvo da política definida pelo assessor. Valores positivos indicam
        classe acima do alvo; o sistema computa a diferença e não sugere movimentação.
      </MethodologyNote>
    </FichaSection>
  )
}
