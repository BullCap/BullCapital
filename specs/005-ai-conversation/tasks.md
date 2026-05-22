# Tasks: Conversa Contextual com IA

**Input**: Design documents from `/specs/005-ai-conversation/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Organization**: Tasks agrupadas por user story para entrega incremental independente.

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Tipos TypeScript e estrutura de arquivos novos antes de qualquer implementação.

- [ ] T001 Criar tipos `ConversationTurn`, `ConversationHistory`, `ConversationResult` em `web/src/lib/actions/conversation.ts`
- [ ] T002 [P] Criar arquivo vazio `api/app/api/routes/conversation.py` com imports base (FastAPI, Pydantic, router)
- [ ] T003 [P] Criar arquivos de componente vazios: `web/src/components/analysis/ConversationDisclaimer.tsx`, `ConversationSuggestions.tsx`, `ConversationThread.tsx`, `ConversationInput.tsx`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Backend funcionando end-to-end antes de qualquer UI.

**⚠️ CRÍTICO**: Nenhuma task de UI pode começar até esta fase estar completa.

- [ ] T004 Adicionar método `async conversation_turn(self, subject, context, analysis, history, question) -> str` em `api/app/agent/market_analysis.py` com system prompt de guardrail completo e prompt builder que injeta contexto do ativo + histórico
- [ ] T005 Implementar `ConversationRequest` e `ConversationResponse` (Pydantic) e função `_build_conversation_prompt` em `api/app/api/routes/conversation.py`
- [ ] T006 Implementar `_parse_conversation_payload` (reutiliza lógica de strip de code fences de `analysis.py`) e endpoint `POST /api/v1/conversation` em `api/app/api/routes/conversation.py`
- [ ] T007 Registrar `conversation.router` no app em `api/app/api/__init__.py`
- [ ] T008 Implementar server action `requestConversation` em `web/src/lib/actions/conversation.ts` com fetch para `${ANALYSIS_API_URL}/conversation`, tipos exportados e tratamento de erro

**Checkpoint**: Testar com `curl -X POST http://localhost:8001/api/v1/conversation` com payload de PETR4. Deve retornar `{answer, suggestions, guardrail_triggered}` em português.

---

## Phase 3: User Story 1 — Primeira pergunta + disclaimer (Priority: P1) 🎯 MVP

**Goal**: Usuário vê disclaimer, digita pergunta sobre PETR4, recebe resposta contextualizada sem recomendação.

**Independent Test**: Acesse `/analysis?ticker=PETR4`, aguarde análise, envie pergunta livre. Valide disclaimer visível, resposta em português, sem buy/sell.

### Implementação US1

- [ ] T009 [US1] Implementar `ConversationDisclaimer` em `web/src/components/analysis/ConversationDisclaimer.tsx` — props `{ variant: 'banner' | 'footer' }`, banner como `bull-panel` com ícone de aviso e texto completo do disclaimer, footer como `<p>` small semitransparente, ambos sempre visíveis (não dismissíveis)
- [ ] T010 [US1] Implementar `ConversationInput` em `web/src/components/analysis/ConversationInput.tsx` — props `{ onSubmit, disabled, ticker }`, input text com placeholder "Pergunte sobre {ticker}…", botão envio com `ArrowUp` desabilitado se vazio ou `disabled=true`, Enter envia
- [ ] T011 [US1] Adicionar estado de conversa em `web/src/components/analysis/AnalysisClient.tsx`: `turns`, `sending`, `currentSuggestions`; adicionar função `handleQuestion(q: string)` que chama `requestConversation`, adicionar `ConversationDisclaimer variant="banner"` + `ConversationInput` + `ConversationDisclaimer variant="footer"` abaixo do botão "Atualizar análise"

**Checkpoint**: US1 completa — disclaimer visível, input funcional, resposta da IA aparece na tela (mesmo que sem thread formatado ainda).

---

## Phase 4: User Story 2 — Sugestões de follow-up dinâmicas (Priority: P2)

**Goal**: Chips de perguntas contextuais aparecem baseadas na análise; tocar envia automaticamente.

**Independent Test**: Gere análise de qualquer ativo, observe 2-3 chips de sugestão. Toque num chip — deve disparar a pergunta e mostrar resposta.

### Implementação US2

