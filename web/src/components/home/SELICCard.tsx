import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface SELICCardProps {
  selic: { rate: string; date: string } | null
}

export default function SELICCard({ selic }: SELICCardProps) {
  return (
    <div className="bull-panel flex min-h-[9.5rem] flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6">
      <GlassHighlight widthPercent={60} />

      <div className="min-w-0">
        <p className="bull-eyebrow">Taxa SELIC</p>
        <p className="mt-2 max-w-[12rem] text-sm leading-5 text-[#DBEAFE]/50">
          Referência para o custo do dinheiro no Brasil.
        </p>
      </div>

      <div className="min-w-0 lg:max-w-[10rem] lg:text-right">
        {selic === null ? (
          <p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
        ) : (
          <>
            <p className="font-serif text-3xl font-bold leading-none text-[#F4F0FF] lg:text-[2.75rem]">
              {selic.rate}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#F4F0FF]/40">Atualizado em {selic.date}</p>
          </>
        )}
      </div>
    </div>
  )
}
