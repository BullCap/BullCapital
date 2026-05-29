# Feature Specification: Terminal — Mesa do Analista

**Feature Branch**: `feat/dashboard-ai-component`

**Spec ID**: 008-terminal-dashboard

**Created**: 2026-05-28

**Status**: Draft

**Decision log**: A rota `/comparador` prevista no roadmap original (§13.3) foi absorvida por esta feature. O Terminal passa a ser a superfície única de análise comparativa, eliminando a rota separada.

**Inspiração competitiva**: Gorila (GorilaVIEW) domina o espaço de *consolidação de carteira*. A Bull não replica esse fluxo (sem Open Finance no MVP). O terminal posiciona a Bull como a **mesa de trabalho** do analista/CFP — foco em análise de ativos para terceiros e conteúdo, não em gestão de carteira pessoal.

---

## Contexto de produto

### Persona-alvo

**CFP / Influencer financeiro** (pós-pivô B2B, 24-mai-2026). O usuário não quer ver "minha carteira consolidada" — quer uma superfície para:
- Acompanhar uma lista de ativos sob radar (para clientes ou conteúdo)
- Comparar 2-4 ativos lado a lado com fundamentals
- Receber análise narrativa em pt-BR do copiloto IA sobre a seleção
- Futuramente: exportar essa análise como PDF/PNG (Sprint 3)

### O que o terminal era antes

Uma tela com dois `<select>` fixos (6 tickers hardcoded) mostrando uma tabela de 6 métricas com highlight ametista. Funcional, mas limitado: sem watchlist, sem busca livre de ticker, sem seleção de mais de 2 ativos.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Configurar watchlist de trabalho (Priority: P1)

O CFP abre o terminal e monta rapidamente uma lista dos ativos que está analisando para um cliente esta semana, sem precisar redigitar sempre que voltar.

**Por que P1**: Sem persistência da lista de ativos, o terminal é uma tela de uso único. A watchlist é o que cria o hábito diário.

**Teste independente**: Adicionar 3 tickers via busca, recarregar a página e confirmar que a lista persiste.

**Acceptance Scenarios**:
1. **Dado** que o terminal carregou, **Quando** o usuário digita um ticker no campo de busca e seleciona um resultado, **Então** o ativo aparece na watchlist persistida em `localStorage`.
2. **Dado** que a watchlist tem ativos, **Quando** o usuário fecha e reabre o browser, **Então** a lista é restaurada com os mesmos tickers.
3. **Dado** um ativo na watchlist, **Quando** o usuário clica em "remover", **Então** o ativo sai da lista e do `localStorage`.
4. **Dado** que a watchlist está vazia, **Então** os 6 tickers padrão (`PETR4, VALE3, ITUB4, BBAS3, TAEE11, MXRF11`) são carregados.

---

### User Story 2 — Comparar ativos da watchlist (Priority: P1)

O CFP seleciona 2 a 4 ativos da watchlist para ver fundamentos lado a lado e identificar qual tem melhor DY ou menor P/L para recomendar.

**Por que P1**: É a funcionalidade central; absorve o `AssetComparator` existente e o comparador top-level cancelado.

**Teste independente**: Com 3 ativos na watchlist, selecionar 2 deles e confirmar tabela de métricas com highlight correto; selecionar um terceiro e confirmar que a tabela expande para 3 colunas.

**Acceptance Scenarios**:
1. **Dado** ativos na watchlist, **Quando** o usuário clica num ativo, **Então** o painel central passa para o modo "Focar" mostrando cotação + variação + 6 métricas do ativo isolado.
2. **Dado** um ativo focado, **Quando** o usuário clica "Comparar" ou seleciona um segundo ativo, **Então** o painel central expande para tabela de comparação com 2 colunas.
3. **Dado** 2+ ativos em comparação, **Quando** um terceiro é adicionado, **Então** a tabela expande para 3 colunas sem quebrar o layout.
4. **Dado** uma linha de métrica, **Quando** há vencedor claro (maior/menor conforme critério), **Então** a célula vencedora recebe o highlight ametista e o ícone `CircleDot`.

---

### User Story 3 — Consultar copiloto com contexto da watchlist (Priority: P1)

O CFP quer uma narrativa rápida sobre os ativos que está comparando, sem precisar redigitar o contexto.

**Por que P1**: O copiloto IA é o principal diferenciador da Bull. Perder o contexto a cada mensagem anula o valor.

**Teste independente**: Com PETR4 e VALE3 no modo comparar, abrir copiloto e confirmar que a primeira mensagem de sugestão já menciona os dois ativos.

