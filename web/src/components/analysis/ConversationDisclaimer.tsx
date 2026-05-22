import { cn } from '@/lib/utils'

interface ConversationDisclaimerProps {
  variant: 'banner' | 'footer'
  className?: string
}

const DISCLAIMER_TEXT =
  'Esta IA pode cometer erros. Não faz recomendações de compra, venda ou alocação de investimentos. Consulte um profissional habilitado.'

export function ConversationDisclaimer({ variant, className }: ConversationDisclaimerProps) {
  return (
    <p
      className={cn(
        'text-center text-[11px] leading-5 text-[#F4F0FF]/30',
        variant === 'banner' ? 'px-2' : 'px-1',
        className
      )}
    >
      {DISCLAIMER_TEXT}
    </p>
  )
}
