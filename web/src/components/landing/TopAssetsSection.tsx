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

  return `Entre os maiores ativos por valor de mercado, ${lead.stock} lidera a amostra Brapi PRO com ${lead.change.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}% no pregão. A leitura agregada mostra ${direction} e serve como contexto, não recomendação.`
}

export default function TopAssetsSection({ assets }: TopAssetsSectionProps) {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-16">
      {/* Grid de Ativos */}
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
          <div className="col-span-full rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-8 text-center text-sm text-[#F4F0FF]/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
            Dados indisponíveis
          </div>
        )}
      </div>
      {/* Leitura determinística a partir dos dados reais carregados */}
      <AISummary text={buildSummary(assets)} />
    </section>
  )
}
export { TopAssetsSection }
