"""Analysis router for contextual market intelligence endpoints."""

import asyncio
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


def _build_prompt(
    subject: str,
    context: dict,
    template: str | None = None,
    source: str = "asset",
) -> str:
    parts: list[str] = []
    if "price" in context:
        parts.append(f"Preço atual: R$ {float(context['price']):.2f}")
    if "change" in context:
        parts.append(f"Variação no dia: {float(context['change']):+.2f}%")
    if "radar" in context:
        score_str = ", ".join(f"{k}: {v}/100" for k, v in context["radar"].items())
        parts.append(f"Scores de qualidade: {score_str}")
    if "indices" in context and isinstance(context["indices"], list):
        for index in context["indices"]:
            if not isinstance(index, dict):
                continue
            name = index.get("name") or index.get("symbol") or "Indice"
            price = index.get("price")
            change = index.get("change")
            if isinstance(price, (int, float)) and isinstance(change, (int, float)):
                parts.append(f"{name}: {price:.2f} ({change:+.2f}% no dia)")
    if "selic" in context:
        parts.append(f"SELIC: {context['selic']}")

    context_str = "\n".join(parts) if parts else "Dados de contexto limitados."
    if source == "market":
        header = (
            "Analise o mercado brasileiro em geral com base nos dados abaixo.\n\n"
            f"Contexto:\n{context_str}\n\n"
        )
    else:
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
        '    {"template": "price_chart", "title": "...", "range": "1d|1mo|3mo", "chart_note": "observação sobre a tendência de preço"},\n'
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
        '  * Use price_chart quando a tendência de preço for relevante (range: 1d para pregão, 1mo para médio prazo, 3mo para horizonte mais longo)\n'
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

    if source == "market":
        schema += (
            '\n- Para mercado geral, prefira bar_chart, metrics, signal_list ou insight_card\n'
            '- Não use price_chart nem radar_chart sem dados próprios de um ativo'
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


def _format_percent(value: object) -> str:
    try:
        return f"{float(value):+.2f}%"
    except (TypeError, ValueError):
        return "indisponível"


def _format_price(value: object) -> str:
    try:
        return f"R$ {float(value):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except (TypeError, ValueError):
        return "indisponível"


def _fallback_analysis(request: AnalysisRequest) -> dict:
    """Return a renderable local analysis when the model provider fails."""
    if request.source == "market":
        indices = request.context.get("indices")
        indices = indices if isinstance(indices, list) else []
        main_index = next((item for item in indices if isinstance(item, dict)), {})
        index_name = main_index.get("name") or "Ibovespa"
        index_change = _format_percent(main_index.get("change"))
        selic = request.context.get("selic") or "indisponível"

        summary = (
            f"{index_name} aparece em {index_change} e a SELIC está em {selic}; "
            "a leitura principal é separar ruído de curto prazo dos sinais que realmente mudam o cenário."
        )
        metrics = [
            {
                "label": str(item.get("name") or item.get("symbol") or "Índice"),
                "value": _format_percent(item.get("change")),
            }
            for item in indices
            if isinstance(item, dict)
        ]
        if selic != "indisponível":
            metrics.append({"label": "SELIC", "value": str(selic)})

        return {
            "summary": summary,
            "sections": {
                "o_que_aconteceu": (
                    f"O mercado está com {index_name} em {index_change}. "
                    "Esse movimento ajuda a medir o humor do dia, mas sozinho não fecha a leitura."
                ),
                "por_que_importa": (
                    "Índices mostram o pano de fundo para ativos individuais. "
                    "Quando o índice muda pouco, notícias específicas e liquidez podem pesar mais."
                ),
                "impacto_potencial": (
                    "O impacto tende a aparecer em rotação entre setores, apetite por risco e sensibilidade a juros."
                ),
                "o_que_acompanhar": (
                    "- Continuidade do movimento do Ibovespa\n"
                    "- Direção do S&P 500 e do VIX\n"
                    "- Juros e notícias macro que mexam no custo de capital"
                ),
                "riscos_e_incertezas": (
                    "A leitura é limitada pelos dados disponíveis no momento. "
                    "Mudanças rápidas em juros, câmbio ou notícias corporativas podem alterar o quadro."
                ),
            },
            "artifacts": [
                {
                    "template": "metrics",
                    "title": "Painel do mercado",
                    "metrics": metrics[:4],
                },
                {
                    "template": "signal_list",
                    "title": "Sinais para monitorar",
                    "bullets": [
                        "Confirme se o movimento se mantém ao longo do pregão.",
                        "Compare o Ibovespa com S&P 500 e VIX para separar fator local de externo.",
                        "Use a SELIC como referência para custo de capital e valuation.",
                    ],
                },
            ],
        }

    price = _format_price(request.context.get("price"))
    change = _format_percent(request.context.get("change"))
    radar = request.context.get("radar")
    radar = radar if isinstance(radar, dict) else {}

    artifacts: list[dict] = [
        {
            "template": "metrics",
            "title": f"Números de {request.subject}",
            "metrics": [
                {"label": "Preço", "value": price},
                {"label": "Variação", "value": change},
            ],
        },
        {
            "template": "signal_list",
            "title": "Pontos de atenção",
            "bullets": [
                "Veja se o movimento tem volume suficiente para sustentar a leitura.",
                "Compare o ativo com o mercado para entender se o sinal é próprio ou setorial.",
                "Acompanhe notícias e resultados que possam explicar a variação.",
            ],
        },
    ]
    if radar:
        artifacts.append(
            {
                "template": "radar_chart",
                "title": "Radar de qualidade",
                "chart_note": "Scores calculados com os dados disponíveis no momento.",
            }
        )

    return {
        "summary": f"{request.subject} aparece em {price} com variação de {change}; a análise deve focar em contexto, volume e riscos.",
        "sections": {
            "o_que_aconteceu": (
                f"{request.subject} está sendo observado com preço em {price} e variação de {change}."
            ),
            "por_que_importa": (
                "Preço e variação ajudam a entender o momento, mas precisam ser lidos junto com liquidez, notícias e cenário do mercado."
            ),
            "impacto_potencial": (
                "O impacto potencial depende de continuidade do fluxo, reação do setor e confirmação por dados novos."
            ),
            "o_que_acompanhar": (
                "- Volume negociado\n"
                "- Notícias recentes do ativo\n"
                "- Comparação com o Ibovespa e pares do setor"
            ),
            "riscos_e_incertezas": (
                "A leitura é contextual e não substitui análise completa. Mudanças rápidas de mercado podem invalidar sinais de curto prazo."
            ),
        },
        "artifacts": artifacts,
    }


@router.post("", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest) -> AnalysisResponse:
    """Generate contextual market analysis without recommendations."""
    prompt = _build_prompt(request.subject, request.context, request.template, request.source)
    try:
        content = await asyncio.wait_for(
            market_analysis_agent.run(prompt, request.context),
            timeout=25,
        )
    except Exception:
        content = ""
    payload = _parse_payload(content)
    sections = payload.get("sections") if isinstance(payload.get("sections"), dict) else {}
    if not sections:
        sections = {k: payload.get(k, "") for k in _SECTION_KEYS}
    for key in _SECTION_KEYS:
        sections.setdefault(key, "")

    artifacts = payload.get("artifacts") if isinstance(payload.get("artifacts"), list) else []
    summary = payload.get("summary") or sections.get("o_que_aconteceu", "")[:250]
    if not summary and not artifacts and not any(sections.values()):
        fallback = _fallback_analysis(request)
        sections = fallback["sections"]
        artifacts = fallback["artifacts"]
        summary = fallback["summary"]

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
