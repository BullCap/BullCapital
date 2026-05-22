import { useEffect, useRef } from 'react'
import { MarkdownBody } from '@/components/atoms/MarkdownBody'
import type { ConversationTurn } from '@/lib/actions/conversation'

interface ConversationThreadProps {
  turns: ConversationTurn[]
  sending: boolean
}

export function ConversationThread({ turns, sending }: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const turnCount = turns.length

  // Scroll apenas quando um novo turno é criado — não em cada token do stream
  useEffect(() => {
    if (turnCount === 0) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [turnCount, sending])

  if (!turnCount && !sending) return null

  // O último turno com answer ainda vazia está sendo streamado
  const lastTurn = turns[turns.length - 1]
  const isStreaming = sending && lastTurn && lastTurn.answer !== ''

  return (
    <div className="flex flex-col gap-4">
      {turns.map((turn, i) => {
        const isLive = isStreaming && i === turns.length - 1
        return (
          <div key={turn.id} className="flex flex-col gap-2">
            {/* Pergunta do usuário */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-white/[0.07] px-4 py-2.5">
                <p className="text-sm text-[#F4F0FF]/90">{turn.question}</p>
              </div>
            </div>

            {/* Resposta da IA — só aparece quando há conteúdo */}
            {turn.answer && (
              <div className="flex items-start gap-2.5">
                <span className="bull-brand-mark mt-1 shrink-0 scale-[1.1]" />
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <MarkdownBody className="text-[#F4F0FF]/80">{turn.answer}</MarkdownBody>
                  {/* Cursor pulsando enquanto streaming */}
                  {isLive && (
                    <span className="mt-1 inline-block h-3.5 w-0.5 animate-pulse rounded-sm bg-[#8B5CF6]/70" />
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Dots — só enquanto aguarda o primeiro token */}
      {sending && (!lastTurn || !lastTurn.answer) && (
        <div className="flex items-start gap-2.5">
          <span className="bull-brand-mark mt-1 shrink-0 scale-[1.1]" />
          <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.03] px-4 py-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]/60 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
