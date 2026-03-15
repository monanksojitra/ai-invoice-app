from __future__ import annotations

import base64
import time
from typing import List

import google.generativeai as genai

from .base import BaseLLMProvider, LLMMessage, LLMResponse


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, config: dict | None = None) -> None:
        super().__init__(api_key, config)
        genai.configure(api_key=api_key)

    async def complete(
        self,
        system_prompt: str,
        user_message: LLMMessage,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 4096
    ) -> LLMResponse:
        start = time.time()
        prompt = f"{system_prompt}\n\n{user_message.text}"
        parts: List[object] = [prompt]

        if user_message.images:
            for img_b64 in user_message.images:
                parts.append(
                    {
                        "mime_type": user_message.image_mime_type,
                        "data": base64.b64decode(img_b64),
                    }
                )

        model_obj = genai.GenerativeModel(model)
        response = await model_obj.generate_content_async(
            parts,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens,
            },
        )

        latency = int((time.time() - start) * 1000)
        input_tokens = max(len(prompt) // 4, 1)
        output_tokens = max(len(response.text or "") // 4, 1)

        return LLMResponse(
            content=response.text or "",
            model=model,
            provider="gemini",
            tokens_used={"input": input_tokens, "output": output_tokens},
            cost_usd=self.estimate_cost(model, input_tokens, output_tokens),
            latency_ms=latency,
        )

    def get_available_models(self) -> List[str]:
        return ["gemini-1.5-pro", "gemini-1.5-flash"]

    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        pricing = {
            "gemini-1.5-pro": {"input": 1.25, "output": 5.0},
            "gemini-1.5-flash": {"input": 0.075, "output": 0.3},
        }
        price = pricing.get(model, pricing["gemini-1.5-flash"])
        return (input_tokens / 1_000_000) * price["input"] + (output_tokens / 1_000_000) * price["output"]
