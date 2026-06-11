# ADR 0005 - Fallback em dois tiers: cache quente e snapshot no Neon

## Status

Aceita em 2026-06-10. Foi parcialmente substituída pelo ADR 0006 (Supabase como Tier 2) e
**reafirmada em 2026-06-11 pelo ADR [0007](0007-banco-unificado-neon-schema-como-contrato.md)**, que
reverte o 0006: snapshot fica no Neon, agora em **schema próprio (`snapshots`) com `snapshot_id`**.
Cache quente Upstash, envelope `{source, ts, stale}` e degradação visível seguem válidos.

## Contexto

Dados de mercado podem falhar por timeout, rate-limit ou indisponibilidade da fonte primária. A Bull não
pode fabricar número nem esconder atraso. Ao mesmo tempo, um "Snapshot DB" em outro provider criaria mais
operação e só protegeria contra uma queda do próprio Neon, cenário em que auth e portfolio também estariam
afetados.

## Decisão

Usar dois tiers de resiliência:

1. **Upstash Redis:** cache quente e descartável, TTL curto, também usado para locks e rate-limit.
2. **Neon `market.*`:** último dado bom, tratado como snapshot read-only para consumidores.

Não haverá Snapshot DB separado no MVP. O Módulo market é o único escritor dos snapshots de mercado.

## Consequências

- Toda resposta de mercado carrega envelope `{ source, ts, stale }`.
- Fallback para snapshot ocorre quando fonte primária falha e Redis está ausente, velho ou indisponível.
- Dados com até 15 min de atraso durante pregão podem aparecer como atualizados há X min; acima do limiar,
  a UI entra em modo de dado stale/read-only.
- Adicionar provider separado para snapshot exige ADR novo, owner de escrita, cadência, stale policy e
  plano de custo/operabilidade.
