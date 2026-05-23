"""Tests for structured conversation artifacts."""

from app.api.routes.conversation import (
    _normalize_conversation_artifacts,
    _parse_stream_artifacts,
    _strip_stream_footer,
)


def test_strip_stream_footer_removes_artifacts_from_visible_answer() -> None:
    """Footer metadata should not appear inside the chat bubble."""
    text = (
        "Resumo curto.\n"
        '[ARTIFACTS]: [{"template":"flow","steps":["Receita","Margem"]}]\n'
        "[SUGESTÕES]: Como comparar margens? | Quais riscos?"
    )

    assert _strip_stream_footer(text) == "Resumo curto."


def test_parse_stream_artifacts_accepts_known_templates() -> None:
    """The stream footer can carry renderable tables for the frontend."""
    text = (
        "Resposta.\n"
        '[ARTIFACTS]: [{"template":"table","title":"Exportadoras",'
        '"columns":["Setor","Exemplo","Efeito"],'
        '"rows":[["Mineração","VALE3","Receita em dólar"]]}]\n'
        "[SUGESTÕES]: O que muda com hedge?"
    )

    assert _parse_stream_artifacts(text) == [
        {
            "template": "table",
            "title": "Exportadoras",
            "columns": ["Setor", "Exemplo", "Efeito"],
            "rows": [["Mineração", "VALE3", "Receita em dólar"]],
        }
    ]


def test_normalize_conversation_artifacts_rejects_unknown_templates() -> None:
    """Only UI-supported artifact templates are returned."""
    artifacts = _normalize_conversation_artifacts(
        [
            {"template": "script", "code": "alert(1)"},
            {"template": "flow", "steps": ["Câmbio", "Receita", "Margem"]},
        ]
    )

    assert artifacts == [{"template": "flow", "steps": ["Câmbio", "Receita", "Margem"]}]


def test_parse_stream_artifacts_handles_markdown_code_blocks() -> None:
    """The parser should robustly handle and clean markdown json backticks."""
    text = (
        "Resposta.\n"
        "[ARTIFACTS]: ```json\n"
        '[{"template":"flow","steps":["Etapa 1","Etapa 2"]}]\n'
        "```\n"
        "[SUGESTÕES]: O que vem depois?"
    )

    assert _parse_stream_artifacts(text) == [
        {
            "template": "flow",
            "steps": ["Etapa 1", "Etapa 2"],
        }
    ]


def test_normalize_conversation_artifacts_accepts_charts() -> None:
    """The normalizer should accept and sanitize price_chart, bar_chart, and radar_chart."""
    raw = [
        {
            "template": "price_chart",
            "title": "PETR4 Tendência",
            "range": "1mo",
            "chart_note": "Nota explicativa"
        },
        {
            "template": "bar_chart",
            "eyebrow": "Setor",
            "title": "Múltiplos P/L",
            "bars": [{"label": "PETR4", "value": 4.1}]
        },
        {
            "template": "radar_chart",
            "title": "Scores",
            "radarData": {"Qualidade": 80}
        }
    ]

    normalized = _normalize_conversation_artifacts(raw)
    assert len(normalized) == 3
    assert normalized[0]["template"] == "price_chart"
    assert normalized[0]["range"] == "1mo"
    assert normalized[1]["template"] == "bar_chart"
    assert normalized[1]["bars"] == [{"label": "PETR4", "value": 4.1}]
    assert normalized[2]["template"] == "radar_chart"
    assert normalized[2]["radarData"] == {"Qualidade": 80.0}
