# Contrato — Payload determinístico de carteira (v1)

> **Status**: rascunho normativo para o Bloco 3 do Backend V1.
> Define o payload que o Web App calcula no núcleo determinístico e entrega ao AI Service para
> narração. A IA não recalcula estes números: ela apenas transforma os campos abaixo em narrativa
> descritiva, com o Guardião validando proveniência e linguagem.

## Princípios

1. **Número nasce no Web App.** FGC, concentração, alocação, vencimentos e delta contra política são
   calculados em `modules/portfolio/`.
2. **Sem CPF bruto no payload de IA.** O cliente é identificado por `client.id` e `client.label`;
   quando houver necessidade operacional, usar hash ou final mascarado, nunca CPF completo.
3. **Valores monetários em centavos.** Todo campo `*Cents` é inteiro em BRL. A UI decide a
   formatação pt-BR; o AI Service não deve formatar por conta própria sem preservar o valor original.
4. **Razões como decimal.** Pesos, limites e utilizações são números entre `0` e `1`.
5. **Staleness explícita.** O payload carrega `provenance` e `snapshot.ageDays`; narrativa deve avisar
   quando `stale: true`.
6. **Métrica citável.** Linhas agregadas têm `metricId` estável para o Guardião confirmar que a prosa
   cita números existentes.

## Envelope

```ts
type PortfolioDeterministicPayload = import(
  "../../web/src/modules/portfolio"
).PortfolioDeterministicPayload
```

Campos de topo:

| Campo | Tipo | Semântica |
|---|---|---|
| `schemaVersion` | `"portfolio-deterministic-payload.v1"` | versão breaking do contrato |
| `payloadId` | string | id único do payload entregue ao AI Service |
| `generatedAt` | string ISO 8601 UTC | quando o Web App gerou o payload |
| `locale` | `"pt-BR"` | idioma obrigatório da narrativa |
| `scope` | objeto | workspace/member que autorizou a geração |
| `client` | objeto | referência não sensível ao cliente |
| `snapshot` | objeto | snapshot imutável usado nos cálculos |
| `provenance` | objeto | segue o envelope de dados v1 |
| `totals` | objeto | totais consolidados da carteira |
| `positions` | array | posições normalizadas que suportam os agregados |
| `allocations` | objeto | buckets por classe, instituição e emissor |
| `fgc` | objeto | cobertura FGC por CPF mascarado/hash × instituição |
| `policy` | objeto ou `null` | política-alvo e delta, quando configurada |
| `maturityCalendar` | array | vencimentos agrupados por mês |
| `concentration` | objeto | alertas por classe/emissor/instituição |
| `narrativeGuardrails` | objeto | instruções que a IA deve preservar |

## JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://bullcapital.com.br/contracts/portfolio-deterministic-payload.v1.schema.json",
  "title": "PortfolioDeterministicPayload",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "payloadId",
    "generatedAt",
    "locale",
    "scope",
    "client",
    "snapshot",
    "provenance",
    "totals",
    "positions",
    "allocations",
    "fgc",
    "policy",
    "maturityCalendar",
    "concentration",
    "narrativeGuardrails"
  ],
  "properties": {
    "schemaVersion": { "const": "portfolio-deterministic-payload.v1" },
    "payloadId": { "type": "string", "minLength": 1 },
    "generatedAt": { "type": "string", "format": "date-time" },
    "locale": { "const": "pt-BR" },
    "scope": { "$ref": "#/$defs/scope" },
    "client": { "$ref": "#/$defs/client" },
    "snapshot": { "$ref": "#/$defs/snapshot" },
    "provenance": { "$ref": "#/$defs/provenance" },
    "totals": { "$ref": "#/$defs/totals" },
    "positions": {
      "type": "array",
      "items": { "$ref": "#/$defs/position" }
    },
    "allocations": { "$ref": "#/$defs/allocations" },
    "fgc": { "$ref": "#/$defs/fgc" },
    "policy": {
      "anyOf": [{ "$ref": "#/$defs/policy" }, { "type": "null" }]
    },
    "maturityCalendar": {
      "type": "array",
      "items": { "$ref": "#/$defs/maturityBucket" }
    },
    "concentration": { "$ref": "#/$defs/concentration" },
    "narrativeGuardrails": { "$ref": "#/$defs/narrativeGuardrails" }
  },
  "$defs": {
    "source": {
      "type": "string",
      "enum": ["brapi", "bcb_sgs", "cache", "snapshot"]
    },
    "assetClass": {
      "type": "string",
      "enum": [
        "CASH",
        "FIXED_INCOME",
        "TREASURY",
        "FUND",
        "EQUITY",
        "FII",
        "ETF",
        "PENSION",
        "COE",
        "OTHER"
      ]
    },
    "scope": {
      "type": "object",
      "additionalProperties": false,
      "required": ["workspaceId", "memberId"],
      "properties": {
        "workspaceId": { "type": "string", "minLength": 1 },
        "memberId": { "type": "string", "minLength": 1 }
      }
    },
    "client": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "label"],
      "properties": {
        "id": { "type": "string", "minLength": 1 },
        "label": { "type": "string", "minLength": 1 },
        "cpfHash": { "type": "string" },
        "cpfMasked": { "type": "string" }
      }
    },
    "snapshot": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "importedAt", "valuationDate", "ageDays", "stale"],
      "properties": {
        "id": { "type": "string", "minLength": 1 },
        "importedAt": { "type": "string", "format": "date-time" },
        "valuationDate": { "type": "string", "format": "date" },
        "expiresAt": { "type": "string", "format": "date-time" },
        "ageDays": { "type": "integer", "minimum": 0 },
        "stale": { "type": "boolean" },
        "sourceFile": {
          "type": "object",
          "additionalProperties": false,
          "required": ["name", "sha256"],
          "properties": {
            "name": { "type": "string", "minLength": 1 },
            "sha256": { "type": "string", "minLength": 64, "maxLength": 64 }
          }
        }
      }
    },
    "provenance": {
      "type": "object",
      "additionalProperties": false,
      "required": ["source", "ts", "stale"],
      "properties": {
        "source": { "$ref": "#/$defs/source" },
        "ts": { "type": "string", "format": "date-time" },
        "stale": { "type": "boolean" }
      }
    },
    "totals": {
      "type": "object",
      "additionalProperties": false,
      "required": ["grossValueCents", "netValueCents", "positionCount", "institutionCount"],
      "properties": {
        "grossValueCents": { "type": "integer", "minimum": 0 },
        "netValueCents": { "type": "integer", "minimum": 0 },
        "positionCount": { "type": "integer", "minimum": 0 },
        "institutionCount": { "type": "integer", "minimum": 0 }
      }
    },
    "position": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "institution",
        "assetClass",
        "assetLabel",
        "grossValueCents",
        "weight"
      ],
      "properties": {
        "id": { "type": "string", "minLength": 1 },
        "institution": { "type": "string", "minLength": 1 },
        "assetClass": { "$ref": "#/$defs/assetClass" },
        "ticker": { "type": "string" },
        "issuer": { "type": "string" },
        "assetLabel": { "type": "string", "minLength": 1 },
        "grossValueCents": { "type": "integer", "minimum": 0 },
        "netValueCents": { "type": "integer", "minimum": 0 },
        "weight": { "type": "number", "minimum": 0, "maximum": 1 },
        "quantity": { "type": "number", "minimum": 0 },
        "maturityDate": { "type": "string", "format": "date" },
        "indexer": { "type": "string" },
        "rate": { "type": "string" }
      }
    },
    "bucket": {
      "type": "object",
      "additionalProperties": false,
      "required": ["metricId", "label", "valueCents", "weight"],
      "properties": {
        "metricId": { "type": "string", "minLength": 1 },
        "label": { "type": "string", "minLength": 1 },
        "valueCents": { "type": "integer", "minimum": 0 },
        "weight": { "type": "number", "minimum": 0, "maximum": 1 },
        "count": { "type": "integer", "minimum": 0 }
      }
    },
    "allocations": {
      "type": "object",
      "additionalProperties": false,
      "required": ["byAssetClass", "byInstitution", "byIssuer"],
      "properties": {
        "byAssetClass": { "type": "array", "items": { "$ref": "#/$defs/bucket" } },
        "byInstitution": { "type": "array", "items": { "$ref": "#/$defs/bucket" } },
        "byIssuer": { "type": "array", "items": { "$ref": "#/$defs/bucket" } }
      }
    },
    "fgc": {
      "type": "object",
      "additionalProperties": false,
      "required": ["config", "byInstitution", "totals"],
      "properties": {
        "config": {
          "type": "object",
          "additionalProperties": false,
          "required": ["perInstitutionLimitCents", "globalLimitCents", "effectiveDate", "source"],
          "properties": {
            "perInstitutionLimitCents": { "type": "integer", "minimum": 0 },
            "globalLimitCents": { "type": "integer", "minimum": 0 },
            "effectiveDate": { "type": "string", "format": "date" },
            "source": {
              "type": "string",
              "enum": ["workspace_config", "system_default", "demo_default"]
            }
          }
        },
        "byInstitution": {
          "type": "array",
          "items": { "$ref": "#/$defs/fgcInstitution" }
        },
        "totals": { "$ref": "#/$defs/fgcTotals" }
      }
    },
    "fgcInstitution": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "metricId",
        "institution",
        "exposureCents",
        "coveredCents",
        "uncoveredCents",
        "utilization"
      ],
      "properties": {
        "metricId": { "type": "string", "minLength": 1 },
        "institution": { "type": "string", "minLength": 1 },
        "exposureCents": { "type": "integer", "minimum": 0 },
        "coveredCents": { "type": "integer", "minimum": 0 },
        "uncoveredCents": { "type": "integer", "minimum": 0 },
        "utilization": { "type": "number", "minimum": 0 }
      }
    },
    "fgcTotals": {
      "type": "object",
      "additionalProperties": false,
      "required": ["exposureCents", "coveredCents", "uncoveredCents"],
      "properties": {
        "exposureCents": { "type": "integer", "minimum": 0 },
        "coveredCents": { "type": "integer", "minimum": 0 },
        "uncoveredCents": { "type": "integer", "minimum": 0 }
      }
    },
    "policy": {
      "type": "object",
      "additionalProperties": false,
      "required": ["scope", "targets"],
      "properties": {
        "scope": { "type": "string", "enum": ["workspace", "client"] },
        "targets": {
          "type": "array",
          "items": { "$ref": "#/$defs/policyTarget" }
        }
      }
    },
    "policyTarget": {
      "type": "object",
      "additionalProperties": false,
      "required": ["metricId", "assetClass", "targetWeight", "currentWeight", "deltaWeight", "deltaValueCents"],
      "properties": {
        "metricId": { "type": "string", "minLength": 1 },
        "assetClass": { "$ref": "#/$defs/assetClass" },
        "targetWeight": { "type": "number", "minimum": 0, "maximum": 1 },
        "currentWeight": { "type": "number", "minimum": 0, "maximum": 1 },
        "deltaWeight": { "type": "number", "minimum": -1, "maximum": 1 },
        "deltaValueCents": { "type": "integer" }
      }
    },
    "maturityBucket": {
      "type": "object",
      "additionalProperties": false,
      "required": ["metricId", "month", "valueCents", "count"],
      "properties": {
        "metricId": { "type": "string", "minLength": 1 },
        "month": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}$" },
        "valueCents": { "type": "integer", "minimum": 0 },
        "count": { "type": "integer", "minimum": 0 }
      }
    },
    "concentration": {
      "type": "object",
      "additionalProperties": false,
      "required": ["thresholds", "alerts"],
      "properties": {
        "thresholds": {
          "type": "object",
          "additionalProperties": false,
          "required": ["issuerMaxWeight", "assetClassMaxWeight", "institutionMaxWeight"],
          "properties": {
            "issuerMaxWeight": { "type": "number", "minimum": 0, "maximum": 1 },
            "assetClassMaxWeight": { "type": "number", "minimum": 0, "maximum": 1 },
            "institutionMaxWeight": { "type": "number", "minimum": 0, "maximum": 1 }
          }
        },
        "alerts": {
          "type": "array",
          "items": { "$ref": "#/$defs/concentrationAlert" }
        }
      }
    },
    "concentrationAlert": {
      "type": "object",
      "additionalProperties": false,
      "required": ["metricId", "level", "kind", "label", "weight", "threshold"],
      "properties": {
        "metricId": { "type": "string", "minLength": 1 },
        "level": { "type": "string", "enum": ["info", "attention", "critical"] },
        "kind": { "type": "string", "enum": ["issuer", "asset_class", "institution"] },
        "label": { "type": "string", "minLength": 1 },
        "weight": { "type": "number", "minimum": 0, "maximum": 1 },
        "threshold": { "type": "number", "minimum": 0, "maximum": 1 },
        "excessValueCents": { "type": "integer", "minimum": 0 }
      }
    },
    "narrativeGuardrails": {
      "type": "object",
      "additionalProperties": false,
      "required": ["forbidRecommendation", "requireDisclaimer", "allowedMetricIds"],
      "properties": {
        "forbidRecommendation": { "const": true },
        "requireDisclaimer": { "const": true },
        "allowedMetricIds": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  }
}
```

## Invariantes para o AI Service

1. O AI Service rejeita payload com `schemaVersion` desconhecida.
2. A narrativa só pode citar números presentes no payload e, preferencialmente, associados a um
   `metricId`.
3. Quando `snapshot.stale` ou `provenance.stale` forem `true`, a narrativa deve mencionar a idade do
   dado de forma neutra.
4. `narrativeGuardrails.forbidRecommendation` e `requireDisclaimer` são obrigatoriamente `true`.
5. O output narrativo nunca deve incluir CPF bruto, recomendação de compra/venda/hold ou projeção não
   calculada pelo núcleo determinístico.
