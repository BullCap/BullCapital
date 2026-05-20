"""Base agent class and utilities."""

from abc import ABC, abstractmethod


class BaseAgent(ABC):
    """Abstract base class for all AI agents."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    async def run(self, message: str, context: dict | None = None) -> str:  # noqa: ARG002
        """Process a message and return a response."""
        pass

    @abstractmethod
    async def get_tools(self) -> list[dict]:
        """Return list of available tools for this agent."""
        pass
