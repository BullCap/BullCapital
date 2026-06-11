# ADR 0004 - BFF como única porta de entrada

## Status

Aceita em 2026-06-10. **Emendada em 2026-06-11 pelo ADR
[0008](0008-sse-direto-com-token-curto-emitido-pelo-bff.md)**: o stream SSE passa a ir direto do
cliente ao AI Service, autenticado por token curto emitido pela BFF — a BFF deixa de proxiar o stream e
vira emissora de credencial. Todas as demais interações continuam passando exclusivamente pela BFF.

## Contexto

O browser precisa consumir dados de mercado, carteira e narrativa de IA sem receber segredos, URLs internas
ou permissões diretas. A autenticação e o tenant precisam ser definidos por sessão confiável, não por payload
enviado pelo cliente.

## Decisão

O BFF do Web App é a única porta de entrada para o browser. Ele valida sessão, injeta tenant, aplica
rate-limit/circuit breaker, chama módulos internos e faz proxy normalizado do stream SSE para o AI Service.

O browser nunca chama diretamente:

- Railway / AI Service.
- Neon / Postgres.
- Upstash / Redis.
- Brapi ou qualquer fonte externa.

## Consequências

- `API_SHARED_SECRET` protege Web App ↔ AI Service.
- `tenant` vindo do browser é ignorado; o BFF injeta tenant a partir da sessão.
- Se o AI Service cair no meio do stream, o BFF emite evento `error` seguro e encerra; resposta parcial não
  é persistida como resposta final.
- Toda nova rota que bypassa o BFF viola esta ADR.
