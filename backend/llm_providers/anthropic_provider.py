from __future__ import annotations

import time
from typing import List

import anthropic

from .base import BaseLLMProvider, LLMMessage, LLMResponse


class AnthropicProvider(BaseLLMProvider):
    def __init__(self, api_key: str, config: dict | None = None) -> None:
        super().__init__(api_key, config)
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def complete(
        self,
        system_prompt: str,
        user_message: LLMMessage,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 4096
    ) -> LLMResponse:
        start = time.time()
        content: List[dict] = [{"type": "text", "text": user_message.text}]

        if user_message.images:
            for img_b64 in user_message.images:
                content.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": user_message.image_mime_type,
                            "data": img_b64,
                        },
                    }
                )

        response = await self.client.messages.create(
            model=model,
            system=system_prompt,
            messages=[{"role": "user", "content": content}],
            temperature=temperature,
            max_tokens=max_tokens,
        )

        latency = int((time.time() - start) * 1000)
        input_tokens = int(response.usage.input_tokens)
        output_tokens = int(response.usage.output_tokens)

        return LLMResponse(
            content=response.content[0].text,
            model=model,
            provider="anthropic",
            tokens_used={"input": input_tokens, "output": output_tokens},
            cost_usd=self.estimate_cost(model, input_tokens, output_tokens),
            latency_ms=latency,
        )

    def get_available_models(self) -> List[str]:
        return [
            "claude-sonnet-4-5-20250929",
            "claude-haiku-4-5-20251001",
        ]

    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        pricing = {
            "claude-sonnet-4-5-20250929": {"input": 3.0, "output": 15.0},
            "claude-haiku-4-5-20251001": {"input": 1.0, "output": 5.0},
        }
        price = pricing.get(model, pricing["claude-haiku-4-5-20251001"])
        return (input_tokens / 1_000_000) * price["input"] + (output_tokens / 1_000_000) * price["output"]
