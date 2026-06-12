# Feature Specification: Design System Calm — Unificação Visual do Frontend

**Feature Branch**: `011-design-system-calm`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Unificação visual do frontend num design system 'calm': fonte única de tokens, primitivos completos tematizados, sistema de grid de página com blocos designados, data-viz unificada e regras de redução de ruído textual. Inclui reescrita do system-design.md na direção calm (decisão do dono em 12/jun/2026)."

## Contexto

Auditoria de 12/jun/2026 identificou três sistemas visuais competindo no frontend:

- **3 fontes de tokens divergentes**: o tema global define `void` como `#050308`, as variáveis de runtime definem `#0C0F15`, e o system-design.md documenta `#0D0B14`. Componentes ainda hardcodam `#F4F0FF` ignorando todas.
- **7 estilos de container**: `glass-card`, `bull-panel`, `bull-panel-focus`, `bull-panel-quiet`, `bull-frame`, `bull-card-calm` e o `Card` de `components/ui` — três gerações estéticas empilhadas.
- **Nenhuma escala**: 20 tamanhos de texto arbitrários (370+ ocorrências), 9 raios de borda arbitrários, 7 valores de tracking, largura de container decidida individualmente por cada página (860/1100/1280/1560/1720px).
- **Ruído textual**: 53 arquivos com labels uppercase (eyebrows); seções carregam 4 camadas de texto (eyebrow + título + subtítulo + rodapé metodológico).

O dono decidiu em 12/jun/2026: adotar a direção "calm" (hairline, superfície única, sem glow) e **reescrever o system-design.md** para refletir essa direção — o documento atual exige skeuomorfismo + glow, que é a causa raiz do ruído.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fundação visual única (Priority: P1)

Como assessor usando o produto, toda tela que eu abrir usa a mesma paleta, a mesma escala de texto, os mesmos raios de borda e o mesmo ritmo de espaçamento. Como desenvolvedor, existe uma única fonte de verdade de tokens e um conjunto de primitivos de UI completo construído sobre ela; nenhum componente define cor, tamanho ou raio fora da escala.

**Why this priority**: Sem a fundação, qualquer migração de tela reproduz a divergência atual. Tokens + primitivos são pré-requisito de todas as outras histórias.

**Independent Test**: Inspecionar o código após a entrega: (a) uma única definição de cada token de cor; (b) zero hex hardcoded em componentes; (c) zero tamanhos de texto e raios arbitrários nos primitivos; (d) os primitivos (botão, input, tabs, select, dialog, badge, tooltip, skeleton, toast) renderizam corretamente numa página de amostra.

**Acceptance Scenarios**:

1. **Given** o tema global do app, **When** um desenvolvedor procura a definição de qualquer cor da marca, **Then** existe exatamente um lugar que a define e todos os usos referenciam esse lugar.
2. **Given** um componente primitivo (botão, input, tab, chip, segmented control), **When** ele é usado em qualquer página, **Then** sua aparência vem do componente compartilhado, não de classes utilitárias globais duplicadas (`bull-action`, `bull-input`, `bull-tab`, `bull-segmented`, `bull-chip`).
3. **Given** a escala tipográfica nomeada (6 passos), **When** um texto é renderizado em qualquer tela migrada, **Then** seu tamanho corresponde a um passo da escala — nunca um valor arbitrário em px.

---

### User Story 2 - Ficha do cliente como piloto do grid de página (Priority: P1)

Como assessor abrindo a ficha consolidada de um cliente, vejo uma página composta por blocos claramente delimitados num grid consistente: cabeçalho de página padronizado (título + metadados + ações), painéis com a mesma superfície e o mesmo espaçamento entre si, e menos texto repetido — explicações metodológicas ficam acessíveis sob demanda (tooltip/ícone de info) em vez de ocupar espaço fixo.

**Why this priority**: A ficha do cliente é a tela mais recente e mais representativa do produto B2B pós-pivô; validar o grid nela define o padrão que as demais telas seguem. Junto com a US1, entrega um MVP demonstrável.

**Independent Test**: Abrir `/clients/[id]` (e subpáginas policy/import) e verificar: largura de página vinda de preset, cabeçalho padronizado, todos os painéis com a mesma superfície, espaçamento uniforme entre blocos, no máximo 1 eyebrow por grupo de seções, metodologia em tooltip.

**Acceptance Scenarios**:

