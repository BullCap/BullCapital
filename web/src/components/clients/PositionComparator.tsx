'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { PortfolioPosition } from '@/modules/portfolio'
import { FichaSection, MethodologyNote } from './atoms'
import { ASSET_CLASS_LABELS, formatCents, formatDate, formatWeight } from './format'

const MAX_COMPARED = 4

interface PositionComparatorProps {
  positions: PortfolioPosition[]
}

interface AttributeRow {
  label: string
  value: (position: PortfolioPosition) => string
}

const ATTRIBUTES: AttributeRow[] = [
  { label: 'Classe', value: (p) => ASSET_CLASS_LABELS[p.assetClass] },
  { label: 'Emissor', value: (p) => p.issuer ?? '—' },
  { label: 'Instituição', value: (p) => p.institution },
  { label: 'Valor bruto', value: (p) => formatCents(p.grossValueCents, { compact: true }) },
  { label: 'Peso na carteira', value: (p) => formatWeight(p.weight) },
  { label: 'Indexador', value: (p) => p.indexer ?? '—' },
  { label: 'Taxa contratada', value: (p) => p.rate ?? '—' },
  { label: 'Vencimento', value: (p) => (p.maturityDate ? formatDate(p.maturityDate) : '—') },
]

/**
 * Comparação de atributos lado a lado — a alternativa estruturada ao "qual é melhor".
 * Exibe fatos contratados das posições; o veredito é sempre do assessor.
 */
export function PositionComparator({ positions }: PositionComparatorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selected = positions.filter((position) => selectedIds.includes(position.id))

  const toggle = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_COMPARED) return current
      return [...current, id]
    })
  }

  return (
    <FichaSection
      eyebrow="Comparador"
      title="Atributos lado a lado"
      description={`Selecione de 2 a ${MAX_COMPARED} posições para comparar taxa, prazo, indexador e peso — sem veredito: a leitura é do assessor.`}
    >
      <div className="flex flex-wrap gap-2">
        {positions.map((position) => {
          const active = selectedIds.includes(position.id)
          const disabled = !active && selectedIds.length >= MAX_COMPARED
          return (
            <button
              key={position.id}
              type="button"
              onClick={() => toggle(position.id)}
              disabled={disabled}
              aria-pressed={active}
              className={cn(
                'bull-chip min-h-8 cursor-pointer px-3 py-1 text-[12px] transition-colors duration-300',
                active
                  ? 'border-amethyst/35 bg-amethyst/[0.14] text-starlight'
                  : 'hover:border-white/[0.12] hover:text-starlight/85',
                disabled && 'cursor-not-allowed opacity-40'
              )}
            >
              {position.ticker ?? position.assetLabel}
            </button>
          )
        })}
      </div>

      {selected.length >= 2 ? (
        <div className="mt-6 overflow-x-auto">
          <div
            className="grid min-w-[36rem] gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.04]"
            style={{ gridTemplateColumns: `9rem repeat(${selected.length}, minmax(10rem, 1fr))` }}
          >
            <div className="bg-[#0D1018]/90 px-4 py-3" />
            {selected.map((position) => (
              <div key={position.id} className="bg-[#0D1018]/90 px-4 py-3">
                <p className="truncate font-serif text-[15px] text-starlight">{position.assetLabel}</p>
                {position.ticker && (
                  <p className="text-[11px] uppercase tracking-[0.12em] text-starlight/40">
                    {position.ticker}
                  </p>
                )}
              </div>
            ))}
            {ATTRIBUTES.map((attribute) => (
              <div key={attribute.label} className="contents">
                <div className="bg-[#0A0D13]/90 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-starlight/40">
                  {attribute.label}
                </div>
                {selected.map((position) => (
                  <div
                    key={`${attribute.label}-${position.id}`}
                    className="bg-[#0A0D13]/90 px-4 py-2.5 text-[13px] text-starlight/75 tabular-nums"
                  >
                    {attribute.value(position)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-[12px] text-starlight/35">
          {selected.length === 1
            ? 'Selecione mais uma posição para abrir a comparação.'
            : 'Nenhuma posição selecionada.'}
        </p>
      )}

      <MethodologyNote>
        Atributos contratuais e pesos vêm do snapshot importado. Rentabilidade contratada é fato
        citável; o sistema não projeta retorno nem ordena posições por atratividade.
      </MethodologyNote>
    </FichaSection>
  )
}
