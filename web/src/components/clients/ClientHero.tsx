import Link from 'next/link'
import { FileUp, SlidersHorizontal } from 'lucide-react'
import type { PortfolioDeterministicPayload } from '@/modules/portfolio'
import { StalenessChip } from './atoms'
import { formatCents, formatDate } from './format'

interface ClientHeroProps {
  payload: PortfolioDeterministicPayload
}

/** Stage header of the ficha: who, how much, how fresh — and the two main flows. */
export function ClientHero({ payload }: ClientHeroProps) {
  const { client, snapshot, totals } = payload

  return (
    <section className="bull-advisor-stage p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="bull-eyebrow">Ficha consolidada</p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-starlight md:text-4xl">
            {client.label}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {client.cpfMasked && (
              <span className="bull-chip min-h-7 px-3 py-1 text-[11px]">CPF {client.cpfMasked}</span>
            )}
            <StalenessChip ageDays={snapshot.ageDays} stale={snapshot.stale} />
            <span className="bull-chip min-h-7 px-3 py-1 text-[11px]">
              posição de {formatDate(snapshot.valuationDate)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="bull-stat-label">Patrimônio consolidado</p>
          <p className="mt-2 font-sans text-4xl font-medium tracking-tight text-starlight tabular-nums">
            {formatCents(totals.grossValueCents, { compact: true })}
          </p>
          <p className="mt-1.5 text-[12px] text-starlight/45">
            {totals.positionCount} posições em {totals.institutionCount} instituições
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-5">
        <Link href={`/clients/${client.id}/import`} className="bull-action-primary">
          <FileUp size={15} />
          Reimportar carteira
        </Link>
        <Link href={`/clients/${client.id}/policy`} className="bull-action">
          <SlidersHorizontal size={15} />
          Política-alvo
        </Link>
        <p className="ml-auto text-[11px] text-starlight/35">
          Arquivo {snapshot.sourceFile?.name} · snapshot {snapshot.id.slice(0, 14)}…
        </p>
      </div>
    </section>
  )
}
