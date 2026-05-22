import Link from 'next/link'
import { ArrowRight, Bot, Compass, Newspaper } from 'lucide-react'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface PlaybookAction {
  description: string
  href: string
  label: string
  title: string
  tone: 'analysis' | 'asset' | 'news'
}

interface MarketPlaybookSectionProps {
  actions: PlaybookAction[]
}

const TONE_ICONS = {
  analysis: Bot,
  asset: Compass,
  news: Newspaper,
} as const

export default function MarketPlaybookSection({ actions }: MarketPlaybookSectionProps) {
  return (
    <section className="bull-panel-focus h-full p-5 md:p-6">
      <GlassHighlight widthPercent={68} />

      <p className="bull-eyebrow">Playbook</p>
      <div className="mt-3 max-w-xl">
        <h2 className="font-serif text-[1.95rem] leading-tight text-[#F4F0FF]">
          Proximos passos para transformar sinal em contexto
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#F4F0FF]/62">
          Use o fluxo abaixo para sair do painel e entrar no motivo por tras do movimento.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {actions.map((action) => {
          const Icon = TONE_ICONS[action.tone]

          return (
            <Link
              key={`${action.href}-${action.title}`}
              href={action.href}
              className="bull-panel-quiet flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#F4F0FF]/76">
                <Icon size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#F4F0FF]">{action.title}</p>
                <p className="mt-1 text-sm leading-5 text-[#F4F0FF]/62">{action.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[#DBEAFE]/44">{action.label}</p>
              </div>
              <ArrowRight size={16} className="mt-1 shrink-0 text-[#F4F0FF]/28" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
