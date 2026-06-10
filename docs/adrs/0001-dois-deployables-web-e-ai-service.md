# ADR 0001 - Dois deployables: Web App e AI Service

## Status

Aceita em 2026-06-10.

## Contexto

A Bull precisa combinar uma experiência transacional de assessor (auth, carteiras, cálculo
determinístico, relatórios) com narrativa de IA e ingestão de news. Esses dois planos têm perfis
operacionais diferentes: o Web App precisa ser previsível e rápido; o AI Service pode ter latência,
timeout, custo variável e dependência de LLM.

## Decisão

Manter exatamente dois deployables de aplicação no alvo da migração:

- **Web App (Next.js/Vercel):** UI, BFF, módulos determinísticos, crons de mercado e composição de relatório.
- **AI Service (FastAPI/Railway):** orquestrador, tools, Guardião, news e narrativa.

O Postgres Neon e o Redis Upstash são infraestrutura gerenciada, não deployables de aplicação.

## Por que não um deployable

Um processo único faria falhas de LLM, picos de custo e streams longos disputarem deploy/runtime com auth,
carteiras e cálculo determinístico. Também deixaria mais difícil aplicar circuit breaker e timeout na borda
BFF ↔ AI.

## Por que não muitos deployables

Separar market worker, reports worker, news worker e portfolio API agora criaria coordenação, CI/CD e
observabilidade antes de existir carga que justifique. O caminho correto é monolito modular dentro do Web
App e extração futura só quando a interface estiver provada.

## Consequências

- Contrato BFF ↔ AI via SSE é obrigatório e versionado.
- Browser nunca fala diretamente com Railway.
- AI Service pode ser extraído para repo próprio sem alterar a experiência do assessor.
- Novos deployables exigem ADR novo com motivo operacional concreto.
