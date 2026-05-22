import Link from 'next/link'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export default function AnalysisCTA() {
  return (
    <section className="bull-panel-focus p-6">
      <GlassHighlight widthPercent={70} />

      <p className="bull-eyebrow">Advisor</p>
      <div className="mt-3 flex flex-col gap-5">
        <div>
          <h2 className="font-serif text-2xl text-[#F4F0FF]">Entenda os sinais de hoje</h2>
          <p className="mt-2 text-sm leading-6 text-[#F4F0FF]/60">
            Veja temperatura, juros e os ativos em destaque para entender o contexto do dia.
          </p>
        </div>
        <Link
          href="/analysis"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#60A5FA]/25 bg-[#3B82F6]/15 px-6 py-3 text-sm font-medium text-[#F4F0FF] transition hover:-translate-y-0.5 hover:bg-[#3B82F6]/25"
        >
          Abrir análise do mercado
        </Link>
      </div>
    </section>
  )
}
