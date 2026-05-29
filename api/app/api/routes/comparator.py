"""Comparator router for Terminal — Mesa do Analista narratives."""

import json
import re

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agent.market_analysis import market_analysis_agent

router = APIRouter(prefix="/comparator", tags=["comparator"])


class ComparatorAsset(BaseModel):
    """Asset data supplied by the web BFF; the model never invents market numbers."""

    symbol: str
    name: str | None = None
    price: float | None = None
    change: float | None = None
    metrics: dict[str, float | None] = Field(default_factory=dict)


class ComparatorRequest(BaseModel):
    """Narrative request for 2-4 assets."""

    assets: list[ComparatorAsset] = Field(min_length=2, max_length=4)
    question: str | None = None


class ComparatorResponse(BaseModel):
    """Comparator narrative response."""

    narrative: str
    guardrail_triggered: bool = False
    data: dict[str, object] = Field(default_factory=dict)


def _format_price(value: float | None) -> str:
    if value is None:
        return "indisponível"
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _format_percent(value: float | None) -> str:
    if value is None:
        return "indisponível"
    return f"{value:+.2f}%".replace(".", ",")


def _build_prompt(request: ComparatorRequest) -> str:
    labels = {
        "dy": "Dividend Yield",
        "pl": "P/L",
        "pvp": "P/VP",
        "roe": "ROE",
        "evEbitda": "EV/EBITDA",
        "volume": "Volume",
    }
    asset_blocks: list[str] = []
    for asset in request.assets:
        lines = [
            f"Ticker: {asset.symbol}",
            f"Nome: {asset.name or 'indisponível'}",
            f"Preço: {_format_price(asset.price)}",
            f"Variação no dia: {_format_percent(asset.change)}",
        ]
        metric_parts = []
        for key, label in labels.items():
            value = asset.metrics.get(key)
            if value is not None:
                metric_parts.append(f"{label}: {value:.2f}")
        if metric_parts:
            lines.append("Métricas: " + "; ".join(metric_parts))
        asset_blocks.append("\n".join(lines))

    question = request.question or (
        "Explique diferenças relevantes, riscos de leitura e pontos a acompanhar."
    )
    assets_text = "\n\n".join(asset_blocks)

    return (
        "Você é a camada narrativa da Bull para o Terminal — Mesa do Analista.\n"
        "Compare os ativos abaixo usando APENAS os números fornecidos.\n"
        "Não recomende compra, venda, manutenção, entrada, saída ou alocação.\n"
        "Escreva em português brasileiro, tom editorial calmo e direto.\n\n"
        f"Ativos:\n\n{assets_text}\n\n"
        f"Pedido do usuário: {question}\n\n"
        "Responda APENAS com JSON válido neste formato:\n"
        '{"narrative":"markdown curto em pt-BR", "guardrail_triggered": false}\n'
    )


def _parse_payload(content: str) -> dict[str, object]:
    stripped = re.sub(r"```(?:json)?\s*", "", content).strip()
    stripped = re.sub(r"\s*```$", "", stripped)
    for candidate in (stripped, content):
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

    match = re.search(r"\{[\s\S]*\}", stripped or content)
    if match:
        try:
            parsed = json.loads(match.group())
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
    return {}


def _fallback_response(request: ComparatorRequest) -> ComparatorResponse:
    symbols = ", ".join(asset.symbol for asset in request.assets)
    narrative = (
        f"A comparação entre {symbols} deve ser lida como um retrato relativo, não como uma recomendação. "
        "Dividend yield, P/L, P/VP, ROE, EV/EBITDA e volume ajudam a separar renda, valuation, rentabilidade e liquidez. "
        "O próximo passo é checar se as diferenças vêm de setor, evento recente, resultado corporativo ou mudança macro."
    )
    return ComparatorResponse(
        narrative=narrative,
        guardrail_triggered=False,
        data={"tickers": [asset.symbol for asset in request.assets]},
    )


@router.post("", response_model=ComparatorResponse)
async def comparator(request: ComparatorRequest) -> ComparatorResponse:
    """Generate a contextual comparison narrative for 2-4 assets."""
    content = await market_analysis_agent.run(_build_prompt(request))
    payload = _parse_payload(content)
    narrative = payload.get("narrative")

    if not isinstance(narrative, str) or not narrative.strip():
        return _fallback_response(request)

    return ComparatorResponse(
        narrative=narrative.strip(),
        guardrail_triggered=bool(payload.get("guardrail_triggered", False)),
        data={"tickers": [asset.symbol for asset in request.assets]},
    )
