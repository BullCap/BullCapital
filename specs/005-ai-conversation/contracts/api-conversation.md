# Contract: POST /api/v1/conversation

## Endpoint

`POST http://localhost:8001/api/v1/conversation`

## Request

```json
{
  "subject": "PETR4",
  "context": {
    "price": 38.50,
    "change": -1.20,
    "radar": {
      "Rentabilidade": 72,
      "Momentum": 45,
      "Liquidez": 88,
      "Valuation": 61,
      "Tendência": 53
    }
  },
  "analysis": {
    "o_que_aconteceu": "string (markdown)",
    "por_que_importa": "string (markdown)",
    "impacto_potencial": "string (markdown)",
    "o_que_acompanhar": "string (markdown)",
    "riscos_e_incertezas": "string (markdown)"
  },
  "history": [
    { "role": "user", "content": "string" },
    { "role": "assistant", "content": "string" }
  ],
  "question": "O que significa momentum baixo para PETR4?"
}
```

**Constraints:**
- `subject`: obrigatório, ticker normalizado (ex: PETR4, VALE3)
- `question`: obrigatório, não-vazio
- `history`: opcional, array de até 20 entradas (10 turnos)
- `analysis`: opcional — se ausente, a IA responde só com base em `context`

## Response (200 OK)

```json
{
  "answer": "string (markdown — sem recomendação de compra/venda)",
  "suggestions": [
    "Como o câmbio afeta PETR4?",
    "Qual o impacto do petróleo no momentum?",
    "O valuation está atrativo?"
  ],
  "guardrail_triggered": false
}
```

**Constraints:**
- `answer`: sempre em português, sempre em markdown, sem recomendação direta
- `suggestions`: 2-3 itens, máx 60 caracteres cada, sempre em português
- `guardrail_triggered`: true quando a IA detectou e recusou pedido de recomendação

## Response (500)
```json
{ "detail": "Internal server error" }
```

## Guardrail Rules (aplicadas no system prompt)

A IA NUNCA deve:
- Recomendar comprar, vender, manter ou alocar em qualquer ativo
- Afirmar que um ativo "vai subir" ou "vai cair"
- Sugerir percentual de carteira ou alocação
- Avaliar adequação do investimento ao perfil do usuário

A IA SEMPRE deve:
- Responder em português brasileiro
- Ancorar a resposta ao ativo/contexto fornecido
- Quando detectar pedido de recomendação, declinar e oferecer contexto factual
- Gerar 2-3 sugestões de follow-up relevantes ao que acabou de responder
