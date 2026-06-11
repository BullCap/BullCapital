# ADR 0008 - SSE direto do cliente para o AI Service, com token curto emitido pelo BFF

## Status

Aceita em 2026-06-11. **Emenda o ADR [0004](0004-bff-como-unica-porta-de-entrada.md)**: o stream SSE é
a única interação que não passa pela BFF; todo o resto continua.

## Contexto

O desenho anterior fazia a BFF proxiar o stream SSE (re-emitter). Em Vercel isso significa segurar uma
function aberta pela duração inteira do stream — custo, limite de duração e um hop duplicado de
streaming sem ganho de segurança real.

## Decisão

- O **cliente abre o SSE direto contra o AI Service**, autenticado por **token curto assinado pela BFF**
  (escopo: usuário + finalidade + expiração curta).
- A **BFF vira emissora de credencial**, não proxy de stream. Autoriza, assina, devolve token + URL.
- O contrato de eventos/envelope continua versionado em [contracts/bff-ai-sse.md](../contracts/bff-ai-sse.md);
  o bump de contrato do pipeline segue valendo — só muda quem consome o stream.
- **Circuit breaker sai do MVP**: estado de breaker em memória serverless é teatro. Timeout + retry com
  backoff resolvem; se um dia importar, o estado vai para o Upstash.

## Consequências

- AI Service precisa de URL pública para o browser (`NEXT_PUBLIC_*`) e CORS restrito ao domínio do app.
- Validação do token no AI Service (mesma chave compartilhada que já autentica server-to-server).
- O host da IA precisa suportar SSE de longa duração — restrição registrada para a escolha de host do
  time de IA (Railway, Render, Fly etc. servem).
- Elimina o problema de duração de função na Vercel para streams longos.
