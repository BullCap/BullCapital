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

    def get_streaming_conversation_agent(self) -> Agent:
        """Streaming conversation agent — outputs plain text with a parseable footer."""
        if not hasattr(self, '_stream_conv_agent') or self._stream_conv_agent is None:
            if settings.openrouter_api_key:
                model = OpenRouter(id=settings.openrouter_model, api_key=settings.openrouter_api_key)
            else:
                model = OpenAIChat(id=settings.openai_model, api_key=settings.openai_api_key)
            self._stream_conv_agent = Agent(
                model=model,
                description="Analista de mercado brasileiro que responde perguntas contextuais sobre ativos.",
                instructions=[
                    "Você NUNCA recomenda comprar, vender, manter ou alocar em qualquer ativo.",
                    "Você NUNCA afirma que um ativo vai subir ou cair.",
                    "Quando o usuário pedir recomendação direta, decline com gentileza e ofereça contexto factual.",
                    "Responda em português brasileiro simples — como um analista explicando para um amigo inteligente.",
                    "Evite jargão; se usar termo técnico, explique brevemente.",
                    "Frases curtas. Sem 'conforme', 'outrossim' ou formalidades desnecessárias.",
                    "Ancore a resposta ao ativo, evento ou contexto fornecido.",
                ],
                markdown=True,
            )
        return self._stream_conv_agent

    def build_streaming_conversation_prompt(
        self,
        subject: str,
        context: dict,
        analysis: dict,
        history: list[dict],
        question: str,
    ) -> str:
        """Build a streaming-friendly prompt that outputs plain text + parseable footer."""
        context_lines = []
        if "price" in context:
            context_lines.append(f"Preço: R$ {float(context['price']):.2f}")
        if "change" in context:
            context_lines.append(f"Variação: {float(context['change']):+.2f}%")
        if "radar" in context:
            scores = ", ".join(f"{k}: {v}/100" for k, v in context["radar"].items())
            context_lines.append(f"Scores: {scores}")
        context_str = "\n".join(context_lines) if context_lines else "Dados limitados."

        analysis_str = ""
        labels = {
            "o_que_aconteceu": "O que aconteceu",
            "por_que_importa": "Por que importa",
            "riscos_e_incertezas": "Riscos",
        }
        parts = [f"{label}: {analysis.get(key, '')[:250]}" for key, label in labels.items() if analysis.get(key)]
        if parts:
            analysis_str = "\n".join(parts)

        history_str = ""
        if history:
            turns = []
            for entry in history[-6:]:
                role = "Usuário" if entry.get("role") == "user" else "Você"
                turns.append(f"{role}: {entry.get('content', '')[:200]}")
            history_str = "\n".join(turns)

        analysis_block = f"Análise:\n{analysis_str}\n\n" if analysis_str else ""
        history_block = f"Histórico:\n{history_str}\n\n" if history_str else ""

        return (
            f"Contexto em análise: {subject}\n\n"
            f"Dados:\n{context_str}\n\n"
            f"{analysis_block}"
            f"{history_block}"
            f"Pergunta: {question}\n\n"
            f"Responda em markdown. Ao final, adicione EXATAMENTE esta linha com 2-3 perguntas de follow-up:\n"
            f"[SUGESTÕES]: Pergunta 1? | Pergunta 2? | Pergunta 3?\n"
            f"Se recusar recomendação de investimento, adicione também: [GUARDRAIL]: true"
        )

    def _get_conversation_agent(self) -> Agent:
        """Lazy initialization of a dedicated conversation agent with strict guardrails."""
        if not hasattr(self, "_conv_agent") or self._conv_agent is None:
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
            self._conv_agent = Agent(
                model=model,
                description="Analista de mercado brasileiro que responde perguntas contextuais sobre ativos.",
                instructions=[
                    "Você NUNCA recomenda comprar, vender, manter ou alocar em qualquer ativo.",
                    "Você NUNCA afirma que um ativo vai subir ou cair.",
                    "Você NUNCA avalia adequação do investimento ao perfil do usuário.",
                    "Quando o usuário pedir recomendação direta (comprar, vender, alocar), decline com gentileza e ofereça contexto factual em vez disso.",
                    "Você SEMPRE responde em português brasileiro simples e direto — como um analista explicando para um amigo inteligente, não para um especialista.",
                    "Evite jargão técnico quando houver uma forma mais clara de dizer. Se usar um termo técnico, explique brevemente.",
                    "Prefira frases curtas. Nunca use 'conforme', 'outrossim', 'nesse contexto' ou formalidades desnecessárias.",
                    "Você SEMPRE ancora a resposta ao ativo, evento ou contexto fornecido no prompt.",
                    "Perguntas fora do escopo devem ser redirecionadas para o contexto fornecido.",
                    "Inclua 2-3 sugestões de follow-up relevantes ao que acabou de responder.",
                    "Responda APENAS com JSON válido no formato especificado.",
                ],
                markdown=False,
            )
        return self._conv_agent

    async def conversation_turn(
        self,
        subject: str,
        context: dict,
        analysis: dict,
        history: list[dict],
        question: str,
    ) -> str:
        """Generate a contextual conversation response anchored to an asset."""
        if not settings.openrouter_api_key and not settings.openai_api_key:
            return '{"answer": "Serviço de IA não configurado.", "suggestions": [], "guardrail_triggered": false}'

        import asyncio
        context_lines = []
        if "price" in context:
            context_lines.append(f"Preço: R$ {float(context['price']):.2f}")
        if "change" in context:
            context_lines.append(f"Variação: {float(context['change']):+.2f}%")
        if "radar" in context:
            scores = ", ".join(f"{k}: {v}/100" for k, v in context["radar"].items())
            context_lines.append(f"Scores: {scores}")
        context_str = "\n".join(context_lines) if context_lines else "Dados limitados."

        analysis_str = ""
        if analysis:
            parts = []
            labels = {
                "o_que_aconteceu": "O que aconteceu",
                "por_que_importa": "Por que importa",
                "impacto_potencial": "Impacto potencial",
                "o_que_acompanhar": "O que acompanhar",
                "riscos_e_incertezas": "Riscos e incertezas",
            }
            for key, label in labels.items():
                text = analysis.get(key, "")
                if text:
                    parts.append(f"{label}: {text[:300]}")
            analysis_str = "\n".join(parts)

        history_str = ""
        if history:
            turns = []
            for entry in history[-6:]:
                role = "Usuário" if entry.get("role") == "user" else "Assistente"
                turns.append(f"{role}: {entry.get('content', '')[:200]}")
            history_str = "\n".join(turns)

        schema = (
            'Responda APENAS com JSON válido:\n'
            '{"answer": "resposta em markdown pt-BR", '
            '"suggestions": ["pergunta 1?", "pergunta 2?", "pergunta 3?"], '
            '"guardrail_triggered": false}\n\n'
            'Regras:\n'
            '- answer: markdown, português, sem recomendação de compra/venda/alocação\n'
            '- suggestions: 2-3 perguntas de follow-up, máx 60 chars cada, em português\n'
            '- guardrail_triggered: true se o usuário pediu recomendação direta e você recusou\n'
            '- Se a pergunta for fora do escopo, redirecione para o contexto fornecido'
        )

        analysis_block = f"Análise gerada:\n{analysis_str}\n\n" if analysis_str else ""
        history_block = f"Histórico da conversa:\n{history_str}\n\n" if history_str else ""

        prompt = (
            f"Contexto em análise: {subject}\n\n"
            f"Dados de mercado:\n{context_str}\n\n"
            f"{analysis_block}"
            f"{history_block}"
            f"Pergunta atual: {question}\n\n"
            f"{schema}"
        )

        agent = self._get_conversation_agent()
        response = await asyncio.to_thread(agent.run, prompt)
        return response.content if response.content else '{"answer": "Sem resposta.", "suggestions": [], "guardrail_triggered": false}'

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
