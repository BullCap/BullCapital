"""Conversation router for contextual follow-up questions anchored to an asset."""

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
        suggestions = [p.strip()[:60] for p in parts if p.strip()][:3]

    if re.search(r'\[GUARDRAIL\]:\s*true', text, re.IGNORECASE):
        guardrail = True

    return suggestions, guardrail


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
        while True:
            delta = await queue.get()
            if delta is None:
                break
            full_text += delta
            # Stop streaming once footer marker detected — don't show it to the user
            visible = full_text.split('[SUGESTÕES]')[0].split('[GUARDRAIL]')[0]
            yield f"data: {json.dumps({'type': 'text', 'text': visible})}\n\n"

        suggestions, guardrail = _parse_stream_footer(full_text)
        # Clean answer (strip footer)
        clean = full_text.split('[SUGESTÕES]')[0].split('[GUARDRAIL]')[0].rstrip()
        yield f"data: {json.dumps({'type': 'done', 'answer': clean, 'suggestions': suggestions, 'guardrail_triggered': guardrail})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("", response_model=ConversationResponse)
async def conversation(request: ConversationRequest) -> ConversationResponse:
    """Generate a contextual conversation response for a specific asset."""
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
        suggestions = [str(s)[:60] for s in suggestions[:3] if s]
    else:
        suggestions = []

    guardrail_triggered = bool(payload.get("guardrail_triggered", False))

    return ConversationResponse(
        answer=answer,
        suggestions=suggestions,
        guardrail_triggered=guardrail_triggered,
    )
