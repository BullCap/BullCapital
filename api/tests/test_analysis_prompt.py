"""Tests for analysis prompt construction."""

from app.api.routes.analysis import _build_prompt


def test_market_prompt_uses_market_context() -> None:
    """General market analyses should not be framed as a fake asset."""
    prompt = _build_prompt(
        subject="mercado",
        source="market",
        context={
            "indices": [{"name": "Ibovespa", "symbol": "^BVSP", "price": 141000, "change": 0.72}],
            "selic": "15,00% a.a.",
        },
        template="Explique o clima do dia.",
    )

    assert "Analise o mercado brasileiro em geral" in prompt
    assert "Analise o ativo mercado" not in prompt
    assert "Ibovespa: 141000.00 (+0.72% no dia)" in prompt
    assert "SELIC: 15,00% a.a." in prompt
    assert "Não use price_chart nem radar_chart" in prompt
