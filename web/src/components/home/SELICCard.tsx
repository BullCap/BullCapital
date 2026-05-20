import { GlassHighlight } from '@/components/atoms/GlassHighlight'

interface SELICCardProps {
  selic: { rate: string; date: string } | null
}

export default function SELICCard({ selic }: SELICCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1625]/40 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_6px_rgba(0,0,0,0.6),0_10px_20px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <GlassHighlight widthPercent={60} />

      <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#F4F0FF]/55">
        Taxa SELIC
      </p>

      {selic === null ? (
        <p className="text-sm text-[#F4F0FF]/40">Dados indisponíveis</p>
      ) : (
        <>
          <p className="font-serif text-3xl font-bold text-[#F4F0FF]">{selic.rate}</p>
          <p className="mt-1 text-xs text-[#F4F0FF]/40">Atualizado em {selic.date}</p>
        </>
      )}
    </div>
  )
}
