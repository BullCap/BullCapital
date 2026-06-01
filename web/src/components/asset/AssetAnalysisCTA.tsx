import Link from 'next/link'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface AssetAnalysisCTAProps {
  ticker: string
}

export default function AssetAnalysisCTA({ ticker }: AssetAnalysisCTAProps) {
  return (
    <section className="bull-frame p-4">
      <GlassHighlight widthPercent={70} />

      <div className="flex flex-col gap-4">
        <div>
          <p className="bull-eyebrow">Copiloto</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Leitura contextual</h2>
          <p className="mt-1 text-sm leading-6 text-starlight/45">
            Abra uma análise ancorada em {ticker.toUpperCase()}, sem recomendação de compra ou venda.
          </p>
        </div>
        <Link
          href={'/analysis?ticker=' + ticker}
          className="bull-action-primary min-h-11"
        >
          Abrir leitura
        </Link>
      </div>
    </section>
  )
}
