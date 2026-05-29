'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Activity,
  AlertTriangle,
  ArrowUp,
  BarChart3,
  ChevronDown,
  CheckCircle2,
  Circle,
  Database,
  FileSearch,
  Image,
  MessageSquare,
  Mic,
  Newspaper,
  PanelLeft,
  PenLine,
  Plus,
  Radar,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import type { ConversationArtifact } from '@/lib/actions/conversation'
import { ConversationArtifacts } from '@/components/analysis/ConversationArtifacts'
import { getFreeModels } from '@/lib/actions/analysis'
import { GlassHighlight } from '@/components/atoms/GlassHighlight'
import { MarkdownBody } from '@/components/atoms/MarkdownBody'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  artifacts?: ConversationArtifact[]
  error?: boolean
  streaming?: boolean
}

type Conversation = {
  id: string
  title: string
  messages: ChatMessage[]
}

type AgentName =
  | 'orquestrador'
  | 'mercado'
  | 'noticias'
  | 'relatorio'
  | 'risco'
  | 'usuario'
  | 'curador'

type AgentStatus = 'pending' | 'running' | 'completed' | 'warning' | 'error'

type AgentTraceEvent = {
  id: string
  type:
    | 'run.started'
    | 'orchestrator.plan'
    | 'agent.started'
    | 'tool.called'
    | 'artifact.created'
    | 'agent.completed'
    | 'fallback.used'
    | 'curator.completed'
    | 'run.completed'
    | 'run.failed'
  agent: AgentName
  title: string
  detail?: string
  status: AgentStatus
  timestamp: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: 'Comparar ativos', icon: Image, prompt: 'Compare PETR4 e VALE3 de forma contextual.' },
  { label: 'Escrever briefing', icon: PenLine, prompt: 'Escreva um briefing breve sobre o mercado hoje.' },
  { label: 'Buscar contexto', icon: FileSearch, prompt: 'Busque contexto sobre os principais movimentos do dia.' },
]

const TAGLINES = [
  'Analise o mercado com precisão',
  'Gerencie carteiras com facilidade e IA',
  'Monitore ativos em tempo real',
  'Gere briefings inteligentes em segundos',
  'Tome decisões com contexto e dados',
  'Transforme dados em narrativa clara',
]

const AGENT_META: Record<
  AgentName,
  {
    label: string
    description: string
    icon: ComponentType<{ size?: number; className?: string }>
  }
> = {
  orquestrador: {
    label: 'Orquestrador',
    description: 'Define plano e escopo',
    icon: Route,
  },
  mercado: {
    label: 'Mercado',
    description: 'Consulta dados e métricas',
    icon: Database,
  },
  noticias: {
    label: 'Notícias',
    description: 'Busca contexto editorial',
    icon: Newspaper,
  },
  relatorio: {
    label: 'Relatório',
    description: 'Estrutura artefatos',
    icon: BarChart3,
  },
  risco: {
    label: 'Risco',
    description: 'Mapeia ressalvas',
    icon: Radar,
  },
  usuario: {
    label: 'Usuário',
    description: 'Aplica contexto permitido',
    icon: UserRound,
  },
  curador: {
    label: 'Curador',
    description: 'Revisa política editorial',
    icon: ShieldCheck,
  },
}

function createConversation(): Conversation {
  return { id: crypto.randomUUID(), title: 'Nova conversa', messages: [] }
}

function createTraceEvent(
  event: Omit<AgentTraceEvent, 'id' | 'timestamp'> & Partial<Pick<AgentTraceEvent, 'id' | 'timestamp'>>,
): AgentTraceEvent {
  return {
    id: event.id ?? crypto.randomUUID(),
    timestamp: event.timestamp ?? new Date().toISOString(),
    ...event,
  }
}

function statusLabel(status: AgentStatus) {
  if (status === 'running') return 'em execução'
  if (status === 'completed') return 'concluído'
  if (status === 'warning') return 'fallback'
  if (status === 'error') return 'erro'
  return 'aguardando'
}

