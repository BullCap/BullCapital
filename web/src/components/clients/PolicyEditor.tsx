'use client'

// CRUD da política-alvo (alocação por classe). O delta na ficha é aritmética
// desta política — o sistema computa a diferença, nunca sugere movimentação.
// Persistência entra com o domínio portfolio (Bloco 2); o editor já fecha o
// fluxo e a validação de soma = 100%.
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioAssetClass } from '@/modules/portfolio'
import { ASSET_CLASS_LABELS } from './format'

interface PolicyRow {
  assetClass: PortfolioAssetClass
  targetPct: number
}

const DEFAULT_ROWS: PolicyRow[] = [
  { assetClass: 'FIXED_INCOME', targetPct: 35 },
  { assetClass: 'TREASURY', targetPct: 25 },
  { assetClass: 'FUND', targetPct: 15 },
  { assetClass: 'EQUITY', targetPct: 15 },
  { assetClass: 'FII', targetPct: 5 },
  { assetClass: 'CASH', targetPct: 5 },
]

/** Classes da V1 — derivativos/COE/cripto ficam fora por regra de produto. */
const AVAILABLE_CLASSES: PortfolioAssetClass[] = [
  'FIXED_INCOME',
  'TREASURY',
  'FUND',
  'EQUITY',
  'FII',
  'ETF',
  'CASH',
  'OTHER',
]

interface PolicyEditorProps {
  clientId: string
  clientName: string
}

export function PolicyEditor({ clientId, clientName }: PolicyEditorProps) {
  const [scope, setScope] = useState<'client' | 'workspace'>('client')
  const [rows, setRows] = useState<PolicyRow[]>(DEFAULT_ROWS)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const total = useMemo(() => rows.reduce((sum, row) => sum + (row.targetPct || 0), 0), [rows])
  const valid = Math.abs(total - 100) < 0.001 && rows.length > 0
  const unusedClasses = AVAILABLE_CLASSES.filter(
    (assetClass) => !rows.some((row) => row.assetClass === assetClass)
  )

  const updateRow = (assetClass: PortfolioAssetClass, targetPct: number) => {
    setSavedAt(null)
    setRows((current) =>
      current.map((row) => (row.assetClass === assetClass ? { ...row, targetPct } : row))
    )
  }

  return (
    <div className="space-y-5">
      <Link
        href={`/clients/${clientId}`}
        className="inline-flex items-center gap-1.5 text-[12px] text-starlight/45 transition-colors hover:text-starlight/75"
      >
        <ArrowLeft size={13} />
        Voltar para a ficha de {clientName}
      </Link>

      <div className="bull-card-calm p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="bull-eyebrow">Política-alvo</p>
            <h2 className="mt-1.5 font-serif text-xl text-starlight md:text-2xl">
              Alocação planejada por classe
            </h2>
            <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-starlight/45">
              A política é sua: o sistema só computa o delta entre a carteira e estes alvos.
            </p>
          </div>
          <div className="bull-segmented" role="tablist" aria-label="Escopo da política">
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'client'}
              data-active={scope === 'client'}
              className="bull-tab"
              onClick={() => setScope('client')}
            >
              Deste cliente
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'workspace'}
              data-active={scope === 'workspace'}
              className="bull-tab"
              onClick={() => setScope('workspace')}
            >
              Padrão do workspace
            </button>
          </div>
        </div>

        <ul className="mt-7 space-y-3">
          {rows.map((row) => (
            <li key={row.assetClass} className="flex items-center gap-4">
              <span className="w-44 shrink-0 text-[13px] text-starlight/75">
                {ASSET_CLASS_LABELS[row.assetClass]}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={row.targetPct}
                onChange={(event) => updateRow(row.assetClass, Number(event.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/[0.06] accent-[#82759F]"
                aria-label={`Alvo para ${ASSET_CLASS_LABELS[row.assetClass]}`}
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={row.targetPct}
                  onChange={(event) => updateRow(row.assetClass, Number(event.target.value))}
                  className="w-16 rounded-lg border border-white/[0.07] bg-black/25 px-2 py-1.5 text-right text-[13px] text-starlight tabular-nums focus:border-amethyst/40 focus:outline-none"
                />
                <span className="text-[12px] text-starlight/40">%</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSavedAt(null)
                  setRows((current) => current.filter((item) => item.assetClass !== row.assetClass))
                }}
                className="bull-icon-button size-8"
                aria-label={`Remover ${ASSET_CLASS_LABELS[row.assetClass]}`}
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>

        {unusedClasses.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.14em] text-starlight/35">
              Adicionar classe
            </span>
            {unusedClasses.map((assetClass) => (
              <button
                key={assetClass}
                type="button"
                onClick={() => {
                  setSavedAt(null)
                  setRows((current) => [...current, { assetClass, targetPct: 0 }])
                }}
                className="bull-chip min-h-8 cursor-pointer px-3 py-1 text-[12px] hover:border-white/[0.12] hover:text-starlight/85"
              >
                <Plus size={11} />
                {ASSET_CLASS_LABELS[assetClass]}
              </button>
            ))}
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-5">
          <p
            className={cn(
              'text-[13px] tabular-nums',
              valid ? 'text-starlight/55' : 'font-medium text-[#ead9ad]'
            )}
          >
            Soma dos alvos:{' '}
            {total.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
            {!valid && ' — precisa fechar em 100%'}
          </p>
          <div className="flex items-center gap-3">
            {savedAt && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#b6dcc7]">
                <Check size={13} />
                Política registrada às{' '}
                {savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              disabled={!valid}
              onClick={() => setSavedAt(new Date())}
              className="bull-action-primary"
            >
              Salvar política
            </button>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-starlight/35">
          Registro local de prévia — a persistência versionada da política entra com o domínio
          portfolio (núcleo determinístico).
        </p>
      </div>
    </div>
  )
}
