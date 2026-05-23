import { useEffect, useRef } from 'react'
import { MarkdownBody } from '@/components/atoms/MarkdownBody'
import type { ConversationTurn } from '@/lib/actions/conversation'
import { ConversationArtifacts } from './ConversationArtifacts'

interface ConversationThreadProps {
  turns: ConversationTurn[]
  sending: boolean
  loadingArtifacts?: boolean
  ticker?: string
}

export function ConversationThread({ turns, sending, loadingArtifacts, ticker }: ConversationThreadProps) {
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
          <div key={turn.id} className="flex flex-col gap-2.5">
            {/* Pergunta do usuário */}
            <div className="flex justify-end">
              <div className="max-w-[min(86%,48rem)] rounded-[1.25rem] rounded-tr-[4px] border border-white/[0.06] bg-[#0F0C18]/80 px-5 py-3.5 shadow-[inset_0_1px_0px_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.3)] sm:px-6">
                <p className="break-words text-sm font-medium leading-relaxed text-[#F4F0FF]/95">{turn.question}</p>
              </div>
            </div>

            {/* Resposta da IA — só aparece quando há conteúdo */}
            {turn.answer && (
              <div className="flex items-start gap-3">
                <span className="bull-brand-mark mt-2 shrink-0 scale-[1.1] shadow-[0_0_10px_rgba(139,92,246,0.25)]" />
                <div className="min-w-0 flex-1 rounded-[1.25rem] rounded-tl-[4px] border border-white/[0.06] bg-[#0F0C18]/45 px-5 py-[1.125rem] shadow-[inset_0_1px_0px_rgba(255,255,255,0.05),0_4px_14px_rgba(0,0,0,0.25)] transition-all duration-300 sm:px-6 sm:py-5">
                  <MarkdownBody className="text-[#F4F0FF]/85 leading-7 text-sm">{turn.answer}</MarkdownBody>
                  <ConversationArtifacts artifacts={turn.artifacts} ticker={ticker} />
                  {/* Indicador de estado após texto completo */}
                  {isLive && (
                    loadingArtifacts
                      ? (
                        <span className="mt-3 flex items-center gap-2 text-xs text-[#8B5CF6]/60">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1 w-1 rounded-full bg-[#8B5CF6]/50 animate-pulse"
                              style={{ animationDelay: `${i * 180}ms` }}
                            />
                          ))}
                          <span>Montando elementos visuais…</span>
                        </span>
                      )
                      : <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-sm bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Dots — só enquanto aguarda o primeiro token */}
      {sending && (!lastTurn || !lastTurn.answer) && (
        <div className="flex items-start gap-3">
          <span className="bull-brand-mark mt-2 shrink-0 scale-[1.1] shadow-[0_0_10px_rgba(139,92,246,0.25)]" />
          <div className="flex items-center gap-2 rounded-[1.25rem] rounded-tl-[4px] border border-white/[0.06] bg-[#0F0C18]/45 px-5 py-4 shadow-[inset_0_1px_0px_rgba(255,255,255,0.05),0_4px_14px_rgba(0,0,0,0.25)]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6] animate-pulse"
                style={{ animationDelay: `${i * 180}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