function statusIcon(status: AgentStatus) {
  if (status === 'completed') return CheckCircle2
  if (status === 'warning' || status === 'error') return AlertTriangle
  if (status === 'running') return Activity
  return Circle
}

// ── Sub-components ───────────────────────────────────────────────────────────

function AnimatedTagline() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      const t = setTimeout(() => {
        setIndex((i) => (i + 1) % TAGLINES.length)
        setVisible(true)
      }, 350)
      return () => clearTimeout(t)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  return (
    <p
      className="mt-3 text-[18px] font-light tracking-wide text-[#bdb7c9]"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 350ms ease' }}
    >
      {TAGLINES[index]}
    </p>
  )
}

function IconButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md text-[#bdb7c9] transition-colors hover:bg-white/[0.06] hover:text-white',
        active && 'bg-[#8B5CF6]/20 text-[#F4F0FF]',
      )}
    >
      <Icon size={18} />
    </button>
  )
}

function SuggestionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.09] bg-[#07030a] px-4 text-sm text-[#d8d4df] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(0,0,0,0.35)] transition hover:border-[#8B5CF6]/30 hover:bg-[#1A1625] hover:text-white"
    >
      <Icon size={17} className="text-[#d1c9df]" />
      <span className="font-extrabold">{label}</span>
    </button>
  )
}

