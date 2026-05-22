import Link from 'next/link'
import Image from 'next/image'
import { VariationBadge } from '@/components/atoms/VariationBadge'

interface MoverItemProps {
  ticker: string
  name: string
  price: number
  changePercent: number
  logoUrl?: string
  href: string
}

export default function MoverItem({
  ticker,
  name,
  price,
  changePercent,
  logoUrl,
  href,
}: MoverItemProps) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.035] px-4 py-2.5 hover:bg-white/[0.07]"
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#09111D]/70">
        {logoUrl ? (
          <Image src={logoUrl} alt={ticker} fill className="object-cover" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[#8B5CF6]">
            {ticker.slice(0, 2)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-serif text-sm text-[#F4F0FF]">{ticker}</p>
        <p className="truncate text-xs text-[#F4F0FF]/40">{name.slice(0, 22)}</p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <p className="text-sm font-medium text-[#F4F0FF]">
          {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <VariationBadge variation={changePercent} />
      </div>
    </Link>
  )
}
