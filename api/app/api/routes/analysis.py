"""Analysis router for contextual market intelligence endpoints."""

import json
import re

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agent.market_analysis import market_analysis_agent

router = APIRouter(prefix="/analysis", tags=["analysis"])

_SECTION_KEYS = [
    "o_que_aconteceu",
    "por_que_importa",
    "impacto_potencial",
    "o_que_acompanhar",
    "riscos_e_incertezas",
]


class AnalysisRequest(BaseModel):
    """Analysis request model."""

    subject: str
    source: str = "asset"
    context: dict = Field(default_factory=dict)
    template: str | None = None


class AnalysisResponse(BaseModel):
    """Analysis response model."""

    subject: str
    source: str
    summary: str
    sections: dict
    artifacts: list[dict] = Field(default_factory=list)
    data: dict = Field(default_factory=dict)


def _build_prompt(subject: str, context: dict, template: str | None = None) -> str:
    parts: list[str] = []
    if "price" in context:
        parts.append(f"Preço atual: R$ {float(context['price']):.2f}")
    if "change" in context:
        parts.append(f"Variação no dia: {float(context['change']):+.2f}%")
    if "radar" in context:
        score_str = ", ".join(f"{k}: {v}/100" for k, v in context["radar"].items())
        parts.append(f"Scores de qualidade: {score_str}")

    context_str = "\n".join(parts) if parts else "Dados de contexto limitados."

    header = (
        f"Analise o ativo {subject} no mercado brasileiro com base nos dados abaixo.\n\n"
        f"Contexto:\n{context_str}\n\n"
    )

    if template:
        header += f"Direcionamento: {template}\n\n"

    schema = (
        'Responda APENAS com um objeto JSON válido com estas chaves exatas:\n'
        '{\n'
        '  "summary": "...",\n'
        '  "sections": {\n'
        '    "o_que_aconteceu": "...",\n'
        '    "por_que_importa": "...",\n'
        '    "impacto_potencial": "...",\n'
        '    "o_que_acompanhar": "...",\n'
        '    "riscos_e_incertezas": "..."\n'
        '  },\n'
        '  "artifacts": [\n'
        '    {"template": "insight_card", "eyebrow": "...", "title": "...", "body": "...", "tone": "neutral|positive|negative"},\n'
        '    {"template": "signal_list", "title": "...", "bullets": ["..."]},\n'
        '    {"template": "metrics", "title": "...", "metrics": [{"label": "...", "value": "..."}]},\n'
        '    {"template": "price_chart", "title": "...", "range": "1d|1mo|1y", "chart_note": "observação sobre a tendência de preço"},\n'
        '    {"template": "radar_chart", "title": "...", "chart_note": "leitura dos scores de qualidade do ativo"},\n'
        '    {"template": "bar_chart", "title": "...", "bars": [{"label": "...", "value": 72, "color": "positive|negative|neutral"}]}\n'
        '  ]\n'
        '}\n\n'
        'Instruções de tom e linguagem:\n'
        '- Escreva como um analista experiente explicando para um amigo inteligente, não para um especialista\n'
        '- Português brasileiro simples e direto — evite jargão quando houver uma forma mais clara de dizer\n'
        '- Se precisar usar um termo técnico (ex: momentum, liquidez), explique brevemente o que significa\n'
        '- Prefira frases curtas e parágrafos de até 3 linhas\n'
        '- Summary com 1 frase curta e acessível\n'
        '- Seções com linguagem conversacional: use **negrito** para destacar termos importantes, listas com - para pontos múltiplos\n'
        '- Nunca use "conforme", "sobretudo", "outrossim", "nesse contexto" ou formalidades desnecessárias\n'
        '\n'
        'Instruções de artefatos visuais:\n'
        '- Escolha 2-3 artifacts que melhor representem os dados visualmente:\n'
        '  * Use price_chart quando a tendência de preço for relevante (range: 1d para pregão, 1mo para médio prazo, 1y para longo prazo)\n'
        '  * Use radar_chart quando os indicadores de qualidade forem o foco\n'
        '  * Use bar_chart para comparar métricas entre si (ex: scores, percentuais)\n'
        '  * Use insight_card para um insight central em texto\n'
        '  * Use signal_list para listar pontos de atenção\n'
        '  * Use metrics para mostrar números-chave lado a lado\n'
        '- Para tone use apenas: neutral, positive, negative\n'
        '\n'
        'Restrições:\n'
        '- Sem recomendações de compra, venda ou alocação\n'
        '- Baseie-se apenas nos dados fornecidos'
    )

    return header + schema


def _parse_payload(content: str) -> dict:
    # 1. strip markdown code fences (```json ... ``` or ``` ... ```)
    stripped = re.sub(r"```(?:json)?\s*", "", content).strip()

    # 2. try direct parse on stripped content
    for candidate in (stripped, content):
        try:
            result = json.loads(candidate)
            if isinstance(result, dict):
                return result
        except Exception:
            pass

    # 3. extract first {...} block that spans multiple lines
    match = re.search(r"\{[\s\S]*\}", stripped or content)
    if match:
        try:
            result = json.loads(match.group())
            if isinstance(result, dict):
                return result
        except Exception:
            pass

    return {}


@router.post("", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest) -> AnalysisResponse:
    """Generate contextual market analysis without recommendations."""
    prompt = _build_prompt(request.subject, request.context, request.template)
    content = await market_analysis_agent.run(prompt, request.context)
    payload = _parse_payload(content)
    sections = payload.get("sections") if isinstance(payload.get("sections"), dict) else {}
    if not sections:
        sections = {k: payload.get(k, "") for k in _SECTION_KEYS}
    for key in _SECTION_KEYS:
        sections.setdefault(key, "")

    artifacts = payload.get("artifacts") if isinstance(payload.get("artifacts"), list) else []
    summary = payload.get("summary") or sections.get("o_que_aconteceu", "")[:250]

    return AnalysisResponse(
        subject=request.subject,
        source=request.source,
        summary=summary,
        sections=sections,
        artifacts=artifacts,
        data=request.context,
    )


@router.get("/{ticker}")
async def get_analysis(ticker: str) -> dict:
    """Get cached contextual analysis for a ticker."""
    return {"ticker": ticker, "message": "No cached analysis available"}
