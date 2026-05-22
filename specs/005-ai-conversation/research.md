# Research: Conversa Contextual com IA

## Decision 1: Persistência da conversa

**Decision**: Sem persistência — histórico vive apenas em `useState` no cliente  
**Rationale**: A spec define explicitamente "sem persistência entre sessões". React state é zero-custo, sem banco, sem complexidade. Os modelos SQLAlchemy de conversa existem em `api/app/models/conversation.py` mas ficam para uma iteração futura.  
**Alternatives considered**: sessionStorage (desnecessário, React já mantém durante a sessão); pgVector (over-engineering para MVP)

---

## Decision 2: Novo endpoint FastAPI vs reutilizar /analysis

**Decision**: Novo endpoint `POST /api/v1/conversation`  
**Rationale**: O endpoint de análise gera análise inicial estruturada (5 seções + artifacts). O endpoint de conversa recebe histórico de turnos e retorna resposta livre + sugestões. São contratos diferentes — misturá-los complicaria o parsing e a lógica de guardrail.  
**Alternatives considered**: Reutilizar `/analysis` com parâmetro `mode=conversation` — rejeitado porque polui o contrato já funcionando.

---

## Decision 3: Guardrails via prompt engineering

**Decision**: System prompt estrito no agente de conversa + validação de keywords como backup  
**Rationale**: O LLM (DeepSeek via OpenRouter) já segue instruções de sistema com fidelidade alta. Um system prompt dedicado para a conversa — separado do prompt de análise — permite tunar as restrições sem afetar a análise inicial. Keyword detection no backend captura casos extremos onde o LLM "escorrega".  
**Alternatives considered**: Filtro de moderação externo (OpenAI Moderation API) — rejeitado por dependência extra e custo; classificador local — over-engineering para MVP.

---

## Decision 4: Sugestões de follow-up geradas pelo LLM

**Decision**: O LLM retorna `suggestions: string[]` como parte do JSON de resposta  
**Rationale**: As sugestões contextuais mais relevantes são as que o próprio modelo gera baseado no que acabou de responder. Alternativa de gerar sugestões fixas seria genérica e perderia o valor de personalização. Custo adicional mínimo (tokens extras no response).  
**Alternatives considered**: Sugestões fixas hardcoded — rejeitado por baixo valor; endpoint separado para sugestões — rejeitado por latência dupla.

---

## Decision 5: Server Action vs chamada client-side ao FastAPI

**Decision**: Server Action Next.js (`web/src/lib/actions/conversation.ts`)  
**Rationale**: Consistente com o padrão existente de `requestAnalysis`. A URL do FastAPI (`localhost:8001`) não é exposta ao cliente. As credenciais de contexto (API keys, dados sensíveis) ficam no servidor.  
**Alternatives considered**: Chamada direta do cliente ao FastAPI — rejeitado por expor a URL interna e quebrar o modelo de segurança; API Route Next.js — mais verboso que Server Action para este caso.

---

## Decision 6: Reutilização de MarketAnalysisAgent vs agente separado

**Decision**: Novo método no `MarketAnalysisAgent` existente (`conversation_turn`)  
**Rationale**: O agente já tem lazy init, suporte a OpenRouter e OpenAI, e o padrão `asyncio.to_thread`. Adicionar um método é suficiente — não justifica uma nova classe.  
**Alternatives considered**: Classe `ConversationAgent` separada — rejeitado por duplicação desnecessária.