**Acceptance Scenarios**:
1. **Dado** ativos na watchlist e um ativo focado, **Quando** o copiloto abre, **Então** o contexto enviado à IA inclui o ticker focado + lista da watchlist.
2. **Dado** o modo comparar com N ativos, **Quando** o copiloto abre, **Então** o contexto inclui todos os tickers em comparação e as métricas já carregadas.
3. **Dado** uma pergunta do usuário sobre um ativo da watchlist, **Então** o copiloto responde em pt-BR sem solicitar que o usuário reinforme o ticker.

---

### User Story 4 — Busca livre de ticker (Priority: P2)

O CFP quer adicionar um ativo que não está nos 6 defaults sem digitar exatamente o código — pode digitar "petro" e encontrar PETR3/PETR4.

**Por que P2**: Melhoria de UX, não bloqueador do MVP, mas diferencia de selects hardcoded.

**Teste independente**: Digitar "petro" e confirmar que resultados aparecem; selecionar PETR3 e confirmar que entra na watchlist.

**Acceptance Scenarios**:
1. **Dado** o campo de busca, **Quando** o usuário digita 3+ caracteres, **Então** resultados de `searchAssets` aparecem num dropdown.
2. **Dado** resultados visíveis, **Quando** o usuário seleciona um, **Então** o ativo é adicionado à watchlist e o campo de busca é limpo.
3. **Dado** que o ativo já está na watchlist, **Quando** o usuário o seleciona na busca, **Então** ele não é duplicado.

---

### Edge Cases

- Watchlist com ativo cujo ticker saiu de operação (preço `null`): exibir "n/d" sem quebrar o layout.
- Busca sem resultados: exibir estado vazio limpo ("Nenhum ativo encontrado para 'xxx'").
- Comparação de ativo consigo mesmo: exibir aviso amarelo (comportamento já existente).
- Mobile (< 768px): layout colapsa para coluna única — watchlist fecha como painel lateral, workspace ocupa tela inteira, copiloto vira drawer ou aba.
- Watchlist com mais de 10 itens: rolar internamente, sem crescer verticalmente além da viewport.
- API de cotação offline: exibir skeleton com dados antigos do cache ou estado de erro por card.

---

## Requirements *(mandatory)*

### Functional Requirements

**Watchlist**
- **FR-001**: O terminal DEVE renderizar uma watchlist persistida em `localStorage` (`bull_watchlist`).
- **FR-002**: A watchlist DEVE ter 6 tickers padrão quando vazia.
- **FR-003**: O usuário DEVE conseguir adicionar tickers via busca (`searchAssets`) com debounce de 300ms.
- **FR-004**: O usuário DEVE conseguir remover qualquer ativo da watchlist.
- **FR-005**: Cada item da watchlist DEVE exibir: ticker · nome curto · preço atual · variação percentual do dia · badge colorido (verde/vermelho).
- **FR-006**: A watchlist DEVE se manter scrollável internamente se exceder 10 itens, sem redimensionar o grid.

**Workspace (painel central)**
- **FR-007**: Clicar num ativo da watchlist DEVE exibir o modo "Focar": card grande com preço, variação, 6 métricas fundamentais e badge `VariationBadge`.
- **FR-008**: Selecionar um segundo ativo da watchlist DEVE alternar para modo "Comparar": tabela N×métricas com highlight vencedor.
- **FR-009**: Comparar DEVE suportar de 2 a 4 ativos simultâneos.
- **FR-010**: Remover um ativo da seleção de comparação DEVE reduzir a tabela adequadamente, até retornar ao modo "Focar" se sobrar 1.
- **FR-011**: O botão "Exportar" DEVE estar presente mas desabilitado (placeholder para Sprint 3).

**Copiloto IA**
- **FR-012**: O copiloto DEVE receber contexto incluindo: lista da watchlist, ticker(s) em foco/comparação e as métricas disponíveis.
- **FR-013**: O copiloto DEVE sugerir perguntas iniciais baseadas nos ativos selecionados.
- **FR-014**: O copiloto DEVE responder exclusivamente em pt-BR.

**Layout & responsividade**
- **FR-015**: Desktop (≥ 1024px): grid de 3 colunas — watchlist · workspace · copiloto.
- **FR-016**: Tablet (768–1023px): watchlist colapsa para drawer lateral abrível; workspace + copiloto ficam em 2 colunas.
- **FR-017**: Mobile (< 768px): layout de coluna única com watchlist como drawer; workspace ocupa a tela; copiloto como drawer ou botão flutuante.
- **FR-018**: A barra de status de mercado (IBOV · USD/BRL · status aberto/fechado) DEVE aparecer no cabeçalho do terminal como referência rápida de contexto.

