from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Dict


@dataclass(frozen=True)
class LLMMessage:
    text: str
    images: Optional[List[str]] = None
    image_mime_type: str = "image/jpeg"


@dataclass(frozen=True)
class LLMResponse:
    content: str
    model: str
    provider: str
    tokens_used: Dict[str, int]
    cost_usd: float
    latency_ms: int


class BaseLLMProvider:
    def __init__(self, api_key: str, config: Optional[Dict[str, str]] = None) -> None:
        self.api_key = api_key
        self.config = config or {}

    async def complete(
        self,
        system_prompt: str,
        user_message: LLMMessage,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 4096
    ) -> LLMResponse:
        raise NotImplementedError

    def get_available_models(self) -> List[str]:
        raise NotImplementedError

    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        raise NotImplementedError