1. **Given** a ficha do cliente, **When** comparo dois painéis quaisquer da página, **Then** ambos usam a mesma superfície (borda hairline, sem glow), o mesmo raio e o mesmo padding interno.
2. **Given** a ficha do cliente, **When** conto os níveis de texto de um painel, **Then** há no máximo 2 níveis fixos (título + conteúdo); notas metodológicas aparecem apenas sob demanda.
3. **Given** as subpáginas de política-alvo e import, **When** navego entre elas e a ficha, **Then** a largura do conteúdo segue presets nomeados (página larga vs. página de foco), não valores soltos por página.

---

### User Story 3 - Migração das demais telas autenticadas (Priority: P2)

Como assessor navegando entre home (briefing diário), detalhe de ativo, terminal, busca e análises, as telas parecem o mesmo produto: mesmo grid, mesmos painéis, mesma data-viz (barras de composição, barras de categoria, sparklines e trackers com visual unificado).

**Why this priority**: É onde a percepção de "produto único" se concretiza, mas depende do padrão validado no piloto.

**Independent Test**: Navegar pelas rotas autenticadas e verificar que nenhuma tela usa os estilos de container legados nem larguras fora dos presets; os gráficos compartilham paleta e anatomia.

**Acceptance Scenarios**:

1. **Given** a home e a ficha do cliente lado a lado, **When** comparo painéis equivalentes, **Then** superfície, espaçamento e tipografia são idênticos.
2. **Given** qualquer visualização de dados (composição por classe, carteira vs. política, limite FGC, pulso de mercado), **When** renderizada, **Then** usa o conjunto unificado de blocos de data-viz com as cores de tendência dessaturadas padrão.

---

### User Story 4 - Limpeza e governança (Priority: P3)

Como desenvolvedor (humano ou agente), ao concluir a migração o CSS global não contém mais estilos de container legados, as dependências de gráfico/animação redundantes foram removidas, e o system-design.md reescrito documenta a direção calm com regras objetivas — de modo que features futuras não reintroduzam divergência.

**Why this priority**: Garante que a unificação seja durável; sem isso o CSS morto e o documento antigo voltam a ser copiados como referência.

**Independent Test**: Buscar no código por classes legadas (`bull-panel`, `glass-card`, etc.) e pelas dependências removidas — zero ocorrências em código ativo; ler o system-design.md e confirmar que descreve a direção calm com as regras de ruído.

**Acceptance Scenarios**:

1. **Given** o CSS global após a limpeza, **When** procuro estilos de container legados, **Then** não existem mais (exceto eventuais pontes documentadas para áreas fora de escopo).
2. **Given** o manifesto de dependências, **When** verifico bibliotecas de gráfico e animação, **Then** resta uma de cada (a redundante de gráficos de círculo e a segunda de animação por física foram removidas).
3. **Given** o system-design.md reescrito, **When** um agente o usa para criar um componente novo, **Then** as regras levam ao padrão calm (superfície única, escala fixa, limites de texto), não ao skeuomorfismo anterior.

---

### Edge Cases