### Key Entities

- **Watchlist**: Lista ordenada de tickers persistida em `localStorage`, com limites de 1–20 itens.
- **WatchlistItem**: `{ symbol: string, name: string, price: number | null, change: number | null }` — atualizado em cada carga de página.
- **FocusedAsset**: Ticker único selecionado da watchlist para visualização detalhada.
- **CompareSet**: Conjunto de 2–4 tickers selecionados da watchlist para comparação.
- **CopilotContext**: Payload enviado ao TerminalCopilot incluindo watchlist, focusedAsset ou compareSet, e métricas já carregadas.

### Non-goals (fora do escopo desta spec)

- Persistência da watchlist em banco de dados (Prisma/PostgreSQL) → pós-MVP
- Gráfico de evolução patrimonial ou NAV → requer dados de carteira do usuário (Open Finance, parking lot)
- Drawdown, TWR, IRR → idem, requer carteira
- Alertas de preço / push notification → parking lot
- Exportação PDF/PNG funcional → Sprint 3 (010-export-pdf)

---

## Architecture Notes

### Componentes novos

| Arquivo | Responsabilidade |
|---|---|
| `components/terminal/Watchlist.tsx` | Lista persistida, busca, add/remove, click para focar |
| `components/terminal/WatchlistItem.tsx` | Linha: ticker · nome · preço · variação badge |
| `components/terminal/AssetFocus.tsx` | Painel "Focar": card grande de 1 ativo |
| `components/terminal/MarketStatusBar.tsx` | Barra topo: IBOV · USD/BRL · status mercado |

### Componentes refatorados

| Arquivo | O que muda |
|---|---|
| `components/terminal/TerminalClient.tsx` | Vira grid 3-colunas; gerencia watchlist state + focusedTicker + compareSet |
| `components/terminal/AssetComparator.tsx` | Remove selects hardcoded; recebe `tickers: string[]` como prop; suporta 2-4 |
| `components/terminal/TerminalCopilot.tsx` | Recebe `CopilotContext` enriquecido (watchlist + compareSet/focusedAsset + métricas) |
| `app/terminal/page.tsx` | Pré-carrega cotações dos tickers da watchlist padrão; copy do header atualizado |

### Data flow

```
localStorage (bull_watchlist)
        ↓
TerminalClient (estado: watchlist[], focusedTicker, compareSet[])
        ↓                    ↓                    ↓
   Watchlist.tsx      AssetFocus.tsx /       TerminalCopilot.tsx
   (renderiza +        AssetComparator.tsx    (recebe CopilotContext)
    interações)        (recebe tickers[])
```

### Estado compartilhado (sem Zustand — hooks locais por ora)

```ts
type TerminalState = {
  watchlist: string[]            // tickers ordenados
  quotes: Record<string, AssetQuote>  // cache de cotações
  focusedTicker: string | null
  compareSet: string[]           // 0 = nada; 1 = focus; 2-4 = compare
}
```

---

## Success Criteria *(mandatory)*

- **SC-001**: Usuário adiciona 3 tickers via busca, recarrega, e encontra os mesmos 3 na watchlist.
- **SC-002**: Com 2 ativos em comparação, a tabela exibe highlight correto na linha "Dividend Yield" (maior ganha).
- **SC-003**: O copiloto recebe e exibe contexto dos ativos em foco sem o usuário precisar digitar os tickers.
- **SC-004**: Em viewport 375px, o layout não apresenta overflow horizontal; watchlist e copiloto acessíveis via drawer.
- **SC-005**: Remoção de ativo do compareSet com 2 ativos retorna automaticamente ao modo "Focar" no ativo remanescente.
- **SC-006**: Botão "Exportar" visível e desabilitado (disabled + tooltip "em breve") — não bloqueia interação com o resto da tela.

---

## Assumptions

- `searchAssets` já existe em `lib/services/market` e retorna `{ symbol, shortName }[]` — nenhuma nova integração de dados necessária.
- `getMultipleQuotes` já aceita N tickers; será chamado para os tickers da watchlist no `page.tsx` (Server Component).
- Persistência em Prisma (`watchlist` tabela) fica para pós-MVP; `localStorage` é suficiente para o beta.
- O copiloto IA (`TerminalCopilot`) já tem infraestrutura de streaming + context — apenas o payload de contexto muda.
- Mobile-first responsividade usa breakpoints Tailwind existentes (`md:`, `lg:`).
- A rota `/comparador` **não será criada** — a Sprint 1 do roadmap é redirecionada para esta feature.
