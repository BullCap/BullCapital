import { AssetCard } from './AssetCard'
import { AISummary } from './AISummary'
import { mockData, AI_ANALYSIS } from '@/mocks/assets.mock'

export default function TopAssetsSection() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-16">
      {/* Grid de Ativos */}
      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {mockData.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
      {/* Sumário IA */}
      <AISummary text={AI_ANALYSIS} />
    </section>
  )
}
export { TopAssetsSection }
