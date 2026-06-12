'use client'

// Painel de narração da ficha — preparado para o canal SSE do contrato
// docs/contracts/bff-ai-sse.md (eventos text/loading/error/done). Enquanto o
// AI Service não está plugado, um runner local mocka a state machine com os
// mesmos estados semânticos e "streama" uma narrativa derivada do payload —
// os números citados vêm do payload determinístico, nunca de texto solto.
import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioDeterministicPayload } from '@/modules/portfolio'
import { DisclaimerNote, FichaSection } from './atoms'
import {
  ASSET_CLASS_LABELS,
  formatAge,
  formatCents,
  formatDeltaPp,
  formatMonth,
  formatWeight,
} from './format'

type NarrationPhase =
  | 'idle'
  | 'resolving_scope'
  | 'loading_payload'
  | 'narrating'
  | 'validating'
  | 'done'

interface ApprovalRecord {
  decision: 'APPROVED' | 'REJECTED'
  at: Date
  reason?: string
}

const PHASE_LABELS: Record<Exclude<NarrationPhase, 'idle' | 'done'>, string> = {
  resolving_scope: 'Resolvendo escopo do cliente',
  loading_payload: 'Recuperando payload determinístico',
  narrating: 'Narrando os números da carteira',
  validating: 'Validando no Guardião',
}

const PHASE_SEQUENCE: Array<Exclude<NarrationPhase, 'idle' | 'done'>> = [
  'resolving_scope',
  'loading_payload',
  'narrating',
  'validating',
]

/** Narrativa mockada construída SÓ com números do payload — espelha o invariante do Guardião. */
function buildMockNarrative(payload: PortfolioDeterministicPayload): string {
  const { totals, snapshot, fgc, policy, concentration, maturityCalendar } = payload
  const parts: string[] = []

  parts.push(
    `A carteira consolidada soma ${formatCents(totals.grossValueCents, { compact: true })} em ${totals.positionCount} posições distribuídas por ${totals.institutionCount} instituições, com base no snapshot ${formatAge(snapshot.ageDays).replace('atualizado ', 'importado ')}.`
  )

  const worstFgc = fgc.byInstitution.find((item) => item.uncoveredCents > 0)
  if (worstFgc) {
    parts.push(
      `Na cobertura do FGC, ${worstFgc.institution} concentra ${formatCents(worstFgc.exposureCents, { compact: true })} em produtos elegíveis — ${formatCents(worstFgc.uncoveredCents, { compact: true })} acima do limite por CPF e instituição, o que corresponde a ${formatWeight(worstFgc.utilization, 0)} de utilização do limite.`
    )
  } else {
    parts.push('Toda a exposição elegível ao FGC está dentro do limite por CPF e instituição.')
  }

  const biggestDelta = policy?.targets.reduce((max, target) =>
    Math.abs(target.deltaWeight) > Math.abs(max.deltaWeight) ? target : max
  )
  if (biggestDelta && Math.abs(biggestDelta.deltaWeight) > 0.001) {
    parts.push(
      `Em relação à política-alvo definida pelo assessor, o maior desvio está em ${ASSET_CLASS_LABELS[biggestDelta.assetClass].toLowerCase()}: ${formatWeight(biggestDelta.currentWeight)} atual contra alvo de ${formatWeight(biggestDelta.targetWeight)} (${formatDeltaPp(biggestDelta.deltaWeight)}).`
    )
  }

  const critical = concentration.alerts.find((alert) => alert.level === 'critical')
  if (critical) {
    parts.push(
      `O ponto de atenção mais relevante é a concentração em ${critical.label}, com ${formatWeight(critical.weight)} da carteira frente à régua de ${formatWeight(critical.threshold, 0)} configurada para o workspace.`
    )
  }

  const nextMaturity = maturityCalendar[0]
  if (nextMaturity) {
    parts.push(
      `No calendário de liquidez, o próximo vencimento relevante é em ${formatMonth(nextMaturity.month)}, com ${formatCents(nextMaturity.valueCents, { compact: true })} retornando ao caixa.`
    )
  }

  parts.push(
    'Limitações: a leitura reflete exclusivamente o snapshot importado; posições sem feed de preço permanecem com o valor do import até a próxima atualização.'
  )

  return parts.join('\n\n')
}

interface NarrationPanelProps {
  payload: PortfolioDeterministicPayload
}