- **Documentação (/docs)**: a área usa um sistema de docs de terceiros com ponte de tokens própria; a unificação deve manter essa ponte funcionando (sidebar/TOC continuam legíveis no tema dark).
- **Arquivo local não versionado** (`OpenFinancePortfolio.tsx`, mantido fora do git por decisão): pode referenciar classes legadas; a limpeza não pode quebrar o build local — remover classes apenas após confirmar que nada versionado as usa e avisar o dono sobre o arquivo local.
- **Telas marcadas para arquivamento pós-pivô** (ex.: DividendCalculator, SavingsSimulator): fora do escopo da migração; não estender nem usar como referência.
- **Mobile/PWA (Android-first)**: o dock inferior e o colapso de colunas precisam continuar funcionando em viewport estreito em todas as telas migradas.
- **Reduced motion**: estados de hover/transição da superfície calm devem respeitar `prefers-reduced-motion` como hoje.
- **Conteúdo dinâmico longo** (nomes de cliente, instituições, tickers): painéis do grid precisam truncar/quebrar sem estourar o bloco.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST ter uma única fonte de verdade para tokens visuais (cores semânticas, tipografia, raios, espaçamento); definições duplicadas ou conflitantes MUST ser eliminadas.
- **FR-002**: A escala tipográfica MUST ter 6 passos nomeados cobrindo do menor metadado ao título de página; componentes migrados MUST NOT usar tamanhos arbitrários fora da escala.
- **FR-003**: O raio de borda MUST ter exatamente 2 níveis semânticos (controles e painéis); valores arbitrários MUST ser eliminados das telas migradas.
- **FR-004**: O ritmo de espaçamento MUST ser fixo: um gap padrão interno de painel e um gap padrão entre painéis, aplicados de forma idêntica em todas as páginas migradas.
- **FR-005**: O conjunto de primitivos de UI MUST ser completado (incluindo tabs, select, dialog, badge, tooltip, skeleton e toast) e tematizado exclusivamente via tokens; as classes utilitárias globais equivalentes (`bull-action`, `bull-input`, `bull-tab`, `bull-segmented`, `bull-chip`) MUST ser substituídas e removidas.
- **FR-006**: Páginas MUST declarar sua largura por meio de presets nomeados de shell de página (mínimo: largo para dashboards, foco para formulários); larguras customizadas por página MUST ser eliminadas.
- **FR-007**: Toda página migrada MUST usar o cabeçalho de página padronizado (título, metadados, ações) com hierarquia e alturas fixas.
- **FR-008**: Painéis MUST usar uma única superfície visual (borda hairline, fundo sutil, sem glow nem sombras pesadas) disposta num grid de 12 colunas com gap fixo.
- **FR-009**: Visualizações de dados MUST vir de um conjunto unificado de blocos (lista de barras, barra de categorias, tracker, sparkline) com uma única paleta de tendência dessaturada; a biblioteca redundante de gráficos de círculo MUST ser removida.
- **FR-010**: Texto fixo por painel MUST ser limitado a 2 níveis (título + conteúdo); explicações metodológicas MUST migrar para exibição sob demanda (tooltip/ícone de info).
- **FR-011**: Labels uppercase de seção (eyebrows) MUST ser limitados a no máximo 1 por grupo de seções por página.
- **FR-012**: O system-design.md MUST ser reescrito para documentar a direção calm: superfície única, escalas fixas, regras de ruído e proibições (glow, sombras empilhadas, texto metodológico fixo), substituindo as diretivas de skeuomorfismo.
- **FR-013**: A migração MUST ser incremental e cada etapa MUST deixar o app funcional: fundação → piloto (ficha do cliente) → home → asset/terminal/busca/análises → limpeza final.
- **FR-014**: A limpeza final MUST remover do CSS global os estilos de container legados e do manifesto as dependências redundantes (gráficos de círculo e a segunda biblioteca de animação), sem quebrar áreas fora de escopo.
- **FR-015**: O comportamento responsivo atual (dock mobile, colapso de colunas, safe areas do PWA) MUST ser preservado em todas as telas migradas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero definições de cor duplicadas/conflitantes: cada token de cor da marca tem exatamente 1 definição, e componentes migrados têm 0 valores de cor hardcoded.
- **SC-002**: Ocorrências de tamanho de texto arbitrário em telas migradas caem de ~370 para 0; raios arbitrários caem de 9 variantes para 0.
- **SC-003**: Estilos de container ativos caem de 7 para 1; busca por classes legadas em código versionado retorna 0 resultados ao fim da limpeza.
- **SC-004**: 100% das páginas autenticadas declaram largura via preset (0 larguras customizadas soltas).
- **SC-005**: Na ficha do cliente e na home, o texto fixo visível por tela (eyebrows + subtítulos + rodapés metodológicos) é reduzido em pelo menos 40%, sem perda de informação (conteúdo movido para tooltips conta como preservado).
- **SC-006**: Duas dependências removidas do manifesto; nenhuma página perde funcionalidade de gráfico.
- **SC-007**: Suíte de testes, type-check e lint passam em cada etapa da migração; navegação por todas as rotas autenticadas não apresenta regressão visual bloqueante em viewport mobile e desktop.
- **SC-008**: Um desenvolvedor/agente lendo apenas o system-design.md reescrito produz um painel novo indistinguível dos existentes (verificável por revisão de PR subsequente).

## Assumptions

- O tema continua **dark-only**; não há requisito de modo claro nesta feature.
- A direção visual "calm" aprovada corresponde à camada mais recente já presente no código (hairline + fundo sutil), que será promovida a padrão único — não é uma estética nova a inventar.
- A área `/docs` mantém sua ponte de tokens própria e está fora do escopo de migração de layout (apenas não pode regredir).
- Telas pré-pivô marcadas para arquivamento (DividendCalculator, SavingsSimulator) e o arquivo local `OpenFinancePortfolio.tsx` estão fora do escopo.
- A biblioteca de gráficos base atual (já usada pelas telas) permanece; os blocos unificados de data-viz são construídos sobre ela no padrão copy-paste tematizável.
- Copy voltada ao usuário final permanece em pt-BR; a redução de ruído remove redundância, não muda a voz do produto.
- Landing page e fluxos de auth podem ser migrados de forma oportunista, mas não bloqueiam o sucesso da feature (foco nas rotas autenticadas).
