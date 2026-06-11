# ADR 0007 - Banco unificado no Neon; schema como contrato formal entre os times

## Status

Aceita em 2026-06-11. **Reverte o ADR [0006](0006-supabase-como-snapshot-db-tier-2.md)** (Supabase sai
inteiro) e **reafirma o desenho de snapshot do ADR [0005](0005-fallback-em-dois-tiers.md)**, agora com
schema próprio.

## Contexto

O ADR 0006 colocou o snapshot num Supabase separado. Na prática isso criava um segundo Postgres (duas
migrations, dois monitoramentos, risco de pausa do free tier) para proteger contra um cenário — queda do
Neon — em que o app inteiro já está fora. Ao mesmo tempo, com o AI Service em repo/time separado lendo o
banco direto, a fronteira de dados estava ambígua: metade contrato via API, metade via DB.

## Decisão

1. **Banco unificado no Neon** — schemas `market`, `portfolio`, `auth`, `news`, `ai`.
2. **Snapshots viram schema próprio** (`snapshots`), com `snapshot_id` e rotulagem de staleness na
   leitura (envelope `{source, ts, stale}`).
3. **PITR do Neon cobre corrupção.** Pára-quedas opcional contra outage: export EOD do último snapshot
   bom para **Vercel Blob** (objeto frio, não um segundo banco).
4. **O schema do Neon é o contrato formal entre o time web e o time de IA.** A IA lê o banco direto —
   assumido conscientemente, não deixado ambíguo:
   - **Roles do Postgres como enforcement**: write em `news`/`ai`; read-only em `market`/`portfolio`.
   - Mudança nos schemas `market`/`portfolio` é **breaking change para o time de IA** e passa pela
     mesma disciplina **expand-contract** do pipeline de deploy (expandir → migrar consumidores →
     contrair).

## Consequências

- Morre a duplicidade "metade via API pública, metade via DB" — escolhido: **DB com roles**.
- Sem `SUPABASE_*` no ambiente; uma connection string a menos para vazar.
- PR que altera `market`/`portfolio` exige revisão do time de IA (ou changelog de schema versionado).
- Export para Blob, se adotado, é job de cron do Módulo market — mesmo dono, mesma idempotência.
