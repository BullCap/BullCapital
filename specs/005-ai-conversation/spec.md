# Feature Specification: Conversa Contextual com IA

**Feature Branch**: `005-ai-conversation`

**Created**: 2026-05-21

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Primeira pergunta após análise gerada (Priority: P1)

O usuário acabou de receber a análise automática de PETR4 e quer aprofundar um ponto específico. Ele vê uma barra de input com sugestões de perguntas relacionadas ao ativo. Antes de interagir pela primeira vez, um disclaimer claro aparece explicando os limites da IA. O usuário digita ou seleciona uma sugestão e recebe uma resposta em português, ancorada no contexto de PETR4.

**Why this priority**: É o fluxo principal — sem ele a feature não existe. Toda a UX parte deste momento.

**Independent Test**: Acesse `/analysis?ticker=PETR4`, aguarde a análise carregar, envie uma pergunta livre. Valide: (1) disclaimer visível antes do primeiro envio, (2) resposta em português e contextualizada ao ativo, (3) nenhuma recomendação de compra/venda presente.

**Acceptance Scenarios**:

1. **Given** a análise de PETR4 foi gerada, **When** o usuário vê o input pela primeira vez, **Then** um disclaimer é exibido acima do campo de input explicando que a IA pode cometer erros e não recomenda compra ou venda.
2. **Given** o usuário digita "O que significa momentum baixo para PETR4?", **When** envia a pergunta, **Then** recebe resposta em português explicando o conceito aplicado ao contexto de PETR4 sem mencionar recomendação de ação.
3. **Given** o usuário tenta enviar "Devo comprar PETR4?", **When** a IA processa, **Then** a resposta declina a recomendação direta e redireciona para análise de fatores relevantes sem opinar sobre a decisão de investimento.

---

### User Story 2 — Sugestões de follow-up baseadas na análise (Priority: P2)

Após a análise ser exibida, aparecem 2–3 sugestões de perguntas geradas dinamicamente com base no conteúdo da análise (ex: se a análise menciona risco cambial, uma sugestão pode ser "Como o câmbio afeta PETR4?"). O usuário pode tocar em uma sugestão para enviá-la diretamente.

**Why this priority**: Reduz atrito — usuários sabem o que perguntar sem ter que formular a pergunta do zero. Aumenta engajamento com a análise.

**Independent Test**: Gere análise de qualquer ativo, observe as sugestões exibidas. Toque numa sugestão — ela deve preencher e enviar o campo automaticamente.

**Acceptance Scenarios**:

1. **Given** a análise foi gerada, **When** as sugestões de follow-up aparecem, **Then** exibem 2–3 perguntas relacionadas ao conteúdo real da análise (não perguntas genéricas fixas).
2. **Given** o usuário toca em uma sugestão, **When** a sugestão é selecionada, **Then** é enviada como pergunta imediatamente sem etapa extra.
3. **Given** o usuário já fez uma pergunta, **When** a resposta chega, **Then** novas sugestões contextuais baseadas na resposta aparecem.

---

### User Story 3 — Histórico da conversa visível na sessão (Priority: P3)

O usuário fez 2–3 perguntas durante a sessão e quer reler o que a IA respondeu anteriormente. A conversa fica acessível como um thread abaixo da análise original, sem persistência entre sessões.

**Why this priority**: Memória da sessão é básica para conversas coerentes; sem ela cada resposta parece isolada.

**Independent Test**: Faça 3 perguntas consecutivas. Todas as trocas (pergunta + resposta) devem aparecer empilhadas em ordem cronológica. Recarregue a página — o histórico deve ser limpo.

**Acceptance Scenarios**:

1. **Given** o usuário fez 2 perguntas, **When** a segunda resposta chega, **Then** ambas as trocas são visíveis em ordem no mesmo thread.
2. **Given** o usuário recarrega a página, **When** a análise é recarregada, **Then** o histórico de conversa anterior não está mais presente.
3. **Given** a conversa tem mais de 5 trocas, **When** o usuário rola, **Then** todas as trocas são acessíveis sem paginação adicional.

---

### Edge Cases

