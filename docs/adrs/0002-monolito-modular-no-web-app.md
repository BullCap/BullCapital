# ADR 0002 - Monolito modular no Web App

## Status

Aceita em 2026-06-10.

## Contexto

O Web App concentra BFF, auth, módulos determinísticos e composição de UI. Sem regra de fronteira, o
monorepo tende a virar uma bola de lama: components importando data access, news consultando tabelas de
market, reports recalculando risco fora do portfolio.

## Decisão

O Web App continua um monolito, mas com módulos explícitos em `web/src/modules/*`. Cada módulo expõe apenas
seu `index.ts`; arquivos internos de `data`, `ingest` e implementação não são importáveis fora do módulo.

Módulos alvo:

- `market` / Assets: mercado, ativos, Brapi, BCB SGS, snapshots e envelope de staleness.
- `portfolio`: import, reconciliação, FGC, risco, drift e snapshots de carteira.
- `reports`: composição determinística de relatórios e export.
- `user`: auth, perfil e sessão.

## Consequências

- BFF pode chamar módulos; módulos não chamam BFF.
- Import cruzado de arquivos internos entre módulos é violação arquitetural.
- O Módulo news do AI Service não lê `market.*` diretamente para descobrir ativos; usa interface pública de
  Assets/market.
- Extração para serviço separado só é considerada depois de interface pública, testes e motivo operacional.
