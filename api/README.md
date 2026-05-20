# BullCapital AI Service

Serviço de IA baseado em FastAPI com agentes especializados (Agno framework).

## Database

Utiliza **PostgreSQL + pgVector** para:

- Armazenamento de conversas e mensagens
- Embeddings vetoriais para RAG (Retrieval-Augmented Generation)
- Busca semântica em documentos financeiros

## Estrutura

```
ai-service/
├── app/
│   ├── agent/          # Agentes Agno (RAG, Valuation, etc.)
│   ├── api/            # FastAPI routes
│   ├── core/           # Config, database
│   └── models/         # SQLAlchemy models
├── alembic/            # Database migrations
├── tests/              # Pytest
├── requirements.txt    # Dependências de produção
└── requirements-dev.txt# Dependências de desenvolvimento
```

## Configuração

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Subir banco pgVector
docker compose up -d postgres-ai

# Executar migrations
alembic upgrade head
```

## Testes

```bash
pytest
ruff check .
mypy app/
```
