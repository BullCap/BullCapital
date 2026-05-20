"""Chat/Agent interaction router."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Chat request model."""

    message: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    """Chat response model."""

    message: str
    conversation_id: str


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Process a chat message with the AI agent."""
    # TODO: Implement agent integration
    return ChatResponse(
        message=f"[Placeholder] Received: {request.message}",
        conversation_id=request.conversation_id or "new-conversation",
    )
