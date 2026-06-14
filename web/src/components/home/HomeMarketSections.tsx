import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import PanelGrid from '@/components/layout/PanelGrid'
import { AssetList, type AssetRowData } from './AssetList'
import { getHomeHighlightsSnapshot } from '@/modules/market'
import type { MarketListingItem } from '@/types/market'
import MarketTreemap from './MarketTreemap'

function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `Vol. R$ ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} bi`
  if (value >= 1_000_000) return `Vol. R$ ${(value / 1_000_000).toFixed(0)} mi`
  if (value >= 1_000) return `Vol. R$ ${(value / 1_000).toFixed(0)} mil`
  return `Vol. R$ ${value}`
}

function toAssetRows(rows: MarketListingItem[]): AssetRowData[] {
  return rows.map((row) => ({
    ticker: row.stock,
    name: row.name,
    price: row.close,
    change: row.change,
  }))
}

function toVolumeRows(rows: MarketListingItem[]): AssetRowData[] {
  return rows.map((row) => ({
    ticker: row.stock,
    name: row.name,
    secondary: formatVolume(row.volume),
    price: row.close,
    change: row.change,
  }))
}

/**
 * Block — cabeçalho leve sobre superfície flat (sem moldura/Panel). Título +
 * hint opcional (metodologia via tooltip nativo) e conteúdo direto na página.
 */
function Block({
  title,
  hint,
  className,
  children,
}: {
  title: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <header className="mb-3 flex items-center gap-1.5 px-2">
        <h3 className="text-lg font-medium text-ink">{title}</h3>
        {hint ? (
          <span
            title={hint}
            aria-label={hint}
            className="inline-flex cursor-help text-ink-faint transition-colors hover:text-ink-muted"
          >
            <Info className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </header>
      {children}
    </div>
  )
}

function EmptyNote({ label }: { label: string }) {
  return <p className="px-2 py-8 text-center text-sm text-ink-muted">{label}</p>
}

/**
 * HomeMarketSections — blocos de visualização de mercado da home em superfície
 * flat (sem caixas): maiores altas/baixas e mais negociadas como listas de
 * cards roláveis; mapa de calor da Ibovespa via treemap. PanelGrid de 12 colunas.
 */
export async function HomeMarketSections() {
  const snapshot = await getHomeHighlightsSnapshot()

  const gainers = toAssetRows(snapshot.gainers.stocks)
  const losers = toAssetRows(snapshot.losers.stocks)
  const mostTraded = toVolumeRows(snapshot.mostTraded.stocks)
  const treemapCells = snapshot.treemapQuotes.results.map((quote) => ({
    ticker: quote.symbol,
    change: quote.regularMarketChangePercent ?? null,
  }))

  const lists: { title: string; hint?: string; rows: AssetRowData[] }[] = [
    { title: 'Maiores altas', rows: gainers },
    { title: 'Maiores baixas', rows: losers },
    { title: 'Mais negociadas', hint: 'Ações com maior volume financeiro no pregão.', rows: mostTraded },
  ]

  return (
    <section className="mt-12 border-t border-hairline pt-16 md:mt-16 md:pt-20">
      <PanelGrid className="gap-y-16 md:gap-x-12">
        {lists.map((list) => (
          <Block key={list.title} title={list.title} hint={list.hint} className="md:col-span-4">
            {list.rows.length > 0 ? (
              <div className="max-h-[420px] overflow-y-auto pr-1">
                <AssetList rows={list.rows} />
              </div>
            ) : (
              <EmptyNote label="Sem dados de mercado no momento." />
            )}
          </Block>
        ))}

        <Block
          title="Mapa do mercado"
          hint="Áreas pelo peso na Ibovespa; cor pelo retorno do dia."
          className="mt-2 border-t border-hairline pt-16 md:col-span-12 md:mt-4 md:pt-20"
        >
          {treemapCells.length > 0 ? (
            <MarketTreemap cells={treemapCells} />
          ) : (
            <EmptyNote label="Mapa indisponível no momento." />
          )}
        </Block>
      </PanelGrid>
    </section>
  )
}

export function HomeMarketSectionsSkeleton() {
  return (
    <section className="mt-12 border-t border-hairline pt-16 md:mt-16 md:pt-20" aria-hidden>
      <div className="grid grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-x-12">
        {[0, 1, 2].map((i) => (
          <div key={i} className="md:col-span-4">
            <div className="mb-3 h-5 w-28 animate-pulse rounded-full bg-ink/6" />
            <div className="flex flex-col gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-12 animate-pulse rounded-control bg-ink/6" />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-2 border-t border-hairline pt-16 md:col-span-12 md:mt-4 md:pt-20">
          <div className="mb-3 h-5 w-36 animate-pulse rounded-full bg-ink/6" />
          <div className="h-[360px] animate-pulse rounded-control bg-ink/6 sm:h-[420px]" />
        </div>
      </div>
    </section>
  )
}
