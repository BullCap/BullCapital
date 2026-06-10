# ADR 0003 - Postgres único com schemas isolados

## Status

Aceita em 2026-06-10.

## Contexto

O produto precisa persistir auth, mercado, carteiras, news e artefatos de IA. Criar bancos separados cedo
aumentaria custo, migrations distribuídas, transações quebradas e rollback mais difícil. Manter tudo no
schema `public` ou `ai` apagaria ownership e fronteiras.

## Decisão

Usar um único Postgres Neon com schemas isolados:

- `market`, escrito pelo Módulo market.
- `portfolio`, escrito pelo Módulo portfolio.
- `auth`, escrito pelo Módulo user/Prisma.
- `news`, escrito pelo AI Service.
- `ai`, escrito pelo AI Service.

Prisma governa migrations de `market`, `portfolio` e `auth`. Alembic governa `news` e `ai`. O AI Service
tem write apenas em `news`/`ai` e read-only em `market`/`portfolio`.

## Consequências

- Banco único é escolha deliberada, não falta de arquitetura.
- Fronteira é aplicada por schema, role e módulo, não por database separado.
- Segundo banco ou read replica só entra com ADR novo e necessidade operacional verificável.
- Rollback de schema é migration forward corretiva; `reset` ou drop manual em produção é proibido.
