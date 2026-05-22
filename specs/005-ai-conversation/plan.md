# Implementation Plan: Conversa Contextual com IA

**Branch**: `005-ai-conversation` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)

## Summary

Adicionar campo de conversa ancorada ao ativo na tela `/analysis`, com histórico de sessão, sugestões dinâmicas de follow-up, disclaimer persistente e hard guardrails via system prompt que impedem qualquer recomendação de compra/venda/alocação.

## Technical Context

**Language/Version**: TypeScript 5.7 (Next.js 15) + Python 3.14 (FastAPI)  
**Primary Dependencies**: react-markdown (já instalado), Agno agent (já instalado), OpenRouter/DeepSeek  
**Storage**: React useState apenas (sem DB para esta feature)  
**Testing**: Smoke test manual via browser  
**Target Platform**: PWA mobile (390px viewport) + desktop  
**Project Type**: Web application (Next.js frontend + FastAPI backend)  
**Performance Goals**: Resposta da IA em < 20s  
**Constraints**: Sem recomendações de compra/venda; português obrigatório; disclaimer sempre visível  
**Scale/Scope**: Melhoria incremental na tela de análise existente

## Constitution Check

| Princípio | Status | Nota |
|-----------|--------|------|
| I. Ship First | ✅ | Incremento direto na tela existente, sem nova infra |
| II. Design System | ✅ | Disclaimer e thread usam bull-panel, glassmorphism, design tokens |
| III. AI via Contexto | ✅ ATENÇÃO | Conversa ancorada ao ativo — não é chat genérico. Cada pergunta carrega o ticker, contexto e análise |
| IV. Português | ✅ | System prompt força pt-BR; disclaimer em português |
| V. Mobile-First | ✅ | Input sticky, tap targets ≥ 44px, sugestões em chips horizontais |
| VI. Escopo | ✅ | Melhoria da tela de Análise (já nos 4 screens do MVP) |

**Nota Princípio III**: Esta feature é uma extensão da análise contextual, não um chat aberto. O campo de input só aparece após análise gerada, e cada request envia obrigatoriamente o contexto completo do ativo.

## Project Structure

```text
# Backend
api/app/api/routes/
├── analysis.py          # existente — sem mudança
└── conversation.py      # NOVO — POST /api/v1/conversation

api/app/agent/
└── market_analysis.py   # adicionar método conversation_turn()

# Frontend
web/src/
├── lib/actions/
│   ├── analysis.ts      # existente — sem mudança
│   └── conversation.ts  # NOVO — server action
├── components/analysis/
│   ├── AnalysisClient.tsx        # modificar — adicionar estado de conversa
│   ├── ConversationThread.tsx    # NOVO — lista de turnos
│   ├── ConversationInput.tsx     # NOVO — input + envio
│   ├── ConversationSuggestions.tsx # NOVO — chips de follow-up
│   └── ConversationDisclaimer.tsx  # NOVO — banner + rodapé
```

## Implementation Tasks

### T1 — Backend: método `conversation_turn` no agente
**Arquivo**: `api/app/agent/market_analysis.py`

Adicionar método `async conversation_turn(subject, context, analysis, history, question) -> str` com:
- System prompt dedicado com guardrails explícitos
- Contexto completo do ativo injetado no prompt
- Histórico de mensagens passado para o LLM
- Resposta JSON: `{answer, suggestions, guardrail_triggered}`

System prompt base:
```
Você é um analista de mercado brasileiro que explica sinais e contexto de ativos.
Você NUNCA recomenda comprar, vender, manter ou alocar em qualquer ativo.
Você NUNCA afirma que um ativo vai subir ou cair.
Você SEMPRE responde em português brasileiro.
Você SEMPRE ancora sua resposta ao ativo {subject} e ao contexto fornecido.
Quando o usuário pedir recomendação direta, decline educadamente e ofereça contexto factual.
```

---

### T2 — Backend: endpoint `POST /api/v1/conversation`
**Arquivo novo**: `api/app/api/routes/conversation.py`

```python
POST /api/v1/conversation
Request:  ConversationRequest(subject, context, analysis, history, question)
Response: ConversationResponse(answer, suggestions, guardrail_triggered)
```