function ExecutionPanel({
  events,
  active,
  compact,
}: {
  events: AgentTraceEvent[]
  active: boolean
  compact?: boolean
}) {
  const latestByAgent = events.reduce<Partial<Record<AgentName, AgentTraceEvent>>>((acc, event) => {
    acc[event.agent] = event
    return acc
  }, {})
  const visibleAgents = (Object.keys(AGENT_META) as AgentName[]).filter((agent) => latestByAgent[agent])
  const timeline = events.slice(-8)

  return (
    <aside
      className={cn(
        'relative overflow-hidden border border-white/10 bg-[#1A1625]/45 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),inset_0_-2px_8px_rgba(0,0,0,0.45),0_18px_50px_rgba(0,0,0,0.44)]',
        compact ? 'rounded-[1.5rem] p-4' : 'sticky top-6 rounded-[2rem] p-5',
      )}
    >
      <GlassHighlight widthPercent={72} />
      <div className="pointer-events-none absolute -right-12 top-0 h-32 w-32 rounded-full bg-[#8B5CF6]/10 blur-[90px]" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#9f92b6]">
              Execução
            </p>
            <h2 className="mt-1 font-serif text-[22px] leading-tight text-[#F4F0FF]">
              Sistema em operação
            </h2>
          </div>
          <span
            className={cn(
              'inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-bold uppercase tracking-[0.12em]',
              active
                ? 'border-[#8B5CF6]/30 bg-[#8B5CF6]/12 text-[#D9CCFF]'
                : 'border-white/10 bg-white/[0.03] text-[#8f879d]',
            )}
          >
            {active ? 'ativo' : 'ocioso'}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="mt-6 rounded-[1.25rem] border border-white/[0.07] bg-[#0D0B14]/70 p-4 text-sm leading-6 text-[#a8a0b4] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            Aguardando uma solicitação ancorada em ativo, evento ou indicador.
          </div>
        ) : (
          <>
            <div className={cn('mt-5 grid gap-2', compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
              {visibleAgents.map((agent) => {
                const event = latestByAgent[agent]
                if (!event) return null

                const meta = AGENT_META[agent]
                const Icon = meta.icon
                const StatusIcon = statusIcon(event.status)

                return (
                  <div
                    key={agent}
                    className="relative overflow-hidden rounded-[1.25rem] border border-white/[0.07] bg-[#0D0B14]/70 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.24)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#D7C9F7]">
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-[#F4F0FF]">
                          {meta.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-[#8f879d]">
                          {meta.description}
                        </span>
                      </span>
                      <StatusIcon
                        size={16}
                        className={cn(
                          'shrink-0',
                          event.status === 'running' && 'animate-pulse text-[#A78BFA]',
                          event.status === 'completed' && 'text-[#B9A8E8]',
                          event.status === 'warning' && 'text-[#D9B36F]',
                          event.status === 'error' && 'text-[#F43F5E]',
                          event.status === 'pending' && 'text-[#6b6478]',
                        )}
                      />
                    </div>
                    <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-[#bdb7c9]">
                      {event.title}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8f879d]">
                Timeline
              </p>
              <div className="space-y-3">
                {timeline.map((event, index) => {
                  const meta = AGENT_META[event.agent]

                  return (
                    <div key={event.id} className="relative flex gap-3">
                      {index < timeline.length - 1 && (
                        <span className="absolute left-[5px] top-5 h-[calc(100%+0.75rem)] w-px bg-white/[0.07]" />
                      )}
                      <span
                        className={cn(
                          'relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full border',
                          event.status === 'running' && 'border-[#A78BFA] bg-[#8B5CF6] shadow-[0_0_16px_rgba(139,92,246,0.55)]',
                          event.status === 'completed' && 'border-[#B9A8E8] bg-[#B9A8E8]/70',
                          event.status === 'warning' && 'border-[#D9B36F] bg-[#D9B36F]/70',
                          event.status === 'error' && 'border-[#F43F5E] bg-[#F43F5E]/80',
                          event.status === 'pending' && 'border-white/20 bg-white/10',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[12px] font-bold text-[#F4F0FF]">
                            {meta.label}
                          </span>
                          <span className="shrink-0 text-[11px] text-[#70687d]">
                            {statusLabel(event.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-5 text-[#aaa2b5]">
                          {event.title}
                        </p>
                        {event.detail ? (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#766f82]">
                            {event.detail}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function ChatMessageBlock({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="ml-auto max-w-[82%] rounded-2xl bg-[#1A1625] px-4 py-3 text-[15px] leading-7 text-[#f4f0ff]"
      >
        {message.content}
      </motion.div>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'max-w-[760px]',
        message.error ? 'text-[#c9748a]' : 'text-[#ded9e8]',
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-xs text-[#8f879d]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-[#d8c8f5]">
          <Sparkles size={14} />
        </span>
        Bull
      </div>
      {message.content ? (
        <div className="relative">
          <MarkdownBody className={cn('text-[16px] leading-8', message.error && 'text-[#c9748a]')}>
            {message.content}
          </MarkdownBody>
          {message.streaming && (
            <span className="ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-[#8B5CF6]" />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 py-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8B5CF6]"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      )}
      {message.artifacts?.length ? <ConversationArtifacts artifacts={message.artifacts} /> : null}
    </motion.article>
  )
}

function ConversationItem({
  conv,
  isActive,
  isRenaming,
  onSelect,
  onStartRename,
  onRename,
  onDelete,
}: {
  conv: Conversation
  isActive: boolean
  isRenaming: boolean
  onSelect: () => void
  onStartRename: () => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(conv.title)

  useEffect(() => {
    if (isRenaming) {
      setDraft(conv.title)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isRenaming, conv.title])

  function commit(value: string) {
    onRename(value.trim() || conv.title)
  }

  return (
    <div
      onClick={isRenaming ? undefined : onSelect}
      className={cn(
        'group relative flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm',
        isActive
          ? 'bg-white/[0.07] text-[#f3f0fa]'
          : 'text-[#c9c5d4] hover:bg-white/[0.06]',
      )}
    >
      <MessageSquare size={14} className="shrink-0 text-[#6b6478]" />

      {isRenaming ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit(draft)
            }
            if (e.key === 'Escape') commit(conv.title)
          }}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#f3f0fa] outline-none"
        />
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate">{conv.title}</span>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              aria-label="Renomear conversa"
              onClick={(e) => { e.stopPropagation(); onStartRename() }}
              className="flex h-5 w-5 items-center justify-center rounded hover:text-[#c9c5d4]"
            >
              <PenLine size={12} className="text-[#6b6478]" />
            </button>
            <button
              type="button"
              aria-label="Deletar conversa"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="flex h-5 w-5 items-center justify-center rounded hover:text-[#c9748a]"
            >
              <Trash2 size={12} className="text-[#6b6478]" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function MinimalChatClient() {
  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchActive, setSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Available free models
  const [openrouterActive, setOpenrouterActive] = useState(false)
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([])
  const [selectedModel, setSelectedModel] = useState<string>('')

  useEffect(() => {
    async function loadModels() {
      const data = await getFreeModels()
      if (data && data.openrouter_active && data.models.length > 0) {
        setOpenrouterActive(true)
        setModels(data.models)
        const hasDeepseek = data.models.some(m => m.id === 'deepseek/deepseek-v4-flash:free')
        if (hasDeepseek) {
          setSelectedModel('deepseek/deepseek-v4-flash:free')
        } else {
          setSelectedModel(data.models[0].id)
        }
      }
    }
    loadModels()
  }, [])

  // Conversations — initialConv ref ensures both useState calls share the same ID
  const initialConv = useRef(createConversation())
  const [conversations, setConversations] = useState<Conversation[]>([initialConv.current])
  const [activeConvId, setActiveConvId] = useState<string>(initialConv.current.id)
  const [traceByConversation, setTraceByConversation] = useState<Record<string, AgentTraceEvent[]>>({})

  // Input / network
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Derived
  const activeConv = conversations.find((c) => c.id === activeConvId) ?? conversations[0]
  const messages = activeConv?.messages ?? []
  const activeTrace = traceByConversation[activeConvId] ?? []
  const isEmpty = messages.length === 0 && !loading
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const filteredConvs = searchQuery
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversations

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages.length, loading])

  useEffect(() => {
    if (searchActive) requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [searchActive])

  // ── Conversation actions ───────────────────────────────────────────────────

  function newConversation() {
    const conv = createConversation()
    setConversations((prev) => [conv, ...prev])
    setActiveConvId(conv.id)
    setTraceByConversation((prev) => ({ ...prev, [conv.id]: [] }))
    setDraft('')
    setSearchQuery('')
    setSearchActive(false)
    setMobileSidebarOpen(false)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function selectConversation(id: string) {
    setActiveConvId(id)
    setMobileSidebarOpen(false)
  }

  function commitRename(id: string, title: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
    setRenamingId(null)
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id)
      if (remaining.length === 0) {
        const fresh = createConversation()
        setActiveConvId(fresh.id)
        setTraceByConversation({ [fresh.id]: [] })
        return [fresh]
      }
      if (id === activeConvId) {
        const deletedIndex = prev.findIndex((c) => c.id === id)
        const next = remaining[Math.min(deletedIndex, remaining.length - 1)]
        setActiveConvId(next.id)
      }
      return remaining
    })
    setTraceByConversation((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function addMessage(convId: string, message: ChatMessage) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, message] } : c,
      ),
    )
  }

  function updateMessage(
    convId: string,
    messageId: string,
    updater: (message: ChatMessage) => ChatMessage,
  ) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((message) =>
                message.id === messageId ? updater(message) : message,
              ),
            }
          : c,
      ),
    )
  }

  function autoTitle(convId: string, question: string) {
    const title = question.length > 46 ? question.slice(0, 46).trimEnd() + '…' : question
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId && c.title === 'Nova conversa' ? { ...c, title } : c,
      ),
    )
  }

  function setTrace(convId: string, events: AgentTraceEvent[]) {
    setTraceByConversation((prev) => ({ ...prev, [convId]: events }))
  }

  function appendTrace(convId: string, event: AgentTraceEvent) {
    setTraceByConversation((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] ?? []), event].slice(-40),
    }))
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    const question = draft.trim()
    if (!question || loading) return

    const convId = activeConv.id
    const history = activeConv.messages
      .filter((message) => message.content.trim())
      .slice(-10)
      .map((message) => ({ role: message.role, content: message.content }))
    const assistantId = crypto.randomUUID()

    addMessage(convId, { id: crypto.randomUUID(), role: 'user', content: question })
    addMessage(convId, { id: assistantId, role: 'assistant', content: '', artifacts: [], streaming: true })
    autoTitle(convId, question)
    setTrace(convId, [
      createTraceEvent({
        type: 'run.started',
        agent: 'orquestrador',
        title: 'Solicitação recebida',
        detail: 'Preparando plano de execução para a conversa atual.',
        status: 'running',
      }),
    ])
    setDraft('')
    setLoading(true)

    try {
      const res = await fetch('/api/openrouter/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: question }],
          model: selectedModel || undefined,
        }),
      })

      if (!res.ok || !res.body) {
        const message = await res.text().catch(() => 'Falha no stream')
        throw new Error(message || `OpenRouter retornou ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split('\n\n')
        buffer = frames.pop() ?? ''

        for (const frame of frames) {
          const data = frame
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('')

          if (!data) continue

          const payload = JSON.parse(data) as
            | { type: 'delta'; delta: string }
            | { type: 'trace'; event: AgentTraceEvent }
            | {
                type: 'done'
                answer: string
                artifacts: ConversationArtifact[]
                suggestions: string[]
                guardrail_triggered: boolean
              }
            | { type: 'error'; message: string }

          if (payload.type === 'delta') {
            updateMessage(convId, assistantId, (message) => ({
              ...message,
              content: message.content + payload.delta,
              streaming: true,
            }))
          }

          if (payload.type === 'trace') {
            appendTrace(convId, {
              ...payload.event,
              id: payload.event.id ?? crypto.randomUUID(),
              timestamp: payload.event.timestamp ?? new Date().toISOString(),
            })
          }

          if (payload.type === 'done') {
            updateMessage(convId, assistantId, (message) => ({
              ...message,
              content: payload.answer || message.content,
              artifacts: Array.isArray(payload.artifacts) ? payload.artifacts : [],
              streaming: false,
            }))
          }

          if (payload.type === 'error') {
            throw new Error(payload.message)
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      appendTrace(
        convId,
        createTraceEvent({
          type: 'run.failed',
          agent: 'orquestrador',
          title: 'Execução interrompida',
          detail: msg,
          status: 'error',
        }),
      )
      updateMessage(convId, assistantId, (message) => ({
        ...message,
        content: `Não foi possível obter resposta do OpenRouter: ${msg}`,
        artifacts: [],
        error: true,
        streaming: false,
      }))
    } finally {
      setLoading(false)
    }
  }

  // ── Sidebar content (shared by desktop + mobile) ──────────────────────────

  const sidebarContent = (
    <div className="flex h-screen w-[280px] flex-col border-r border-white/[0.06] bg-[#07030a]">
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="bull-brand-mark" />
          <span className="font-serif text-[19px] text-[#f4f0ff]">Bullcapital</span>
        </div>
        <IconButton
          icon={PanelLeft}
          label="Recolher barra lateral"
          onClick={() => {
            setSidebarOpen(false)
            setMobileSidebarOpen(false)
          }}
        />
      </div>

      <div className="space-y-0.5 px-2">
        <button
          type="button"
          onClick={newConversation}
          className="flex h-9 w-full items-center gap-3 rounded-md px-2 text-left text-sm text-[#c9c5d4] transition-colors hover:bg-white/[0.06]"
        >
          <Plus size={17} className="shrink-0 text-[#a79bbd]" />
          <span className="truncate">Nova conversa</span>
        </button>

        {searchActive ? (
          <div className="flex h-9 items-center gap-2 rounded-md bg-white/[0.04] px-2">
            <Search size={15} className="shrink-0 text-[#8f879d]" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[#f4f0ff] outline-none placeholder:text-[#6b6478]"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchActive(false)
                  setSearchQuery('')
                }
              }}
            />
            <button
              type="button"
              aria-label={searchQuery ? 'Limpar busca' : 'Fechar busca'}
              onClick={() => {
                if (searchQuery) {
                  setSearchQuery('')
                } else {
                  setSearchActive(false)
                }
              }}
            >
              <X size={14} className="text-[#6b6478] hover:text-[#c9c5d4]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchActive(true)}
            className="flex h-9 w-full items-center gap-3 rounded-md px-2 text-left text-sm text-[#c9c5d4] transition-colors hover:bg-white/[0.06]"
          >
            <Search size={17} className="shrink-0 text-[#a79bbd]" />
            <span className="truncate">Buscar conversas</span>
          </button>
        )}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2">
        {filteredConvs.length === 0 ? (
          <p className="px-2 text-[12px] leading-5 text-[#6f6f6f]">
            {searchQuery ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda.'}
          </p>
        ) : (
          <div className="space-y-0.5">
            {filteredConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConvId}
                isRenaming={renamingId === conv.id}
                onSelect={() => selectConversation(conv.id)}
                onStartRename={() => setRenamingId(conv.id)}
                onRename={(title) => commitRename(conv.id, title)}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-white/[0.06]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d8d2c5] text-sm font-semibold text-[#151319]">
            J
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[#f1edf8]">João</span>
            <span className="block truncate text-xs text-[#857e8f]">Bull Research</span>
          </span>
          <ChevronDown size={16} className="shrink-0 text-[#82798e]" />
        </button>
      </div>
    </div>
  )

  // ── Composer ──────────────────────────────────────────────────────────────

  const composer = (
    <div className="w-full max-w-[900px]">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-white/[0.08] bg-[#1A1625] px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_18px_60px_rgba(0,0,0,0.55)]"
      >
        <div className="flex min-h-[7.5rem] flex-col gap-4">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Pergunte sobre um ativo, índice ou tema de mercado"
            className="max-h-40 min-h-16 w-full flex-1 resize-none bg-transparent text-[16px] leading-6 text-[#f4f0ff] outline-none placeholder:text-[#8f8f8f]"
            rows={3}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
          />
          <div className="flex items-center justify-between gap-3">
            <IconButton icon={Plus} label="Adicionar contexto" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-sm text-[#aaa2b5] transition hover:bg-white/[0.05] sm:flex"
              >
                Bullcapital
                <ChevronDown size={14} />
              </button>
              <IconButton icon={Mic} label="Voz" />
              <button
                type="submit"
                aria-label="Enviar"
                disabled={!draft.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6] text-white transition-colors hover:bg-[#9F7AEA] disabled:cursor-not-allowed disabled:bg-[#352d44] disabled:text-[#8f879d]"
              >
                <ArrowUp size={19} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )

  const compactComposer = (
    <div className="w-full max-w-[860px]">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-white/[0.08] bg-[#1A1625] px-4 py-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_12px_36px_rgba(0,0,0,0.45)]"
      >
        <div className="flex min-h-10 items-center gap-3">
          <IconButton icon={Plus} label="Adicionar contexto" />
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Pergunte sobre um ativo, índice ou tema de mercado"
            className="max-h-28 min-h-8 flex-1 resize-none bg-transparent py-2 text-[16px] leading-6 text-[#f4f0ff] outline-none placeholder:text-[#8f8f8f]"
            rows={1}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
          />
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-sm text-[#aaa2b5] transition hover:bg-white/[0.05] sm:flex"
          >
            Bullcapital
            <ChevronDown size={14} />
          </button>
          <IconButton icon={Mic} label="Voz" />
          <button
            type="submit"
            aria-label="Enviar"
            disabled={!draft.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6] text-white transition-colors hover:bg-[#9F7AEA] disabled:cursor-not-allowed disabled:bg-[#352d44] disabled:text-[#8f879d]"
          >
            <ArrowUp size={19} />
          </button>
        </div>
      </form>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex min-h-screen bg-[#050108] text-[#f4f0ff]">
      {/* Desktop sidebar */}
      <div
        className="relative hidden shrink-0 md:block"
        style={{
          width: sidebarOpen ? 280 : 48,
          transition: 'width 240ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Full sidebar */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? 'auto' : 'none',
            transition: 'opacity 160ms ease',
          }}
        >
          {sidebarContent}
        </div>

        {/* Collapsed rail */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: sidebarOpen ? 0 : 1,
            pointerEvents: sidebarOpen ? 'none' : 'auto',
            transition: 'opacity 160ms ease',
          }}
          className="flex h-screen w-12 flex-col border-r border-white/[0.06] bg-[#07030a]"
        >
          <div className="flex h-14 shrink-0 items-center justify-center">
            <IconButton
              icon={PanelLeft}
              label="Expandir barra lateral"
              onClick={() => setSidebarOpen(true)}
            />
          </div>
          <div className="space-y-0.5 px-1.5">
            <IconButton icon={Plus} label="Nova conversa" onClick={newConversation} />
            <IconButton
              icon={Search}
              label="Buscar"
              onClick={() => {
                setSidebarOpen(true)
                setSearchActive(true)
              }}
            />
          </div>
          <div className="mt-auto flex h-16 shrink-0 items-center justify-center border-t border-white/[0.07]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8d2c5] text-sm font-semibold text-[#151319]">
              J
            </span>
          </div>
        </div>
      </div>

      {/* Mobile sidebar — spring slide from left */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative h-full w-[82vw] max-w-[320px]"
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <section className="relative flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-12 shrink-0 items-center gap-2 px-3 md:hidden">
          <IconButton
            icon={PanelLeft}
            label="Abrir menu"
            onClick={() => setMobileSidebarOpen(true)}
          />
          <span className="flex-1 truncate text-center text-sm font-medium text-[#d9d4e5]">
            {activeConv?.title}
          </span>
          <IconButton icon={Plus} label="Nova conversa" onClick={newConversation} />
        </div>

        <div className="mx-auto flex w-full max-w-[1380px] flex-1 flex-col px-5 pb-32 pt-8 md:px-8 md:pt-11">
          {isEmpty ? (
            <div className="flex flex-1 justify-center text-center">
              <div className="flex w-full max-w-[900px] flex-col items-center pt-[27vh]">
                <p className="mb-1 font-serif text-[38px] leading-none text-[#f4f0ff] md:text-[48px]">
                  {greeting}, João
                </p>
                <AnimatedTagline />
                <div className="mt-10 flex w-full justify-center">{composer}</div>
                <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-3">
                  {SUGGESTIONS.map((s) => (
                    <SuggestionButton
                      key={s.label}
                      icon={s.icon}
                      label={s.label}
                      onClick={() => setDraft(s.prompt)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,900px)_360px] xl:items-start xl:justify-center">
              <div className="min-w-0 space-y-6">
                {activeTrace.length ? (
                  <div className="xl:hidden">
                    <ExecutionPanel events={activeTrace} active={loading} compact />
                  </div>
                ) : null}
                <div className="space-y-9">
                  {messages.map((m) => (
                    <ChatMessageBlock key={m.id} message={m} />
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>
              <div className="hidden xl:block">
                <ExecutionPanel events={activeTrace} active={loading} />
              </div>
            </div>
          )}
        </div>

        {!isEmpty && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t from-[#050108] via-[#050108] to-transparent px-4 pb-4 pt-14">
            <div className="pointer-events-auto w-full max-w-[900px]">{compactComposer}</div>
          </div>
        )}

        <button
          type="button"
          aria-label="Configurações"
          className="absolute right-4 top-4 hidden h-9 w-9 items-center justify-center rounded-md text-[#bdb7c9] transition-colors hover:bg-white/[0.06] hover:text-white md:inline-flex"
        >
          <Settings2 size={18} />
        </button>
      </section>
    </main>
  )
}
