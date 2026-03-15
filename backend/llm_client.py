"""LLM client loader with a safe local fallback.

Prefers the real emergentintegrations package when available. Falls back to a
minimal shim that raises a clear error if used.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional


try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
except Exception as exc:  # pragma: no cover - used only when dependency missing
    _IMPORT_ERROR = exc

    @dataclass(frozen=True)
    class ImageContent:
        image_base64: str

    @dataclass(frozen=True)
    class UserMessage:
        text: str
        file_contents: Optional[List[ImageContent]] = None

    class LlmChat:
        def __init__(self, api_key: str, session_id: str, system_message: str) -> None:
            self._api_key = api_key
            self._session_id = session_id
            self._system_message = system_message
            self._provider: Optional[str] = None
            self._model: Optional[str] = None

        def with_model(self, provider: str, model: str) -> "LlmChat":
            new_chat = LlmChat(self._api_key, self._session_id, self._system_message)
            new_chat._provider = provider
            new_chat._model = model
            return new_chat

        async def send_message(self, message: UserMessage) -> str:
            raise RuntimeError(
                "emergentintegrations is not installed. Provide the official package "
                "or replace the LLM integration. Original error: "
                f"{_IMPORT_ERROR}"
            )
