# Data Model: Conversa Contextual com IA

## Frontend (React State — sem persistência)

### ConversationTurn
```typescript
interface ConversationTurn {
  id: string               // uuid gerado no cliente
  question: string         // texto do usuário
  answer: string           // markdown retornado pela IA
  suggestions: string[]    // 2-3 perguntas de follow-up (geradas pela IA)
  loading?: boolean        // true enquanto aguarda resposta
}
```

### ConversationState (useState em AnalysisClient)
```typescript
const [turns, setTurns] = useState<ConversationTurn[]>([])
const [inputValue, setInputValue] = useState('')
const [sending, setSending] = useState(false)
```

---

## Backend FastAPI

### ConversationRequest
```python
class ConversationRequest(BaseModel):
    subject: str                    # ticker ex: "PETR4"
    context: dict                   # price, change, radar scores
    analysis: dict                  # sections da análise original (o_que_aconteceu, etc)
    history: list[dict]             # [{role: "user"|"assistant", content: str}]
    question: str                   # pergunta atual do usuário
```

### ConversationResponse
```python
class ConversationResponse(BaseModel):
    answer: str                     # markdown com a resposta
    suggestions: list[str]          # 2-3 follow-up questions (max 60 chars cada)
    guardrail_triggered: bool = False  # true se a IA desviou de recomendação
```

### HistoryEntry (elemento de history[])
```python
# Formato compatível com a API do LLM (OpenAI messages format)
{
    "role": "user" | "assistant",
    "content": str
}
```

---

## Fluxo de dados por turno

```
[Usuário digita] 
  → ConversationInput.onSubmit
  → Server Action: requestConversation(ticker, context, analysis, history, question)
  → FastAPI POST /api/v1/conversation
  → MarketAnalysisAgent.conversation_turn(prompt, history)
  → LLM → JSON: {answer, suggestions, guardrail_triggered}
  → ConversationResponse
  → ConversationTurn adicionado ao estado
  → AnalysisClient re-renders com novo turno
```

---

## Contexto enviado a cada turno

O contexto completo é enviado com cada requisição para que o LLM mantenha coerência mesmo sem memória nativa:

```json
{
  "subject": "PETR4",
  "context": {
    "price": 38.50,
    "change": -1.20,
    "radar": {"Rentabilidade": 72, "Momentum": 45, ...}
  },
  "analysis": {
    "o_que_aconteceu": "...",
    "por_que_importa": "...",
    "impacto_potencial": "...",
    "o_que_acompanhar": "...",
    "riscos_e_incertezas": "..."
  },
  "history": [
    {"role": "user", "content": "O que significa momentum baixo?"},
    {"role": "assistant", "content": "Momentum baixo indica..."}
  ],
  "question": "E como isso afeta o valuation?"
}
```
