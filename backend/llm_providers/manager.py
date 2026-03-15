from __future__ import annotations

import logging
import os
from typing import Dict, List, Optional, Tuple

from .base import BaseLLMProvider, LLMMessage, LLMResponse

logger = logging.getLogger(__name__)

MODEL_CLASS_MAP: Dict[str, Dict[str, str]] = {
    "premium": {
        "anthropic": "claude-sonnet-4-5-20250929",
        "openai": "gpt-4o",
        "gemini": "gemini-1.5-pro",
    },
    "standard": {
        "anthropic": "claude-haiku-4-5-20251001",
        "openai": "gpt-4o-mini",
        "gemini": "gemini-1.5-flash",
    },
    "budget": {
        "gemini": "gemini-1.5-flash",
        "openai": "gpt-4o-mini",
        "anthropic": "claude-haiku-4-5-20251001",
    },
}


class LLMProviderManager:
    def __init__(self, config: Dict[str, Dict[str, str]]) -> None:
        self.config = config
        self.providers: Dict[str, BaseLLMProvider] = {}
        self._init_providers()

    def _init_providers(self) -> None:
        if self.config.get("anthropic", {}).get("enabled"):
            from .anthropic_provider import AnthropicProvider

            api_key = self.config["anthropic"]["api_key"]
            self.providers["anthropic"] = AnthropicProvider(api_key)
            logger.info("Anthropic provider initialized")

        if self.config.get("openai", {}).get("enabled"):
            from .openai_provider import OpenAIProvider

            api_key = self.config["openai"]["api_key"]
            self.providers["openai"] = OpenAIProvider(api_key)
            logger.info("OpenAI provider initialized")

        if self.config.get("gemini", {}).get("enabled"):
            from .gemini_provider import GeminiProvider

            api_key = self.config["gemini"]["api_key"]
            self.providers["gemini"] = GeminiProvider(api_key)
            logger.info("Gemini provider initialized")

    def has_providers(self) -> bool:
        return bool(self.providers)

    def get_provider(self, name: str) -> Optional[BaseLLMProvider]:
        return self.providers.get(name)

    def resolve_provider_and_model(
        self,
        model_class: str,
        preferred_provider: Optional[str] = None
    ) -> Tuple[str, str]:
        model_map = MODEL_CLASS_MAP.get(model_class, MODEL_CLASS_MAP["standard"])
        if preferred_provider and preferred_provider in self.providers:
            model = model_map.get(preferred_provider)
            if model:
                return preferred_provider, model

        for provider_name in self.fallback_order():
            model = model_map.get(provider_name)
            if model and provider_name in self.providers:
                return provider_name, model

        provider = list(self.providers.keys())[0]
        model = model_map.get(provider, self.providers[provider].get_available_models()[0])
        return provider, model

    def fallback_order(self) -> List[str]:
        fallback = self.config.get("fallback_order", [])
        if fallback:
            return [item for item in fallback if item in self.providers]
        return list(self.providers.keys())

    async def complete(
        self,
        system_prompt: str,
        user_message: LLMMessage,
        model: str,
        provider: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 4096,
        enable_fallback: bool = True,
    ) -> LLMResponse:
        providers_to_try: List[str]
        if provider:
            providers_to_try = [provider]
            if enable_fallback:
                providers_to_try.extend([p for p in self.fallback_order() if p != provider])
        else:
            providers_to_try = self.fallback_order()

        last_error: Optional[Exception] = None
        for provider_name in providers_to_try:
            provider_obj = self.get_provider(provider_name)
            if not provider_obj:
                continue
            try:
                return await provider_obj.complete(
                    system_prompt,
                    user_message,
                    model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            except Exception as exc:
                last_error = exc
                logger.warning("Provider %s failed: %s", provider_name, exc)
                if not enable_fallback:
                    raise

        raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")


def build_manager_from_env() -> LLMProviderManager:
    config = {
        "anthropic": {
            "api_key": os.environ.get("ANTHROPIC_API_KEY", ""),
            "enabled": bool(os.environ.get("ANTHROPIC_API_KEY")),
        },
        "openai": {
            "api_key": os.environ.get("OPENAI_API_KEY", ""),
            "enabled": bool(os.environ.get("OPENAI_API_KEY")),
        },
        "gemini": {
            "api_key": os.environ.get("GOOGLE_API_KEY", ""),
            "enabled": bool(os.environ.get("GOOGLE_API_KEY")),
        },
        "default_provider": os.environ.get("DEFAULT_LLM_PROVIDER", "anthropic"),
        "fallback_order": os.environ.get(
            "LLM_FALLBACK_ORDER",
            "anthropic,openai,gemini",
        ).split(","),
    }
    return LLMProviderManager(config)
