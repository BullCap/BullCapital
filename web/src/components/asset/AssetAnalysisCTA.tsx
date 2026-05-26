import Link from 'next/link'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface AssetAnalysisCTAProps {
  ticker: string
}

export default function AssetAnalysisCTA({ ticker }: AssetAnalysisCTAProps) {
  return (
    <section className="bull-panel-focus p-4">
      <GlassHighlight widthPercent={70} />

      <div className="flex flex-col gap-4">
        <div>
          <p className="bull-eyebrow">Análise</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">{ticker.toUpperCase()}</h2>
        </div>
        <Link
          href={'/analysis?ticker=' + ticker}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#60A5FA]/20 bg-[#3B82F6]/12 px-4 text-sm font-medium text-[#F4F0FF]/90 transition hover:bg-[#3B82F6]/18"
        >
          Abrir leitura
        </Link>
      </div>
    </section>
  )
}