- O que acontece se a pergunta do usuário não tiver relação com o ativo analisado? → A IA deve redirecionar para o contexto do ativo e não responder perguntas completamente fora do escopo.
- O que acontece se o backend da IA estiver indisponível? → Exibir mensagem de erro gentil com opção de tentar novamente, sem bloquear a análise original.
- O que acontece se o usuário enviar uma mensagem vazia? → O botão de envio fica desabilitado enquanto o campo estiver vazio.
- O que acontece se a resposta da IA demorar mais de 15 segundos? → Exibir indicador de loading com possibilidade de cancelar.
- O que acontece se a pergunta contiver linguagem que solicita recomendação direta ("comprar", "vender", "colocar dinheiro")? → A IA responde declinou a recomendação e oferece contexto factual em vez disso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir um disclaimer permanente e visível informando que a IA pode cometer erros e não faz recomendações de compra, venda, alocação ou adequação de investimentos, antes da primeira interação do usuário com o campo de input.
- **FR-002**: O sistema DEVE exibir o disclaimer novamente como rodapé fixo em toda a área de conversa durante toda a sessão.
- **FR-003**: O usuário DEVE poder digitar perguntas livres no campo de input ancoradas ao ativo ou contexto da análise atual.
- **FR-004**: O sistema DEVE enviar junto com cada pergunta o contexto do ativo (ticker, dados de preço, scores de radar) e o conteúdo da análise já gerada como contexto para a IA.
- **FR-005**: A IA DEVE responder exclusivamente em português brasileiro.
- **FR-006**: A IA DEVE recusar qualquer solicitação de recomendação direta de compra, venda, alocação ou suitability, redirecionando para análise factual do contexto.
- **FR-007**: O sistema DEVE exibir 2–3 sugestões de perguntas de follow-up geradas dinamicamente com base no conteúdo da análise, antes da primeira pergunta do usuário.
- **FR-008**: As sugestões de follow-up DEVEM ser atualizadas após cada resposta da IA para refletir o contexto mais recente da conversa.
- **FR-009**: O histórico da conversa (perguntas e respostas) DEVE ser mantido e exibido durante a sessão do navegador.
- **FR-010**: O histórico DEVE ser limpo ao recarregar a página (sem persistência entre sessões).
- **FR-011**: O campo de input DEVE ser desabilitado enquanto uma resposta estiver sendo processada, para evitar envios duplicados.
- **FR-012**: O sistema DEVE exibir um indicador visual de carregamento enquanto aguarda a resposta da IA.
- **FR-013**: Perguntas sem relação com o ativo analisado DEVEM ser redirecionadas pela IA para o contexto do ativo, sem responder off-topic.

### Key Entities

- **Turno de conversa**: Uma pergunta do usuário + a resposta da IA correspondente. Contém: texto da pergunta, texto da resposta, timestamp, sugestões de follow-up geradas pela IA na resposta.
- **Contexto da análise**: O conjunto de dados enviado à IA em cada turno — ticker, preço, variação, scores de radar e o conteúdo das 5 seções da análise original.
- **Sugestão de follow-up**: Pergunta curta (máx 60 caracteres) gerada pela IA, relacionada ao conteúdo mais recente da conversa, exibida como chip tocável.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O disclaimer é exibido em 100% das sessões antes da primeira interação com o input.
- **SC-002**: Nenhuma resposta da IA contém recomendação direta de compra, venda, alocação ou suitability (validável por revisão de amostra).
- **SC-003**: O usuário consegue enviar uma pergunta e receber resposta em menos de 20 segundos em condições normais de rede.
- **SC-004**: As sugestões de follow-up são exibidas em 100% das análises geradas com sucesso.
- **SC-005**: O campo de input e as sugestões são usáveis em dispositivos mobile (tela ≥ 375px) sem overflow ou elementos inacessíveis.
- **SC-006**: O histórico da conversa permanece coerente durante toda a sessão para conversas de até 10 turnos.

## Assumptions

- O usuário já está autenticado e tem uma análise gerada antes de interagir com o campo de conversa.
- O backend FastAPI na porta 8001 já existe e tem o endpoint `/api/v1/analysis` funcionando; um novo endpoint `/api/v1/conversation` será adicionado para turnos de conversa.
- Não há persistência de histórico entre sessões nesta versão — sessão do navegador é a unidade de contexto.
- O contexto da análise (seções + dados de mercado) é sempre passado junto com cada pergunta para garantir respostas ancoradas.
- As sugestões de follow-up são geradas pelo próprio LLM como parte da resposta JSON (não por um modelo separado).
- A moderação de conteúdo é feita via prompt engineering (instruções ao LLM) e não por filtro externo.
- O design segue o sistema existente (glassmorphism, cores do design system, tipografia Playfair + Inter).
