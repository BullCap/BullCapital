# ADR 0006 - Supabase como Snapshot DB Tier 2; Neon é o banco real

## Status

Aceita em 2026-06-10. **Substitui o ADR [0005](0005-fallback-em-dois-tiers.md)** na parte do snapshot
(o cache quente Upstash e o envelope de staleness do 0005 permanecem válidos).

## Contexto

O ADR 0005 decidiu não ter Snapshot DB separado no MVP e exigiu, para reabrir a decisão, "owner de
escrita, cadência, stale policy e plano de custo/operabilidade". A decisão de produto de 2026-06-10
reabriu: o time quer o snapshot em provider separado do banco real, aceitando o custo operacional em
troca de isolamento físico do fallback de leitura.

## Decisão

- **Neon** é o banco real — fonte da verdade, todos os schemas, único destino de escrita do app.
- **Supabase** é o Snapshot DB Tier 2 — somente o "último snapshot bom" de mercado, **read-only no
  caminho de request**.
- **Owner de escrita:** exclusivamente o job de sync (cron do Módulo market), que copia de `market.*`
  (Neon) para o Supabase **após cada run EOD** (cadência mínima diária; opcionalmente pós-intraday).
- **Stale policy:** leitura do snapshot sempre sai com envelope `{ source: "snapshot", ts, stale }`;
  os limiares de staleness são os do [contrato de envelope](../contracts/data-envelope.md).
- **Cadeia de leitura:** Brapi → Upstash (cache quente) → Neon `market.*` → Supabase (snapshot).

## Custo / operabilidade

- Free tier do Supabase **pausa projetos inativos** — fatal para um fallback raramente lido. Exige
  **tier pago ou keep-alive** (o próprio job de sync diário funciona como keep-alive de escrita;
  monitorar mesmo assim).
- **Idade do snapshot é métrica de alerta**: sync que falha em silêncio = fallback podre.
- Migrations do snapshot são triviais (espelho de `market.*`); ownership do espelho é do Módulo market.

## Consequências

- O app nunca escreve no Supabase no caminho de request; credencial de runtime pode ser read-only.
- Duas connection strings no web (`SUPABASE_*`), documentadas na tabela §8.2 do plano.
- Se o sync ficar caro ou frágil, o caminho de volta é o desenho do ADR 0005 (snapshot como tabela no
  Neon) — um ADR novo registraria a reversão.
