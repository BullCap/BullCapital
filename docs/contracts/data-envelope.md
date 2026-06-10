# Contrato — Envelope de provenance de dados (v1)

> **Status**: normativo a partir do Marco A (F0) da [migração](../migracao-arquitetura.md).
> Vale para toda resposta do Módulo market e para todo dado que as tools do AI Service leem.
> Mudanças neste contrato exigem bump de versão e atualização dos dois lados (web e AI Service).

## Princípio

**Degradação visível, nunca fabricação.** Nenhuma camada serve número sem dizer de onde veio e de
quando é. Quando a fonte primária falha, serve-se o último dado bom **rotulado** — nunca em silêncio.

## Envelope

Todo payload de dado de mercado (resposta de módulo, leitura de tool, resposta de cron) carrega:

| Campo | Tipo | Semântica |
|---|---|---|
| `source` | `'brapi' \| 'bcb_sgs' \| 'cache' \| 'snapshot'` | de onde o valor veio **nesta resposta** (`cache` = Upstash; `snapshot` = último bom no Neon) |
| `ts` | string ISO 8601 UTC | quando o valor foi obtido da fonte primária (não quando foi servido) |
| `stale` | boolean | `true` se `ts` excede o limiar de frescor do tipo de dado |

### Mapeamento para o formato existente

Os reads de quote de hoje já carregam `updatedAt` (ISO) e `isStale` por item
([market_db.py](../../api/app/services/market_db.py) — `_quote_is_stale`). O envelope v1 **formaliza**
esses campos com os nomes canônicos `ts`/`stale` e adiciona `source`. Durante a transição (F3/F4),
`updatedAt`/`isStale` permanecem como aliases; novos consumidores usam só os nomes canônicos.

## Limiares de frescor (dono: Módulo market)

| Tipo de dado | `stale` quando mais velho que |
|---|---|
| Quote intraday (pregão aberto) | 15 min |
| Quote fora de pregão | último fechamento (EOD do dia útil anterior) |
| Macro (SELIC, IPCA, PTAX — BCB SGS) | 24 h |
| Posição importada de carteira (crédito privado etc.) | data do último import — **sempre** exibir a idade na UI |

## Regras

1. O envelope é calculado **na leitura**, pelo dono do dado (Módulo market) — não é armazenado.
2. Tools do AI Service **propagam** o envelope; nunca o recalculam nem o omitem.
3. UI exibe staleness quando `stale: true` (rótulo de idade, não erro).
4. Proibido inventar `ts` ou rebaixar `stale` para "melhorar" a aparência do dado.