- [ ] T012 [US2] Implementar `ConversationSuggestions` em `web/src/components/analysis/ConversationSuggestions.tsx` — props `{ suggestions: string[]; onSelect: (s: string) => void; disabled: boolean }`, chips horizontais com scroll usando `.bull-suggestion-pill`, oculto quando `suggestions` vazio
- [ ] T013 [US2] Gerar sugestões iniciais em `AnalysisClient.tsx` a partir do conteúdo da análise: extrair 2-3 perguntas relevantes dos artifacts ou seções (`o_que_acompanhar`, `riscos_e_incertezas`) como `currentSuggestions` iniciais; atualizar `currentSuggestions` com `result.suggestions` após cada resposta da IA
- [ ] T014 [US2] Integrar `ConversationSuggestions` em `AnalysisClient.tsx` entre o disclaimer banner e o `ConversationInput`, passando `onSelect={handleQuestion}` e `disabled={sending}`

**Checkpoint**: US2 completa — chips aparecem após análise gerada, tocar num chip dispara pergunta e resposta, chips atualizam após cada turno.

---

## Phase 5: User Story 3 — Histórico da conversa na sessão (Priority: P3)

**Goal**: Thread de perguntas e respostas visível durante a sessão; limpo ao recarregar.

**Independent Test**: Faça 3 perguntas. Todas as trocas aparecem empilhadas. Recarregue — histórico some.

### Implementação US3

- [ ] T015 [US3] Implementar `ConversationThread` em `web/src/components/analysis/ConversationThread.tsx` — props `{ turns: ConversationTurn[] }`, para cada turno: pergunta alinhada à direita em `bg-white/[0.06] rounded-2xl px-4 py-3 text-sm text-[#F4F0FF]`, resposta à esquerda com `MarkdownBody` precedida do ícone `bull-brand-mark`, separador sutil entre turnos
- [ ] T016 [US3] Integrar `ConversationThread` em `AnalysisClient.tsx` acima de `ConversationInput` (abaixo do disclaimer banner), visível somente quando `turns.length > 0`; garantir que o estado `turns` é limpo apenas por reload (não por re-render)

**Checkpoint**: US3 completa — histórico visível e scrollável, limpo ao recarregar página.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: UX, acessibilidade e mobile.

- [ ] T017 [P] Auto-scroll para o último turno após nova resposta em `ConversationThread` (usar `useRef` + `scrollIntoView`)
- [ ] T018 [P] Loading state no `ConversationThread`: mostrar bolha animada (3 pontos pulsando) quando `sending=true` após último turno
- [ ] T019 [P] Garantir tap targets ≥ 44px em `ConversationInput` e chips de sugestão em mobile (390px)
- [ ] T020 Smoke test manual: abrir `/analysis?ticker=PETR4`, checar disclaimer, enviar "devo comprar?", confirmar que IA declina recomendação; enviar pergunta legítima, confirmar resposta em português com markdown renderizado

---

## Dependencies & Execution Order

### Dependências de Phase

- **Phase 1 (Setup)**: Sem dependências — começa imediatamente
- **Phase 2 (Foundational)**: Depende de Phase 1 — bloqueia toda UI
- **Phase 3 (US1)**: Depende de Phase 2 — MVP mínimo entregável
- **Phase 4 (US2)**: Depende de Phase 3 (usa `handleQuestion` e estado de `turns`)
- **Phase 5 (US3)**: Depende de Phase 3 (usa `turns` do estado)
- **Phase 6 (Polish)**: Depende de Phase 3-5

### Parallelismo Dentro de Phases

```bash
# Phase 1 — podem rodar juntas:
T002  # api/app/api/routes/conversation.py
T003  # componentes frontend vazios

# Phase 2 — sequencial (cada task depende da anterior):
T004 → T005 → T006 → T007  # backend
T008  # server action (pode rodar junto com T007)

# Phase 3 — T009 e T010 em paralelo, T011 depende de ambos:
T009 (ConversationDisclaimer) ──┐
T010 (ConversationInput)       ──→ T011 (integrar em AnalysisClient)

# Phase 4:
T012 (ConversationSuggestions) → T013 → T014

# Phase 6 — todas paralelas:
T017, T018, T019
```

---

## Implementation Strategy

### MVP (só US1 — mínimo para validar o conceito)

1. Phase 1: Setup (T001-T003)
2. Phase 2: Backend + server action (T004-T008)
3. Phase 3: Disclaimer + Input + integração básica (T009-T011)
4. **VALIDAR**: IA responde? Guardrail funciona? Disclaimer está visível?

### Entrega Completa

Após validação do MVP:
5. Phase 4: Sugestões dinâmicas (T012-T014)
6. Phase 5: Thread histórico (T015-T016)
7. Phase 6: Polish (T017-T020)

---

## Notes

- [P] = arquivos diferentes, sem dependência — podem rodar em paralelo
- [US1/US2/US3] = rastreabilidade para user story da spec
- Guardrail (T004) é a task mais crítica — testar com "devo comprar?" antes de avançar
- Não persistir histórico em banco de dados nesta versão
- Todos os textos visíveis ao usuário em português (pt-BR)