Parsing do JSON do LLM idêntico ao `_parse_payload` de `analysis.py` (reutilizar lógica).

Registrar no router principal em `api/app/api/__init__.py`.

---

### T3 — Backend: registrar rota no app
**Arquivo**: `api/app/api/__init__.py` ou `api/app/main.py`

Incluir `conversation.router` com prefix `/api/v1`.

---

### T4 — Frontend: server action `requestConversation`
**Arquivo novo**: `web/src/lib/actions/conversation.ts`

```typescript
export async function requestConversation(
  ticker: string,
  context: Record<string, unknown>,
  analysis: AnalysisSections,
  history: ConversationHistory,
  question: string
): Promise<ConversationResult | null>
```

Tipos:
```typescript
export interface ConversationTurn {
  id: string
  question: string
  answer: string
  suggestions: string[]
}

export type ConversationHistory = Array<{ role: 'user' | 'assistant'; content: string }>

export interface ConversationResult {
  answer: string
  suggestions: string[]
  guardrailTriggered: boolean
}
```

---

### T5 — Frontend: `ConversationDisclaimer`
**Arquivo novo**: `web/src/components/analysis/ConversationDisclaimer.tsx`

Dois modos via prop `variant`:
- `"banner"` — card visível acima do input na primeira vez (sempre mostrado, não dismissível)
- `"footer"` — texto pequeno e sutil abaixo do input

Texto: *"Esta IA pode cometer erros. Não faz recomendações de compra, venda ou alocação de investimentos. Consulte um profissional habilitado."*

---

### T6 — Frontend: `ConversationSuggestions`
**Arquivo novo**: `web/src/components/analysis/ConversationSuggestions.tsx`

Props: `{ suggestions: string[]; onSelect: (s: string) => void; disabled: boolean }`

Chips horizontais com scroll, reutilizando `.bull-suggestion-pill`. Ao clicar, chama `onSelect(suggestion)` que preenche e envia o input.

---

### T7 — Frontend: `ConversationThread`
**Arquivo novo**: `web/src/components/analysis/ConversationThread.tsx`

Props: `{ turns: ConversationTurn[] }`

Para cada turno:
- Pergunta do usuário: alinhada à direita, fundo `bg-white/[0.06]`, `rounded-2xl`
- Resposta da IA: `MarkdownBody` com ícone da marca à esquerda
- Sugestões do turno anterior substituídas pelas do turno atual

---

### T8 — Frontend: `ConversationInput`
**Arquivo novo**: `web/src/components/analysis/ConversationInput.tsx`

Props: `{ onSubmit: (q: string) => void; disabled: boolean; ticker: string }`

- Textarea auto-grow (máx 3 linhas) ou input simples
- Placeholder: `"Pergunte sobre {ticker}…"`
- Botão enviar desabilitado enquanto `disabled=true` ou input vazio
- Enter envia, Shift+Enter quebra linha

---

### T9 — Frontend: integrar tudo em `AnalysisClient`
**Arquivo**: `web/src/components/analysis/AnalysisClient.tsx`

Adicionar abaixo das seções da análise:
1. `ConversationDisclaimer variant="banner"`
2. Sugestões iniciais (derivadas dos artifacts/seções da análise)
3. `ConversationThread` (só quando `turns.length > 0`)
4. `ConversationInput`
5. `ConversationDisclaimer variant="footer"`

Estado adicional:
```typescript
const [turns, setTurns] = useState<ConversationTurn[]>([])
const [sending, setSending] = useState(false)
const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([])
```

`currentSuggestions` começa com sugestões geradas pela análise inicial (do primeiro artifact ou seção mais relevante), depois atualiza com o `suggestions` de cada resposta.

---

## Key Decisions

| Decisão | Escolha |
|---------|---------|
| Persistência | React state apenas (sem DB) |
| Endpoint | Novo `POST /api/v1/conversation` |
| Guardrails | System prompt dedicado + keyword backup |
| Sugestões | LLM gera junto com a resposta (JSON) |
| Server action | Novo `conversation.ts` (padrão existente) |
| Agente | Novo método em `MarketAnalysisAgent` existente |
| Disclaimer | Sempre visível, não dismissível, em dois locais |
