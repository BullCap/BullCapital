"""Conversation router for contextual follow-up questions anchored to a subject."""

import json
import re
import threading

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agent.market_analysis import market_analysis_agent

router = APIRouter(prefix="/conversation", tags=["conversation"])


class ConversationRequest(BaseModel):
    subject: str
    context: dict = Field(default_factory=dict)
    analysis: dict = Field(default_factory=dict)
    history: list[dict] = Field(default_factory=list)
    question: str


class ConversationResponse(BaseModel):
    answer: str
    suggestions: list[str] = Field(default_factory=list)
    artifacts: list[dict] = Field(default_factory=list)
    guardrail_triggered: bool = False


def _parse_conversation_payload(content: str) -> dict:
    stripped = re.sub(r"```(?:json)?\s*", "", content).strip()
    for candidate in (stripped, content):
        try:
            result = json.loads(candidate)
            if isinstance(result, dict):
                return result
        except Exception:
            pass
    match = re.search(r"\{[\s\S]*\}", stripped or content)
    if match:
        try:
            result = json.loads(match.group())
            if isinstance(result, dict):
                return result
        except Exception:
            pass
    return {}


def _parse_stream_footer(text: str) -> tuple[list[str], bool]:
    """Extract suggestions and guardrail flag from the plain-text stream footer."""
    suggestions: list[str] = []
    guardrail = False

    match = re.search(r'\[SUGESTÕES\]:\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
    if match:
        parts = match.group(1).split('|')
        suggestions = [p.strip()[:120] for p in parts if p.strip()][:3]

    if re.search(r'\[GUARDRAIL\]:\s*true', text, re.IGNORECASE):
        guardrail = True

    return suggestions, guardrail


def _strip_stream_footer(text: str) -> str:
    """Remove parse-only metadata markers from the visible answer.

    Only strips when the marker begins a new line — avoids cutting text when
    the model mentions a marker name inline before reaching the footer.
    """
    clean = text
    for marker in ("[SUGESTÕES]", "[ARTIFACTS]", "[GUARDRAIL]"):
        idx = clean.find('\n' + marker)
        if idx != -1:
            clean = clean[:idx]
        elif clean.startswith(marker):
            clean = ''
    return clean.rstrip()


def _normalize_conversation_artifacts(raw: object) -> list[dict]:
    """Keep only small known artifact payloads that the UI knows how to render."""
    if not isinstance(raw, list):
        return []

    allowed_templates = {"table", "comparison", "flow", "metric_grid", "price_chart", "bar_chart", "radar_chart"}
    artifacts: list[dict] = []
    for item in raw[:3]:
        if not isinstance(item, dict):
            continue
        template = item.get("template")
        if template not in allowed_templates:
            continue

        artifact: dict = {"template": template}
        for key in ("title", "eyebrow", "note", "chart_note"):
            value = item.get(key)
            if isinstance(value, str) and value.strip():
                artifact[key] = value.strip()[:250]

        if template in {"table", "comparison"}:
            columns = item.get("columns")
            rows = item.get("rows")
            if not isinstance(columns, list) or not isinstance(rows, list):
                continue
            clean_columns = [str(column).strip()[:48] for column in columns[:5] if str(column).strip()]
            clean_rows: list[list[str]] = []
            for row in rows[:8]:
                if not isinstance(row, list):
                    continue
                clean_row = [str(cell).strip()[:180] for cell in row[: len(clean_columns)]]
                if any(clean_row):
                    clean_rows.append(clean_row)
            if len(clean_columns) < 2 or not clean_rows:
                continue
            artifact["columns"] = clean_columns
            artifact["rows"] = clean_rows

        if template == "flow":
            steps = item.get("steps")
            if not isinstance(steps, list):
                continue
            clean_steps = [str(step).strip()[:100] for step in steps[:6] if str(step).strip()]
            if len(clean_steps) < 2:
                continue
            artifact["steps"] = clean_steps

        if template == "metric_grid":
            metrics = item.get("metrics")
            if not isinstance(metrics, list):
                continue
            clean_metrics: list[dict] = []
            for metric in metrics[:6]:
                if not isinstance(metric, dict):
                    continue
                label = str(metric.get("label", "")).strip()[:42]
                value = str(metric.get("value", "")).strip()[:64]
                detail = str(metric.get("detail", "")).strip()[:120]
                tone = metric.get("tone") if metric.get("tone") in {"positive", "negative", "neutral"} else "neutral"
                if label and value:
                    clean_metrics.append({"label": label, "value": value, "detail": detail, "tone": tone})
            if not clean_metrics:
                continue
            artifact["metrics"] = clean_metrics

        if template == "price_chart":
            range_val = item.get("range")
            if range_val in {"1d", "1mo", "3mo"}:
                artifact["range"] = range_val

        if template == "bar_chart":
            bars = item.get("bars")
            if not isinstance(bars, list):
                continue
            clean_bars: list[dict] = []
            for bar in bars[:8]:
                if not isinstance(bar, dict):
                    continue
                label = str(bar.get("label", "")).strip()[:32]
                value = bar.get("value")
                try:
                    val = float(value) if value is not None else 0.0
                except Exception:
                    val = 0.0
                if label:
                    clean_bars.append({"label": label, "value": val})
            if not clean_bars:
                continue
            artifact["bars"] = clean_bars

        if template == "radar_chart":
            radar_data = item.get("radarData")
            if not isinstance(radar_data, dict):
                continue
            clean_radar: dict[str, float] = {}
            for k, v in radar_data.items():
                try:
                    val = float(v) if v is not None else 0.0
                except Exception:
                    val = 0.0
                clean_radar[str(k).strip()[:24]] = val
            if not clean_radar:
                continue
            artifact["radarData"] = clean_radar

        artifacts.append(artifact)

    return artifacts


def _parse_stream_artifacts(text: str) -> list[dict]:
    """Extract JSON artifacts from the stream footer."""
    match = re.search(
        r"\[ARTIFACTS\]:\s*(.+?)(?=\n\[[A-ZÇÕ]+\]:|$)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return []
    try:
        raw_json = match.group(1).strip()
        # Clean markdown code blocks if the model wrapped the JSON in them
        raw_json = re.sub(r"^```(?:json)?\s*", "", raw_json)
        raw_json = re.sub(r"\s*```$", "", raw_json)
        return _normalize_conversation_artifacts(json.loads(raw_json.strip()))
    except Exception:
        return []


@router.post("/stream")
async def conversation_stream(request: ConversationRequest) -> StreamingResponse:
    """Stream a contextual conversation response token by token (SSE)."""
    import asyncio

    prompt = market_analysis_agent.build_streaming_conversation_prompt(
        subject=request.subject,
        context=request.context,
        analysis=request.analysis,
        history=request.history,
        question=request.question,
    )

    async def generate():
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        def run_stream() -> None:
            try:
                agent = market_analysis_agent.get_streaming_conversation_agent()
                for chunk in agent.run(prompt, stream=True, stream_events=True):
                    if getattr(chunk, 'event', None) == 'RunContent' and chunk.content:
                        loop.call_soon_threadsafe(queue.put_nowait, chunk.content)
            except Exception:
                pass
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        threading.Thread(target=run_stream, daemon=True).start()

        full_text = ''
        footer_started = False
        while True:
            delta = await queue.get()
            if delta is None:
                break
            full_text += delta
            if footer_started:
                # Footer in progress — accumulate silently, no more text events
                continue
            visible = _strip_stream_footer(full_text)
            # Detect when the footer begins (visible shorter than full text means a marker was found)
            just_entered_footer = any(
                ('\n' + m) in full_text or full_text.startswith(m)
                for m in ('[SUGESTÕES]', '[ARTIFACTS]', '[GUARDRAIL]')
            )
            if just_entered_footer:
                footer_started = True
                # Send final visible text then a loading signal so the frontend can show feedback
                yield f"data: {json.dumps({'type': 'text', 'text': visible})}\n\n"
                yield f"data: {json.dumps({'type': 'loading'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'text', 'text': visible})}\n\n"

        suggestions, guardrail = _parse_stream_footer(full_text)
        artifacts = _parse_stream_artifacts(full_text)
        # Clean answer (strip footer)
        clean = _strip_stream_footer(full_text)
        yield f"data: {json.dumps({'type': 'done', 'answer': clean, 'suggestions': suggestions, 'artifacts': artifacts, 'guardrail_triggered': guardrail})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("", response_model=ConversationResponse)
async def conversation(request: ConversationRequest) -> ConversationResponse:
    """Generate a contextual conversation response for a specific subject."""
    content = await market_analysis_agent.conversation_turn(
        subject=request.subject,
        context=request.context,
        analysis=request.analysis,
        history=request.history,
        question=request.question,
    )
    payload = _parse_conversation_payload(content)

    answer = payload.get("answer", "")
    if not answer:
        answer = "Não consegui gerar uma resposta. Tente novamente."

    suggestions = payload.get("suggestions", [])
    if isinstance(suggestions, list):
        suggestions = [str(s)[:120] for s in suggestions[:3] if s]
    else:
        suggestions = []

    artifacts = _normalize_conversation_artifacts(payload.get("artifacts", []))
    guardrail_triggered = bool(payload.get("guardrail_triggered", False))

    return ConversationResponse(
        answer=answer,
        suggestions=suggestions,
        artifacts=artifacts,
        guardrail_triggered=guardrail_triggered,
    )
