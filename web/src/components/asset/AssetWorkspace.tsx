'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

type AssetView = 'resumo' | 'perfil' | 'historico' | 'noticias'

const ASSET_VIEWS: Array<{ key: AssetView; label: string }> = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'perfil', label: 'Perfil' },
  { key: 'historico', label: 'Histórico' },
  { key: 'noticias', label: 'Notícias' },
]

interface AssetWorkspaceProps {
  analysis: ReactNode
  chart: ReactNode
  news: ReactNode
  profile: ReactNode
  quotes: ReactNode
  radar: ReactNode
}

export default function AssetWorkspace({
  analysis,
  chart,
  news,
  profile,
  quotes,
  radar,
}: AssetWorkspaceProps) {
  const [activeView, setActiveView] = useState<AssetView>('resumo')

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="bull-eyebrow">Leitura do ativo</p>
          <h2 className="mt-1 font-serif text-xl text-starlight">Painel de análise</h2>
        </div>
        <div className="bull-segmented-grid grid-cols-2 sm:inline-grid sm:grid-cols-4">
          {ASSET_VIEWS.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setActiveView(view.key)}
              className="bull-tab"
              data-active={activeView === view.key}
              aria-pressed={activeView === view.key}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'resumo' && (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">{chart}</div>
          <aside className="flex min-w-0 flex-col gap-5">
            {analysis}
            {radar}
          </aside>
        </div>
      )}

      {activeView === 'perfil' && (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0">{profile}</div>
          <aside className="flex min-w-0 flex-col gap-5">
            {analysis}
            {radar}
          </aside>
        </div>
      )}

      {activeView === 'historico' && <div className="min-w-0">{quotes}</div>}

      {activeView === 'noticias' && <div className="min-w-0">{news}</div>}
    </div>
  )
}
