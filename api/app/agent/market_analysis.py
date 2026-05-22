"""Contextual market analysis agent using Agno framework."""

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.models.openrouter import OpenRouter

from app.agent.base import BaseAgent
from app.core.config import settings


class MarketAnalysisAgent(BaseAgent):
    """Agent specialized in contextual market intelligence."""

    def __init__(self):
        super().__init__(
            name="Market Intelligence Analyst",
            description="Explains Brazilian market signals without giving recommendations",
        )
        self._agent: Agent | None = None

    def _get_agent(self) -> Agent:
        """Lazy initialization of the Agno agent."""
        if self._agent is None:
            if settings.openrouter_api_key:
                model = OpenRouter(
                    id=settings.openrouter_model,
                    api_key=settings.openrouter_api_key,
                )
            else:
                model = OpenAIChat(
                    id=settings.openai_model,
                    api_key=settings.openai_api_key,
                )
            self._agent = Agent(
                model=model,
                description=self.description,
                instructions=[
                    "You explain market signals for Brazilian assets, macro indicators, and trends.",
                    "Anchor every response to the provided asset, event, trend, or indicator context.",
                    "Use the sections: O que aconteceu, Por que importa, Impacto potencial, O que acompanhar, Riscos e incertezas.",
                    "Do not provide buy, sell, hold, suitability, or portfolio recommendations.",
                    "Write in clear Brazilian Portuguese.",
                ],
                markdown=True,
            )
        return self._agent

    async def run(self, message: str, _context: dict | None = None) -> str:
        """Generate contextual market analysis."""
        if not settings.openrouter_api_key and not settings.openai_api_key:
            return "[Agent not configured] OpenRouter or OpenAI API key is required."

        import asyncio

        agent = self._get_agent()
        response = await asyncio.to_thread(agent.run, message)
        return response.content if response.content else "No response generated."

    async def get_tools(self) -> list[dict]:
        """Return available tools for contextual market analysis."""
        return [
            {"name": "analyze_market_signal", "description": "Explain a market signal"},
            {"name": "get_market_data", "description": "Fetch market data"},
            {"name": "summarize_risks", "description": "Summarize risks and uncertainties"},
        ]


# Singleton instance
market_analysis_agent = MarketAnalysisAgent()
