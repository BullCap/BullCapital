"""Investment analysis agent using Agno framework."""

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from app.agent.base import BaseAgent
from app.core.config import settings


class InvestmentAgent(BaseAgent):
    """Agent specialized in investment analysis."""

    def __init__(self):
        super().__init__(
            name="Investment Analyst",
            description="Analyzes stocks and provides investment insights",
        )
        self._agent: Agent | None = None

    def _get_agent(self) -> Agent:
        """Lazy initialization of the Agno agent."""
        if self._agent is None:
            self._agent = Agent(
                model=OpenAIChat(
                    id=settings.openai_model,
                    api_key=settings.openai_api_key,
                ),
                description=self.description,
                instructions=[
                    "You are a professional investment analyst.",
                    "Provide clear, factual analysis based on available data.",
                    "Always include risk disclaimers in your responses.",
                    "Focus on fundamental and technical analysis.",
                ],
                markdown=True,
            )
        return self._agent

    async def run(self, message: str, _context: dict | None = None) -> str:
        """Process an investment-related query."""
        if not settings.openai_api_key:
            return "[Agent not configured] OpenAI API key is required."

        agent = self._get_agent()
        response = agent.run(message)
        return response.content if response.content else "No response generated."

    async def get_tools(self) -> list[dict]:
        """Return available tools for investment analysis."""
        return [
            {"name": "analyze_stock", "description": "Analyze a stock ticker"},
            {"name": "get_market_data", "description": "Fetch market data"},
            {"name": "calculate_metrics", "description": "Calculate financial metrics"},
        ]


# Singleton instance
investment_agent = InvestmentAgent()
