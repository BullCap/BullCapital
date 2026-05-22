import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface SELICCardProps {
  selic: { rate: string; date: string } | null
}

export default function SELICCard({ selic }: SELICCardProps) {
  return (
    <div className="bull-panel flex items-center justify-between gap-4 p-6">
      <GlassHighlight widthPercent={60} />

      <div>
        <p className="bull-eyebrow">Taxa SELIC</p>
        <p className="mt-2 max-w-[11rem] text-sm leading-5 text-[#DBEAFE]/50">
          Referência para o custo do dinheiro no Brasil.
        </p>
      </div>

      <div className="text-right">
        {selic === null ? (
          <p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
        ) : (
          <>
            <p className="font-serif text-3xl font-bold text-[#F4F0FF]">{selic.rate}</p>
            <p className="mt-1 text-xs text-[#F4F0FF]/40">Atualizado em {selic.date}</p>
          </>
        )}
      </div>
    </div>
  )
}
