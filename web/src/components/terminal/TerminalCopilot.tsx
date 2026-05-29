'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { ConversationDisclaimer } from '@/components/analysis/ConversationDisclaimer'
import { ConversationInput } from '@/components/analysis/ConversationInput'
import { MarkdownBody } from '@/components/atoms/MarkdownBody'
import { ConversationArtifacts } from '@/components/analysis/ConversationArtifacts'
import type { ConversationTurn, ConversationHistory, ConversationArtifact } from '@/lib/actions/conversation'
import type { TerminalAssetSnapshot } from './terminal-metrics'

export interface TerminalCopilotContext {
  type: 'terminal'
  title: string
  data: {
    watchlist: string[]
    focusedTicker: string | null
    compareSet: string[]
    selectedAssets: TerminalAssetSnapshot[]
  }
}

interface TerminalCopilotProps {
  activeContext: TerminalCopilotContext
}

export default function TerminalCopilot({ activeContext }: TerminalCopilotProps) {
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [sending, setSending] = useState(false)
  const [loadingArtifacts, setLoadingArtifacts] = useState(false)
  const [history, setHistory] = useState<ConversationHistory>([])

  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll automático suave ao receber novas respostas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [turns.length, sending])

  // Aciona a leitura estruturada do contexto atual.
  const handleAnalyzeContext = () => {
    const { data } = activeContext
    const selectedTickers = data.compareSet.length >= 2
      ? data.compareSet
      : data.focusedTicker
        ? [data.focusedTicker]
        : data.watchlist.slice(0, 1)
    const selectedLabel = selectedTickers.join(', ')
    const watchlistLabel = data.watchlist.join(', ')

    const promptText = data.compareSet.length >= 2
      ? `Analise a carteira de trabalho formada por ${selectedLabel}. Use as métricas já carregadas no terminal para contextualizar patrimônio, P&L, risco de concentração e diferenças entre posições. Não faça recomendação de compra, venda ou alocação. Radar atual: ${watchlistLabel}.`
      : `Analise o ativo em foco ${selectedLabel || 'da mesa do analista'}. Use preço, variação e métricas disponíveis para construir uma leitura contextual em português brasileiro, sem recomendação. Radar atual: ${watchlistLabel}.`

    handleQuestion(promptText)
  }

  // Envia perguntas ao streaming da API
  const handleQuestion = async (question: string) => {
    if (sending) return
    setSending(true)

    const turnId = crypto.randomUUID()
    setTurns((prev) => [...prev, { id: turnId, question, answer: '', artifacts: [], suggestions: [] }])

    let fullAnswer = ''
    setLoadingArtifacts(false)

    // Efeito de streaming por palavras
    let receivedText = ''
    let displayedWords = 0
    let displayInterval = 0

    const startWordInterval = () => {
      if (displayInterval) return
      displayInterval = window.setInterval(() => {
        const words = receivedText.split(' ')
        if (displayedWords >= words.length) return
        displayedWords++
        const shown = words.slice(0, displayedWords).join(' ')
        setTurns((prev) =>
          prev.map((t) => (t.id === turnId ? { ...t, answer: shown } : t))
        )
      }, 65) // Streaming suave e rápido
    }

    try {
      const res = await fetch('/api/conversation/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `simulador_${activeContext.type}`,
          context: {
            simulator: 'terminal',
            activeTab: 'terminal',
            simulationData: activeContext.data,
            terminalData: activeContext.data,
            title: activeContext.title,
          },
          analysis: {},
          history,
          question,
        }),
      })

      if (!res.ok || !res.body) throw new Error('stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as Record<string, unknown>
            if (event.type === 'text') {
              receivedText = String(event.text ?? '')
              fullAnswer = receivedText
              startWordInterval()
            } else if (event.type === 'loading') {
              setLoadingArtifacts(true)
            } else if (event.type === 'done') {
              setLoadingArtifacts(false)
              if (displayInterval) {
                clearInterval(displayInterval)
                displayInterval = 0
              }
              const finalAnswer = String(event.answer ?? fullAnswer)
              const artifacts = Array.isArray(event.artifacts) ? (event.artifacts as ConversationArtifact[]) : []

              fullAnswer = finalAnswer
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === turnId ? { ...t, answer: finalAnswer, artifacts, suggestions: [] } : t
                )
              )
              setHistory((prev) => [
                ...prev,
                { role: 'user', content: question },
                { role: 'assistant', content: finalAnswer },
              ])
            }
          } catch {
            // Ignora SSEs malformados
          }
        }
      }
      if (displayInterval) {
        clearInterval(displayInterval)
        displayInterval = 0
      }
    } catch {
      const errMsg = 'Não consegui me conectar com a IA da BullCapital. Tente novamente em instantes.'
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, answer: errMsg } : t))
      )
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Painel Central: Chat Thread */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-[180px]">
        {turns.length === 0 ? (
          <div className="my-auto flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-xs leading-5 text-[#F4F0FF]/45 max-w-xs">
              Analise o radar, o ativo em foco ou a carteira de trabalho aberta.
            </p>
            <button
              onClick={handleAnalyzeContext}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#8B5CF6] text-[#F4F0FF] text-xs font-bold hover:bg-[#7C3AED] transition disabled:opacity-40 cursor-pointer"
            >
              <Sparkles size={12} />
              Analisar contexto
            </button>
          </div>
        ) : (
          // Thread de Conversa Ativo
          <div className="flex flex-col gap-4">
            {turns.map((turn, i) => {
              const isLive = sending && i === turns.length - 1 && turn.answer !== ''
              return (
                <div key={turn.id} className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg border border-white/[0.06] bg-[#0F0C18]/80 px-3 py-2">
                      <p className="break-words text-xs leading-relaxed text-[#F4F0FF]/90">
                        {turn.question}
                      </p>
                    </div>
                  </div>

                  {turn.answer && (
                    <div className="flex items-start gap-2.5">
                      <span className="bull-brand-mark shrink-0 scale-[0.8] mt-1" />
                      <div className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-[#0F0C18]/45 px-3 py-2.5">
                        <MarkdownBody className="text-[#F4F0FF]/85 leading-6 text-xs">{turn.answer}</MarkdownBody>
                        <ConversationArtifacts artifacts={turn.artifacts} />
                        {isLive && (
                          loadingArtifacts ? (
                            <span className="mt-2 flex items-center gap-1">
                              {[0, 1, 2].map((dot) => (
                                <span
                                  key={dot}
                                  className="h-1 w-1 rounded-full bg-[#8B5CF6]/50 animate-pulse"
                                  style={{ animationDelay: `${dot * 180}ms` }}
                                />
                              ))}
                            </span>
                          ) : (
                            <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse rounded-sm bg-[#8B5CF6]" />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {sending && (!turns[turns.length - 1] || !turns[turns.length - 1].answer) && (
              <div className="flex items-start gap-2.5">
                <span className="bull-brand-mark shrink-0 scale-[0.8] mt-1" />
                <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[#0F0C18]/45 px-3 py-2.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1 w-1 rounded-full bg-[#8B5CF6] animate-pulse"
                      style={{ animationDelay: `${dot * 180}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Caixa de Entrada e Sugestões do Copiloto */}
      <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
        {turns.length > 0 && (
          <button
            onClick={handleAnalyzeContext}
            disabled={sending}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md border border-white/10 bg-white/[0.03] text-xs font-semibold text-[#C4B5FD] hover:bg-[#8B5CF6]/10 transition disabled:opacity-40 cursor-pointer"
          >
            <Sparkles size={11} />
            Analisar novamente
          </button>
        )}

        <ConversationInput
          onSubmit={handleQuestion}
          disabled={sending}
          subjectLabel="terminal"
        />

        <ConversationDisclaimer variant="footer" className="mt-1" />
      </div>
    </div>
  )
}
