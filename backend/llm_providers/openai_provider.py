from __future__ import annotations

import time
from typing import List

from openai import AsyncOpenAI

from .base import BaseLLMProvider, LLMMessage, LLMResponse


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, config: dict | None = None) -> None:
        super().__init__(api_key, config)
        self.client = AsyncOpenAI(api_key=api_key)

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
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{user_message.image_mime_type};base64,{img_b64}"
                        },
                    }
                )

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )

        latency = int((time.time() - start) * 1000)
        input_tokens = int(response.usage.prompt_tokens)
        output_tokens = int(response.usage.completion_tokens)

        return LLMResponse(
            content=response.choices[0].message.content or "",
            model=model,
            provider="openai",
            tokens_used={"input": input_tokens, "output": output_tokens},
            cost_usd=self.estimate_cost(model, input_tokens, output_tokens),
            latency_ms=latency,
        )

    def get_available_models(self) -> List[str]:
        return ["gpt-4o", "gpt-4o-mini"]

    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        pricing = {
            "gpt-4o": {"input": 2.5, "output": 10.0},
            "gpt-4o-mini": {"input": 0.15, "output": 0.6},
        }
        price = pricing.get(model, pricing["gpt-4o-mini"])
        return (input_tokens / 1_000_000) * price["input"] + (output_tokens / 1_000_000) * price["output"]