export function NarrationPanel({ payload }: NarrationPanelProps) {
  const [phase, setPhase] = useState<NarrationPhase>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [approval, setApproval] = useState<ApprovalRecord | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach(clearTimeout)
  }, [])

  const schedule = (fn: () => void, delay: number) => {
    timersRef.current.push(setTimeout(fn, delay))
  }

  const startNarration = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setApproval(null)
    setRejecting(false)
    setRejectReason('')
    setStreamedText('')
    setPhase('resolving_scope')

    schedule(() => setPhase('loading_payload'), 700)
    schedule(() => {
      setPhase('narrating')
      const narrative = buildMockNarrative(payload)
      const words = narrative.split(' ')
      words.forEach((word, index) => {
        schedule(() => {
          setStreamedText((current) => (current ? `${current} ${word}` : word))
          if (index === words.length - 1) {
            setPhase('validating')
            schedule(() => setPhase('done'), 900)
          }
        }, index * 28)
      })
    }, 1500)
  }

  const running = phase !== 'idle' && phase !== 'done'
  const activePhaseIndex = PHASE_SEQUENCE.indexOf(phase as (typeof PHASE_SEQUENCE)[number])

  return (
    <FichaSection
      eyebrow="Preparação de reunião"
      title="Narração da carteira"
      description="A IA transforma o payload determinístico em texto de preparação. Os números nunca nascem do modelo — e nada vai ao cliente sem a sua revisão."
      actions={
        phase === 'idle' ? (
          <button type="button" onClick={startNarration} className="bull-action-primary">
            <Sparkles size={15} />
            Gerar preparação
          </button>
        ) : (
          <button
            type="button"
            onClick={startNarration}
            disabled={running}
            className="bull-action"
          >
            <RotateCcw size={14} />
            Gerar novamente
          </button>
        )
      }
    >
      {phase === 'idle' && (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-10 text-center">
          <p className="font-serif text-lg text-starlight/70">
            Pronto para preparar a próxima reunião
          </p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-starlight/40">
            Consolidação, FGC, delta vs. política e vencimentos narrados em segundos, citando
            apenas os números desta ficha.
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-starlight/30">
            Prévia com narrativa simulada — aguarda o serviço de IA
          </p>
        </div>
      )}

      {/* Progresso semântico — espelha as transições da state machine do orquestrador (SSE) */}
      {running && (
        <ol className="mb-6 flex flex-wrap items-center gap-2" aria-live="polite">
          {PHASE_SEQUENCE.map((step, index) => {
            const isActive = index === activePhaseIndex
            const isDone = index < activePhaseIndex
            return (
              <li
                key={step}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-colors duration-500',
                  isActive && 'border-amethyst/35 bg-amethyst/[0.12] text-starlight',
                  isDone && 'border-white/[0.07] bg-white/[0.03] text-starlight/45',
                  !isActive && !isDone && 'border-white/[0.04] text-starlight/25'
                )}
              >
                {isDone ? (
                  <Check size={11} />
                ) : (
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      isActive ? 'animate-pulse bg-amethyst-light' : 'bg-starlight/20'
                    )}
                  />
                )}
                {PHASE_LABELS[step]}
              </li>
            )
          })}
        </ol>
      )}

      {streamedText && (
        <div className="space-y-4">
          <div className="whitespace-pre-wrap rounded-xl border border-white/[0.05] bg-white/[0.015] px-6 py-6 text-[14px] leading-7 text-starlight/80">
            {streamedText}
            {running && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-amethyst-light align-middle" />}
          </div>

          {phase === 'done' && !approval && !rejecting && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
              <p className="text-[12px] text-starlight/50">
                Rascunho revisável — a aprovação fica registrada com versão e hash do conteúdo.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRejecting(true)}
                  className="bull-action min-h-9 px-3.5 text-[13px]"
                >
                  <X size={13} />
                  Rejeitar
                </button>
                <button
                  type="button"
                  onClick={() => setApproval({ decision: 'APPROVED', at: new Date() })}
                  className="bull-action-primary min-h-9 px-3.5 text-[13px]"
                >
                  <Check size={13} />
                  Aprovar narração
                </button>
              </div>
            </div>
          )}

          {rejecting && !approval && (
            <form
              className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3"
              onSubmit={(event) => {
                event.preventDefault()
                setApproval({
                  decision: 'REJECTED',
                  at: new Date(),
                  reason: rejectReason.trim() || undefined,
                })
                setRejecting(false)
              }}
            >
              <input
                type="text"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Motivo (opcional) — vira telemetria de qualidade"
                className="min-w-0 flex-1 rounded-lg border border-white/[0.07] bg-black/25 px-3 py-2 text-[13px] text-starlight placeholder:text-starlight/25 focus:border-amethyst/40 focus:outline-none"
              />
              <button type="submit" className="bull-action min-h-9 px-3.5 text-[13px]">
                Confirmar rejeição
              </button>
            </form>
          )}

          {approval && (
            <div
              className={cn(
                'rounded-xl border px-4 py-3 text-[12px]',
                approval.decision === 'APPROVED'
                  ? 'border-[#7fb59a]/20 bg-[#7fb59a]/[0.07] text-[#b6dcc7]'
                  : 'border-[#c98c9a]/20 bg-[#c98c9a]/[0.07] text-[#e8bdc6]'
              )}
            >
              {approval.decision === 'APPROVED' ? 'Aprovada' : 'Rejeitada'} por você às{' '}
              {approval.at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {approval.reason && ` — motivo: "${approval.reason}"`}. Registro local de prévia; o
              approval_registry persistirá decisão, versão e hash quando o backend do Bloco 4 entrar.
            </div>
          )}

          <DisclaimerNote />
        </div>
      )}
    </FichaSection>
  )
}
