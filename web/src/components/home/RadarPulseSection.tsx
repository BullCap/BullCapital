import Link from 'next/link'
import { ArrowRight, ScanSearch } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

export interface RadarPulseItem {
  description: string
  href: string
  label: string
  ticker: string
  tone: 'up' | 'down' | 'neutral'
}

const TONE_STYLES: Record<RadarPulseItem['tone'], string> = {
  up: 'border-[#4ADE80]/20 bg-[#4ADE80]/10 text-[#D7FCE5]',
  down: 'border-[#FB7185]/20 bg-[#FB7185]/10 text-[#FFE0E6]',
  neutral: 'border-[#60A5FA]/20 bg-[#60A5FA]/10 text-[#DBEAFE]',
}

interface RadarPulseSectionProps {
  items: RadarPulseItem[]
}

export default function RadarPulseSection({ items }: RadarPulseSectionProps) {
  return (
    <section className="bull-panel h-full p-5 md:p-6">
      <GlassHighlight widthPercent={58} />

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="bull-eyebrow">Radar do dia</p>
          <h2 className="mt-2 font-serif text-xl text-[#F4F0FF]">Nomes para acompanhar</h2>
        </div>
        <ScanSearch size={16} className="text-[#DBEAFE]/42" />
      </div>

      {items.length === 0 ? (
        <div className="mt-5 flex h-24 items-center justify-center rounded-[1.5rem] border border-white/[0.06] bg-black/15 px-6 text-center">
          <p className="text-sm text-[#F4F0FF]/42">O radar volta assim que os sinais do dia estiverem disponiveis.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <Link
              key={`${item.ticker}-${item.label}`}
              href={item.href}
              className="bull-panel-quiet flex items-start gap-3 p-3.5 transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
            >
              <span
                className={`inline-flex min-h-8 shrink-0 items-center rounded-full border px-3 text-[11px] font-medium ${TONE_STYLES[item.tone]}`}
              >
                {item.ticker}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#F4F0FF]">{item.label}</p>
                <p className="mt-1 text-sm leading-5 text-[#F4F0FF]/62">{item.description}</p>
              </div>
              <ArrowRight size={15} className="mt-1 shrink-0 text-[#F4F0FF]/28" />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
