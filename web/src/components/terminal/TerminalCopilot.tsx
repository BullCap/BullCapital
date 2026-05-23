'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Brain, Landmark, ArrowLeftRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConversationDisclaimer } from '@/components/analysis/ConversationDisclaimer'
import { ConversationInput } from '@/components/analysis/ConversationInput'
import { ConversationSuggestions } from '@/components/analysis/ConversationSuggestions'
import { MarkdownBody } from '@/components/atoms/MarkdownBody'
import { ConversationArtifacts } from '@/components/analysis/ConversationArtifacts'
import type { ConversationTurn, ConversationHistory } from '@/lib/actions/conversation'

interface TerminalCopilotProps {
  activeContext: {
    type: 'dividends' | 'compare' | 'savings'
    title: string
    data: any
  }
}

export default function TerminalCopilot({ activeContext }: TerminalCopilotProps) {
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [sending, setSending] = useState(false)
  const [loadingArtifacts, setLoadingArtifacts] = useState(false)
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([])
  const [history, setHistory] = useState<ConversationHistory>([])
  
  const bottomRef = useRef<HTMLDivElement>(null)

  // Atualiza as sugestões de perguntas baseadas no simulador ativo
  useEffect(() => {
    const { type, data } = activeContext
    let suggestions: string[] = []

    if (type === 'dividends') {
      suggestions = [
        `Como a oscilação da SELIC afeta os dividendos de ${data.ticker}?`,
        `O Número Mágico de ${data.ticker} é sustentável a longo prazo?`,
        `Qual o risco de queda no pagamento de dividendos desse ativo?`,
      ]
    } else if (type === 'compare') {
      suggestions = [
        `Qual das ações entre ${data.tickerA} e ${data.tickerB} é considerada mais defensiva?`,
        `O P/L menor de ${data.tickerA} ou ${data.tickerB} sinaliza desconto real ou armadilha?`,
        `Como a dinâmica setorial de commodities e bancos impacta essa dupla?`,
      ]
    } else if (type === 'savings') {
      suggestions = [
        `Uma taxa anual de ${data.annualYield}% é realista para a B3 no longo prazo?`,
        `Como a inflação brasileira corrói o patrimônio se eu não descontar o IPCA?`,
        `Qual a proporção sugerida para diversificar esse capital na bolsa brasileira?`,
      ]
    }

    setCurrentSuggestions(suggestions)
  }, [activeContext])

  // Scroll automático suave ao receber novas respostas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [turns.length, sending])

  // Aciona a análise estruturada da simulação atual
  const handleAnalyzeSimulation = () => {
    const { type, data } = activeContext
    let promptText = ''

    if (type === 'dividends') {
      promptText = `Analise minha simulação de dividendos para o ativo ${data.ticker}. Tenho ${data.shares} cotas com preço médio de R$ ${data.averageCost} e planejo aportar ${data.monthlyAporte} cotas mensais. Explique o potencial de renda passiva gerada, YOC, viabilidade da meta do Número Mágico e riscos específicos deste ativo na B3.`
    } else if (type === 'compare') {
      promptText = `Analise minha comparação entre os ativos ${data.tickerA} e ${data.tickerB}. Compare os múltiplos de P/L, dividendos e as notas de radar de ambos para me ajudar a entender os pontos fortes e riscos qualitativos de cada um na B3.`
    } else if (type === 'savings') {
      promptText = `Analise minha simulação de juros compostos em renda variável. Estou investindo R$ ${data.initialCapital} iniciais mais R$ ${data.monthlyAporte} mensais a uma taxa de retorno anual de ${data.annualYield}% por ${data.periodYears} anos. O ajuste pela inflação (IPCA) está ${data.adjustInflation ? 'ATIVADO (Ganho Real)' : 'DESATIVADO (Ganho Nominal)'}. Avalie a viabilidade deste cenário no mercado brasileiro.`
    }

    handleQuestion(promptText)
  }

  // Envia perguntas ao streaming da API
  const handleQuestion = async (question: string) => {
    if (sending) return
    setSending(true)

    const turnId = crypto.randomUUID()
    setTurns((prev) => [...prev, { id: turnId, question, answer: '', artifacts: [], suggestions: [] }])
    setCurrentSuggestions([])

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
            simulator: activeContext.type,
            activeTab: activeContext.type,
            simulationData: activeContext.data,
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
            const event = JSON.parse(line.slice(6)) as Record<string, any>
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
              const suggestions = Array.isArray(event.suggestions) ? (event.suggestions as string[]) : []
              const artifacts = Array.isArray(event.artifacts) ? (event.artifacts as any[]) : []
              
              fullAnswer = finalAnswer
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === turnId ? { ...t, answer: finalAnswer, artifacts, suggestions } : t
                )
              )
              setCurrentSuggestions(suggestions)
              setHistory((prev) => [
                ...prev,
                { role: 'user', content: question },
                { role: 'assistant', content: finalAnswer },
              ])
            }
          } catch (_) {
            // Ignora SSEs malformados
          }
        }
      }
      if (displayInterval) {
        clearInterval(displayInterval)
        displayInterval = 0
      }
    } catch (err) {
      const errMsg = 'Não consegui me conectar com a IA da BullCapital. Tente novamente em instantes.'
      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, answer: errMsg } : t))
      )
    }

    setSending(false)
  }

  return (
    <div className="relative rounded-[2rem] border border-white/10 bg-[#1A1625]/40 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.4)] overflow-hidden p-5 flex flex-col gap-4 min-h-[500px] max-h-[820px]">
      {/* Brilho Shimmer Superior */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Cabeçalho do Copiloto */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
            <Brain size={15} />
          </div>
          <span className="text-xs uppercase tracking-widest text-[#F4F0FF]/60 font-semibold font-serif">
            Copiloto de IA
          </span>
        </div>
        <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[#F4F0FF]/40 font-semibold">
          Contextual
        </span>
      </div>

      {/* Painel Central: Chat Thread */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 max-h-[460px] min-h-[220px]">
        {turns.length === 0 ? (
          // Estado Vazio / Tela Inicial
          <div className="my-auto flex flex-col items-center py-6 text-center">
            <span className="bull-advisor-orb animate-pulse-glow mb-4">
              <Sparkles size={24} className="text-[#8B5CF6]" />
            </span>
            <h3 className="font-serif text-base font-semibold text-[#F4F0FF]">Dúvidas sobre a simulação?</h3>
            <p className="mt-2 text-xs leading-5 text-[#F4F0FF]/50 max-w-xs">
              Preencha os valores na esquerda e clique no botão abaixo. Eu irei ler sua estratégia de juros ou dividendos e sugerir ajustes, alertar riscos setoriais e prever cenários reais.
            </p>

            {/* Ação Principal: Analisar Simulação */}
            <button
              onClick={handleAnalyzeSimulation}
              disabled={sending}
              className="mt-6 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#8B5CF6]/80 text-[#F4F0FF] text-xs font-bold hover:scale-[1.03] active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(139,92,246,0.25)] border border-white/10 disabled:opacity-40 disabled:scale-100 cursor-pointer"
            >
              <Sparkles size={13} />
              Analisar Simulação Atual ✦
            </button>
          </div>
        ) : (
          // Thread de Conversa Ativo
          <div className="flex flex-col gap-4">
            {turns.map((turn, i) => {
              const isLive = sending && i === turns.length - 1 && turn.answer !== ''
              return (
                <div key={turn.id} className="flex flex-col gap-2">
                  {/* Mensagem do Usuário */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-[1.25rem] rounded-tr-[4px] border border-white/[0.06] bg-[#0F0C18]/80 px-4 py-2.5 shadow-md">
                      <p className="break-words text-xs leading-relaxed text-[#F4F0FF]/90">
                        {turn.question}
                      </p>
                    </div>
                  </div>

                  {/* Resposta do Copiloto */}
                  {turn.answer && (
                    <div className="flex items-start gap-2.5">
                      <span className="bull-brand-mark shrink-0 scale-[0.8] mt-1 shadow-[0_0_8px_rgba(139,92,246,0.3)]" />
                      <div className="min-w-0 flex-1 rounded-[1.25rem] rounded-tl-[4px] border border-white/[0.06] bg-[#0F0C18]/45 px-4 py-3 shadow-md">
                        <MarkdownBody className="text-[#F4F0FF]/85 leading-6 text-xs">{turn.answer}</MarkdownBody>
                        <ConversationArtifacts artifacts={turn.artifacts} />
                        {isLive && (
                          loadingArtifacts ? (
                            <span className="mt-2.5 flex items-center gap-1.5 text-[10px] text-[#8B5CF6]/60">
                              {[0, 1, 2].map((dot) => (
                                <span
                                  key={dot}
                                  className="h-0.5 w-0.5 rounded-full bg-[#8B5CF6]/50 animate-pulse"
                                  style={{ animationDelay: `${dot * 180}ms` }}
                                />
                              ))}
                              <span>Montando elementos...</span>
                            </span>
                          ) : (
                            <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse rounded-sm bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Dots indicando que a IA está gerando */}
            {sending && (!turns[turns.length - 1] || !turns[turns.length - 1].answer) && (
              <div className="flex items-start gap-2.5">
                <span className="bull-brand-mark shrink-0 scale-[0.8] mt-1 shadow-[0_0_8px_rgba(139,92,246,0.3)]" />
                <div className="flex items-center gap-1.5 rounded-[1.25rem] rounded-tl-[4px] border border-white/[0.06] bg-[#0F0C18]/45 px-4 py-3 shadow-md">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1 w-1 rounded-full bg-[#8B5CF6] shadow-[0_0_4px_#8B5CF6] animate-pulse"
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
            onClick={handleAnalyzeSimulation}
            disabled={sending}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-[#C4B5FD] hover:bg-[#8B5CF6]/10 transition disabled:opacity-40 cursor-pointer"
          >
            <Sparkles size={11} />
            Analisar Cenário Atual Novamente ✦
          </button>
        )}

        <ConversationSuggestions
          suggestions={currentSuggestions}
          onSelect={handleQuestion}
          disabled={sending}
        />

        <ConversationInput
          onSubmit={handleQuestion}
          disabled={sending}
          subjectLabel={activeContext.title}
        />

        <ConversationDisclaimer variant="footer" className="mt-1" />
      </div>
    </div>
  )
}
