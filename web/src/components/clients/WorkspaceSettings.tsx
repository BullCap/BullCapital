'use client'

// Configurações do workspace: réguas de risco (thresholds), parâmetros do FGC,
// preferências do assessor e a tela de memória explícita — regra de design:
// se não está nesta tela, o sistema não pode estar usando. Persistência entra
// com a tabela de config por workspace (Bloco 2/4); a UI fecha o fluxo já.
import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DEMO_FGC_GLOBAL_LIMIT_CENTS,
  DEMO_FGC_PER_INSTITUTION_LIMIT_CENTS,
  DEMO_THRESHOLDS,
} from './demo-payload'
import { formatCents } from './format'

interface MemoryEntry {
  id: string
  label: string
  value: string
}

const INITIAL_MEMORY: MemoryEntry[] = [
  { id: 'mem-1', label: 'Formato preferido', value: 'Resumo executivo, expansível por seção' },
]

function SettingsCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="bull-card-calm p-6 md:p-8">
      <p className="bull-eyebrow">{eyebrow}</p>
      <h2 className="mt-1.5 font-serif text-xl text-starlight md:text-2xl">{title}</h2>
      <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-starlight/45">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function ThresholdField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="bull-stat-label">{label}</span>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={100}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-24 rounded-lg border border-white/[0.07] bg-black/25 px-3 py-2 text-right text-[13px] text-starlight tabular-nums focus:border-amethyst/40 focus:outline-none"
        />
        <span className="text-[12px] text-starlight/40">% da carteira</span>
      </div>
    </label>
  )
}

export function WorkspaceSettings() {
  const [issuerMax, setIssuerMax] = useState(DEMO_THRESHOLDS.issuerMaxWeight * 100)
  const [classMax, setClassMax] = useState(DEMO_THRESHOLDS.assetClassMaxWeight * 100)
  const [institutionMax, setInstitutionMax] = useState(DEMO_THRESHOLDS.institutionMaxWeight * 100)
  const [verbosity, setVerbosity] = useState<'executiva' | 'detalhada'>('executiva')
  const [memory, setMemory] = useState<MemoryEntry[]>(INITIAL_MEMORY)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  return (
    <div className="space-y-6">
      <SettingsCard
        eyebrow="Réguas de risco"
        title="Thresholds de concentração"
        description="Determinam a severidade dos alertas da ficha (informativo, atenção, crítico). Defaults conservadores de demonstração — os números finais são definidos com o escritório no onboarding."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <ThresholdField label="Máx. por emissor" value={issuerMax} onChange={setIssuerMax} />
          <ThresholdField label="Máx. por classe" value={classMax} onChange={setClassMax} />
          <ThresholdField
            label="Máx. por instituição"
            value={institutionMax}
            onChange={setInstitutionMax}
          />
        </div>
        <p className="mt-5 border-t border-white/[0.05] pt-4 text-[11px] leading-5 text-starlight/35">
          As réguas do escritório só podem ser mais conservadoras que o piso do sistema, nunca
          menos.
        </p>
      </SettingsCard>

      <SettingsCard
        eyebrow="FGC"
        title="Parâmetros de cobertura"
        description="Limites vigentes usados no cálculo por CPF × instituição. Parametrizados — não constantes — para acompanhar mudanças regulatórias."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3.5">
            <p className="bull-stat-label">Limite por instituição</p>
            <p className="mt-1.5 text-lg font-medium text-starlight tabular-nums">
              {formatCents(DEMO_FGC_PER_INSTITUTION_LIMIT_CENTS, { compact: true })}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3.5">
            <p className="bull-stat-label">Teto global por CPF</p>
            <p className="mt-1.5 text-lg font-medium text-starlight tabular-nums">
              {formatCents(DEMO_FGC_GLOBAL_LIMIT_CENTS, { compact: true })}
            </p>
          </div>
        </div>
        <p className="mt-5 border-t border-white/[0.05] pt-4 text-[11px] leading-5 text-starlight/35">
          Valores de referência mantidos pela Bull com data de vigência; o escritório não edita o
          limite regulatório, apenas acompanha.
        </p>
      </SettingsCard>

      <SettingsCard
        eyebrow="Preferências do assessor"
        title="Como o sistema fala com você"
        description="Preferências mudam o formato das narrações — nunca a análise. Duas execuções com a mesma evidência produzem a mesma leitura."
      >
        <div className="bull-segmented" role="tablist" aria-label="Verbosidade das narrações">
          <button
            type="button"
            role="tab"
            aria-selected={verbosity === 'executiva'}
            data-active={verbosity === 'executiva'}
            className="bull-tab"
            onClick={() => setVerbosity('executiva')}
          >
            Executiva por padrão
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={verbosity === 'detalhada'}
            data-active={verbosity === 'detalhada'}
            className="bull-tab"
            onClick={() => setVerbosity('detalhada')}
          >
            Detalhada por padrão
          </button>
        </div>
      </SettingsCard>

      <SettingsCard
        eyebrow="Memória explícita"
        title="O que o sistema lembra de você"
        description="Tudo que o sistema usa como preferência está nesta lista — visível, editável e deletável. Se não está na tela, o sistema não está usando."
      >
        {memory.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-6 text-center text-[13px] text-starlight/40">
            Nenhuma preferência registrada. Elas aparecem aqui quando você as definir — nunca por
            inferência silenciosa.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {memory.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-starlight/40">
                    {entry.label}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-starlight/75">{entry.value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMemory((current) => current.filter((item) => item.id !== entry.id))}
                  className="bull-icon-button size-8 shrink-0"
                  aria-label={`Esquecer "${entry.label}"`}
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 border-t border-white/[0.05] pt-4 text-[11px] leading-5 text-starlight/35">
          Memória nunca vira evidência: dado de carteira vem do banco, dado de empresa vem de
          documento citável.
        </p>
      </SettingsCard>

      <div className="flex items-center justify-end gap-3">
        {savedAt && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#b6dcc7]">
            <Check size={13} />
            Preferências registradas às{' '}
            {savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button
          type="button"
          onClick={() => setSavedAt(new Date())}
          className={cn('bull-action-primary')}
        >
          Salvar configurações
        </button>
      </div>
      <p className="text-right text-[11px] text-starlight/35">
        Registro local de prévia — a tabela de configuração por workspace entra com o backend.
      </p>
    </div>
  )
}
