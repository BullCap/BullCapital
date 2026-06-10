# Contrato — BFF ↔ AI Service via SSE (v1)

> **Status**: normativo a partir do Marco A (F0) da [migração](../migracao-arquitetura.md).
> Documenta o canal entre a camada BFF do Web App (Vercel) e o AI Service (FastAPI, Railway).
> Mudanças neste contrato exigem bump de versão e atualização dos dois lados.

## Transporte

- `POST` do BFF para o AI Service; resposta `text/event-stream`, repassada ao browser pelo proxy do
  BFF ([api/conversation/stream/route.ts](../../web/src/app/api/conversation/stream/route.ts)).
- O BFF é o único cliente do AI Service. O browser nunca fala com o Railway diretamente.
- **Auth**: sessão NextAuth validada no BFF; chamada interna autenticada por `API_SHARED_SECRET`
  (header via `internalApiHeaders`). Em multi-tenant, o BFF injeta `tenant` no corpo — o AI Service
  nunca confia em tenant vindo do browser.
- Headers do proxy: `Content-Type: text/event-stream`, `Cache-Control: no-cache`,
  `X-Accel-Buffering: no`.

## Eventos

Cada evento é uma linha `data: <json>\n\n`. O campo `type` discrimina:

| `type` | Payload | Semântica |
|---|---|---|
| `text` | `{ text }` | fragmento visível da narrativa (streaming incremental) |
| `loading` | `{}` | a resposta segue em processamento (tool em execução) |
| `error` | `{ text }` | falha; mensagem segura em pt-BR; encerra o stream |
| `done` | `{ answer, suggestions, artifacts, guardrail_triggered, provenance }` | resposta consolidada; encerra o stream |

### `done.provenance` (obrigatório a partir da F6)

```json
{
  "source": "snapshot",
  "snapshot_ts": "2026-06-10T18:35:00Z",
  "stale": false,
  "tenant": "default"
}
```

Segue o [envelope de provenance](data-envelope.md): identifica de onde e de quando vieram os números
citados na resposta. Hoje (v1, pré-F6) os eventos `text`/`loading`/`error`/`done` já existem no
[conversation.py](../../api/app/api/routes/conversation.py); `provenance` é o campo novo que o AI
Service passa a emitir quando as tools forem read-only sobre o Postgres (F6).

## Invariantes (fail-closed)

1. **Números só do núcleo determinístico.** A narrativa só pode citar números presentes na saída das
   tools (leitura de `market`/`portfolio`). Número que só existe em contexto de RAG/news → bloqueado.
2. **Guardião roda em toda resposta.** `guardrail_triggered: true` indica que a resposta foi alterada
   ou bloqueada; o BFF nunca remove esse campo.
3. **Sem recomendação.** O Guardião bloqueia linguagem prescritiva ("você deveria…", "momento de
   comprar…") — regra editorial do AGENTS.md §3, enforçada em código.
4. **Falha fecha.** Se o Guardião ou a validação de provenance falharem, a resposta é `error` — nunca
   um `done` sem validação.
