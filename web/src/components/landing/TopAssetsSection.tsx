import { AssetCard } from './AssetCard'
import { AISummary } from './AISummary'
import type { MarketListingItem } from '@/types/market'

interface TopAssetsSectionProps {
  assets: MarketListingItem[]
}

function buildSummary(assets: MarketListingItem[]) {
  const lead = assets[0]
  if (!lead) return 'Dados reais de mercado indisponíveis no momento.'

  const positiveCount = assets.filter((asset) => asset.change >= 0).length
  const direction =
    positiveCount > assets.length / 2
      ? 'predomínio de altas'
      : positiveCount === 0
        ? 'predomínio de quedas'
        : 'movimento misto'

  return `Entre os maiores ativos por valor de mercado, ${lead.stock} lidera a amostra com ${lead.change.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}% no pregão. A leitura agregada mostra ${direction} e serve como contexto, não recomendação.`
}

export default function TopAssetsSection({ assets }: TopAssetsSectionProps) {
  return (
    <section className="flex w-full flex-col gap-8">
      <div>
        <p className="bull-eyebrow">Ativos líderes</p>
        <h2 className="mt-2 font-serif text-3xl font-medium text-starlight md:text-4xl">
          Preço e variação em cards calmos.
        </h2>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {assets.length > 0 ? (
          assets.slice(0, 4).map((asset) => (
            <AssetCard
              key={asset.stock}
              asset={{
                id: asset.stock,
                name: asset.stock,
                value: asset.close.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                variation: asset.change,
                history: [],
              }}
            />
          ))
        ) : (
          <div className="bull-card-calm col-span-full p-8 text-center text-sm text-starlight/45">
            Dados indisponíveis
          </div>
        )}
      </div>
      <AISummary text={buildSummary(assets)} />
    </section>
  )
}
export { TopAssetsSection }
