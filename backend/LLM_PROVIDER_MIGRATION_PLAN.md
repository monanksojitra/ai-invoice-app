# Multi-LLM Provider Migration Plan

## Executive Summary

**Current State:** The InvoiceAI backend is tightly coupled to the `emergentintegrations` package (v0.1.0) for LLM access, using a single API key (EMERGENT_LLM_KEY) for all AI operations.

**Goal:** Migrate to a flexible multi-provider architecture supporting OpenAI, Anthropic, Google Gemini, and Azure OpenAI for better pricing, redundancy, and feature access.

**Impact:** Backend-only changes. No frontend modifications required.

---

## 1. Current Architecture Analysis

### 1.1 EMERGENT Usage Points

| File | Lines | Usage | Criticality |
|------|-------|-------|-------------|
| `llm_client.py` | 14 | Import from emergentintegrations | HIGH |
| `server.py` | 41-42, 252-254, 446 | Get API key, validation | HIGH |
| `services/batch_processor.py` | 25-26, 94-96 | Get API key, validation | HIGH |
| `requirements.txt` | 33 | Package dependency | HIGH |
| `.env` | 4 | Environment variable | HIGH |

### 1.2 LLM Call Patterns

**Pattern 1: Real-time Extraction (server.py)**
```python
chat = LlmChat(api_key, session_id, system_message)
    .with_model("anthropic", "claude-sonnet-4-5-20250929")
response = await chat.send_message(UserMessage(...))
```

**Pattern 2: Batch Processing (batch_processor.py)**
```python
chat = LlmChat(api_key, session_id, system_message)
    .with_model("anthropic", model)  # HAIKU or SONNET
response = await chat.send_message(UserMessage(...))
```

### 1.3 Models Currently Used

- **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`) - Premium users, low-quality images
- **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) - Standard users, batch processing

### 1.4 Dependencies

**Hard Dependencies:**
- `emergentintegrations==0.1.0` - Proprietary LLM client wrapper
- All invoice extraction logic depends on this

**Soft Dependencies:**
- Model router logic (model_router.py) - Provider-agnostic
- Batch queue system - Provider-agnostic
- Image preprocessing - Provider-agnostic

---

## 2. Target Architecture

### 2.1 Provider Options

| Provider | Models | Cost (Input/Output per 1M tokens) | Vision Support | Batch API |
|----------|--------|----------------------------------|----------------|-----------|
| **Anthropic** | Claude 4.5 Sonnet, Haiku | $3/$15, $1/$5 | ✅ | ✅ |
| **OpenAI** | GPT-4o, GPT-4o-mini | $2.5/$10, $0.15/$0.6 | ✅ | ✅ |
| **Google Gemini** | Gemini 1.5 Pro, Flash | $1.25/$5, $0.075/$0.3 | ✅ | ❌ |
| **Azure OpenAI** | GPT-4o (enterprise) | Custom pricing | ✅ | ✅ |

### 2.2 Recommended Provider Strategy

**Tier 1 (Primary): Anthropic Claude**
- Proven accuracy for structured extraction
- Best for Indian invoices (multi-language support)
- Existing model routing logic compatible
- Use: Premium users, complex invoices

**Tier 2 (Cost-Optimized): OpenAI GPT-4o-mini**
- 5x cheaper than Claude Haiku
- Good vision + structured output
- Use: Free/Starter users, simple invoices

**Tier 3 (Ultra-Cheap): Google Gemini Flash**
- 13x cheaper than Claude Haiku
- Fast response times
- Use: Batch processing, high-volume scenarios

**Fallback: Azure OpenAI**
- Enterprise reliability
- Dedicated capacity
- Use: When public APIs have rate limits

### 2.3 New Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                      LLM Provider Manager                    │
│  - Provider registry (Anthropic, OpenAI, Gemini, Azure)    │
│  - Auto-fallback on provider failures                       │
│  - Cost tracking per provider                               │
│  - Rate limit management                                    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌────────────────┬────────────────┬────────────────┬──────────┐
│   Anthropic    │     OpenAI     │  Google Gemini │  Azure   │
│   Provider     │    Provider    │    Provider    │ Provider │
└────────────────┴────────────────┴────────────────┴──────────┘
                            ▼
                  ┌──────────────────┐
                  │  Unified Response│
                  │     Format       │
                  └──────────────────┘
```

---

## 3. Implementation Plan

### Phase 1: Multi-Provider Foundation (Week 1)

**Goal:** Create provider abstraction layer without breaking existing functionality.

#### 3.1.1 Create Base Provider Interface

**New File:** `backend/llm_providers/base.py`

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class LLMMessage:
    text: str
    images: Optional[List[str]] = None  # base64 encoded

@dataclass
class LLMResponse:
    content: str
    model: str
    provider: str
    tokens_used: dict  # {input: X, output: Y}
    cost_usd: float
    latency_ms: int

class BaseLLMProvider(ABC):
    def __init__(self, api_key: str, config: dict = None):
        self.api_key = api_key
        self.config = config or {}
    
    @abstractmethod
    async def complete(
        self,
        system_prompt: str,
        user_message: LLMMessage,
        model: str,
        temperature: float = 0.0,
        max_tokens: int = 4096
    ) -> LLMResponse:
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        pass
    
    @abstractmethod
    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        pass
```

#### 3.1.2 Implement Provider Adapters

**New File:** `backend/llm_providers/anthropic_provider.py`

```python
import anthropic
from .base import BaseLLMProvider, LLMMessage, LLMResponse
import time

class AnthropicProvider(BaseLLMProvider):
    def __init__(self, api_key: str, config: dict = None):
        super().__init__(api_key, config)
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
    
    async def complete(self, system_prompt, user_message, model, temperature=0.0, max_tokens=4096):
        start = time.time()
        
        # Build content list
        content = [{"type": "text", "text": user_message.text}]
        if user_message.images:
            for img_b64 in user_message.images:
                content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": img_b64
                    }
                })
        
        response = await self.client.messages.create(
            model=model,
            system=system_prompt,
            messages=[{"role": "user", "content": content}],
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        latency = int((time.time() - start) * 1000)
        
        return LLMResponse(
            content=response.content[0].text,
            model=model,
            provider="anthropic",
            tokens_used={
                "input": response.usage.input_tokens,
                "output": response.usage.output_tokens
            },
            cost_usd=self.estimate_cost(
                model,
                response.usage.input_tokens,
                response.usage.output_tokens
            ),
            latency_ms=latency
        )
    
    def get_available_models(self):
        return [
            "claude-sonnet-4-5-20250929",
            "claude-haiku-4-5-20251001",
            "claude-3-5-sonnet-20241022"
        ]
    
    def estimate_cost(self, model, input_tokens, output_tokens):
        pricing = {
            "claude-sonnet-4-5-20250929": {"input": 3.0, "output": 15.0},
            "claude-haiku-4-5-20251001": {"input": 1.0, "output": 5.0},
        }
        p = pricing.get(model, pricing["claude-haiku-4-5-20251001"])
        return (input_tokens / 1_000_000) * p["input"] + (output_tokens / 1_000_000) * p["output"]
```

**New File:** `backend/llm_providers/openai_provider.py`

```python
import openai
from .base import BaseLLMProvider, LLMMessage, LLMResponse
import time

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, config: dict = None):
        super().__init__(api_key, config)
        self.client = openai.AsyncOpenAI(api_key=api_key)
    
    async def complete(self, system_prompt, user_message, model, temperature=0.0, max_tokens=4096):
        start = time.time()
        
        # Build messages
        content = [{"type": "text", "text": user_message.text}]
        if user_message.images:
            for img_b64 in user_message.images:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}
                })
        
        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        latency = int((time.time() - start) * 1000)
        
        return LLMResponse(
            content=response.choices[0].message.content,
            model=model,
            provider="openai",
            tokens_used={
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens
            },
            cost_usd=self.estimate_cost(
                model,
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ),
            latency_ms=latency
        )
    
    def get_available_models(self):
        return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]
    
    def estimate_cost(self, model, input_tokens, output_tokens):
        pricing = {
            "gpt-4o": {"input": 2.5, "output": 10.0},
            "gpt-4o-mini": {"input": 0.15, "output": 0.6},
        }
        p = pricing.get(model, pricing["gpt-4o-mini"])
        return (input_tokens / 1_000_000) * p["input"] + (output_tokens / 1_000_000) * p["output"]
```

**New File:** `backend/llm_providers/gemini_provider.py`

```python
import google.generativeai as genai
from .base import BaseLLMProvider, LLMMessage, LLMResponse
import time
import base64

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, config: dict = None):
        super().__init__(api_key, config)
        genai.configure(api_key=api_key)
    
    async def complete(self, system_prompt, user_message, model, temperature=0.0, max_tokens=4096):
        start = time.time()
        
        # Gemini handles system prompt differently
        full_prompt = f"{system_prompt}\n\n{user_message.text}"
        
        # Build content
        parts = [full_prompt]
        if user_message.images:
            for img_b64 in user_message.images:
                img_bytes = base64.b64decode(img_b64)
                parts.append({"mime_type": "image/jpeg", "data": img_bytes})
        
        model_obj = genai.GenerativeModel(model)
        response = await model_obj.generate_content_async(
            parts,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": max_tokens,
            }
        )
        
        latency = int((time.time() - start) * 1000)
        
        # Gemini doesn't provide token counts in free tier
        # Estimate: ~1 token = 4 characters
        input_tokens = len(full_prompt) // 4
        output_tokens = len(response.text) // 4
        
        return LLMResponse(
            content=response.text,
            model=model,
            provider="gemini",
            tokens_used={"input": input_tokens, "output": output_tokens},
            cost_usd=self.estimate_cost(model, input_tokens, output_tokens),
            latency_ms=latency
        )
    
    def get_available_models(self):
        return ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"]
    
    def estimate_cost(self, model, input_tokens, output_tokens):
        pricing = {
            "gemini-1.5-pro": {"input": 1.25, "output": 5.0},
            "gemini-1.5-flash": {"input": 0.075, "output": 0.3},
        }
        p = pricing.get(model, pricing["gemini-1.5-flash"])
        return (input_tokens / 1_000_000) * p["input"] + (output_tokens / 1_000_000) * p["output"]
```

#### 3.1.3 Create Provider Manager

**New File:** `backend/llm_providers/manager.py`

```python
from typing import Optional, List
import logging
from .base import BaseLLMProvider, LLMMessage, LLMResponse
from .anthropic_provider import AnthropicProvider
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider

logger = logging.getLogger(__name__)

class LLMProviderManager:
    def __init__(self, config: dict):
        """
        config = {
            "anthropic": {"api_key": "sk-...", "enabled": True},
            "openai": {"api_key": "sk-...", "enabled": True},
            "gemini": {"api_key": "...", "enabled": True},
            "default_provider": "anthropic",
            "fallback_order": ["anthropic", "openai", "gemini"]
        }
        """
        self.config = config
        self.providers = {}
        self._init_providers()
    
    def _init_providers(self):
        """Initialize enabled providers"""
        if self.config.get("anthropic", {}).get("enabled"):
            api_key = self.config["anthropic"]["api_key"]
            self.providers["anthropic"] = AnthropicProvider(api_key)
            logger.info("✅ Anthropic provider initialized")
        
        if self.config.get("openai", {}).get("enabled"):
            api_key = self.config["openai"]["api_key"]
            self.providers["openai"] = OpenAIProvider(api_key)
            logger.info("✅ OpenAI provider initialized")
        
        if self.config.get("gemini", {}).get("enabled"):
            api_key = self.config["gemini"]["api_key"]
            self.providers["gemini"] = GeminiProvider(api_key)
            logger.info("✅ Gemini provider initialized")
    
    def get_provider(self, name: str) -> Optional[BaseLLMProvider]:
        """Get provider by name"""
        return self.providers.get(name)
    
    async def complete(
        self,
        system_prompt: str,
        user_message: LLMMessage,
        model: str,
        provider: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 4096,
        enable_fallback: bool = True
    ) -> LLMResponse:
        """
        Send completion request with automatic fallback.
        
        Args:
            provider: Specific provider to use, or None for default
            enable_fallback: If True, try fallback providers on failure
        """
        # Determine provider order
        if provider:
            providers_to_try = [provider]
            if enable_fallback:
                fallback = self.config.get("fallback_order", [])
                providers_to_try.extend([p for p in fallback if p != provider])
        else:
            providers_to_try = self.config.get("fallback_order", list(self.providers.keys()))
        
        last_error = None
        for provider_name in providers_to_try:
            provider_obj = self.get_provider(provider_name)
            if not provider_obj:
                logger.warning(f"Provider {provider_name} not available, skipping")
                continue
            
            try:
                logger.info(f"🚀 Trying provider: {provider_name} with model: {model}")
                response = await provider_obj.complete(
                    system_prompt, user_message, model, temperature, max_tokens
                )
                logger.info(
                    f"✅ {provider_name} succeeded: "
                    f"{response.tokens_used['input']}→{response.tokens_used['output']} tokens, "
                    f"${response.cost_usd:.4f}, {response.latency_ms}ms"
                )
                return response
            
            except Exception as e:
                last_error = e
                logger.error(f"❌ {provider_name} failed: {str(e)}")
                if not enable_fallback:
                    raise
                continue
        
        # All providers failed
        raise RuntimeError(
            f"All LLM providers failed. Last error: {last_error}"
        )
    
    def get_cheapest_provider_for_model_class(self, model_class: str) -> tuple:
        """
        Return (provider_name, model_name) for cheapest option.
        model_class: "premium", "standard", "budget"
        """
        if model_class == "premium":
            # Best accuracy
            if "anthropic" in self.providers:
                return ("anthropic", "claude-sonnet-4-5-20250929")
            elif "openai" in self.providers:
                return ("openai", "gpt-4o")
        
        elif model_class == "standard":
            # Balanced cost/quality
            if "anthropic" in self.providers:
                return ("anthropic", "claude-haiku-4-5-20251001")
            elif "openai" in self.providers:
                return ("openai", "gpt-4o-mini")
            elif "gemini" in self.providers:
                return ("gemini", "gemini-1.5-pro")
        
        elif model_class == "budget":
            # Cheapest possible
            if "gemini" in self.providers:
                return ("gemini", "gemini-1.5-flash")
            elif "openai" in self.providers:
                return ("openai", "gpt-4o-mini")
            elif "anthropic" in self.providers:
                return ("anthropic", "claude-haiku-4-5-20251001")
        
        # Fallback
        provider = list(self.providers.keys())[0]
        model = self.providers[provider].get_available_models()[0]
        return (provider, model)
```

---

### Phase 2: Update Extraction Logic (Week 1-2)

#### 3.2.1 Modify server.py

```python
# Replace:
def _get_emergent_key() -> str:
    return os.environ.get("EMERGENT_LLM_KEY", "")

# With:
def _init_llm_manager():
    """Initialize LLM provider manager from environment variables"""
    from llm_providers.manager import LLMProviderManager
    
    config = {
        "anthropic": {
            "api_key": os.environ.get("ANTHROPIC_API_KEY", ""),
            "enabled": bool(os.environ.get("ANTHROPIC_API_KEY"))
        },
        "openai": {
            "api_key": os.environ.get("OPENAI_API_KEY", ""),
            "enabled": bool(os.environ.get("OPENAI_API_KEY"))
        },
        "gemini": {
            "api_key": os.environ.get("GOOGLE_API_KEY", ""),
            "enabled": bool(os.environ.get("GOOGLE_API_KEY"))
        },
        "default_provider": os.environ.get("DEFAULT_LLM_PROVIDER", "anthropic"),
        "fallback_order": os.environ.get(
            "LLM_FALLBACK_ORDER",
            "anthropic,openai,gemini"
        ).split(",")
    }
    
    return LLMProviderManager(config)

# Global instance
llm_manager = _init_llm_manager()
```

#### 3.2.2 Update extract_invoice_from_image()

```python
# Replace entire function
async def extract_invoice_from_image(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """Run AI extraction pipeline on invoice image."""
    try:
        from llm_providers.base import LLMMessage
        
        # Build message
        message = LLMMessage(
            text="Extract all invoice data from this image and return the JSON as specified.",
            images=[image_base64]
        )
        
        # Get model based on user plan (add plan parameter)
        # For now, use premium model
        provider, model = llm_manager.get_cheapest_provider_for_model_class("premium")
        
        # Send request with fallback
        response = await llm_manager.complete(
            system_prompt=EXTRACTION_SYSTEM_PROMPT,
            user_message=message,
            model=model,
            provider=provider,
            enable_fallback=True
        )
        
        # Parse response
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        
        extracted = json.loads(text)
        
        # Log cost
        logger.info(
            f"💰 Extraction cost: ${response.cost_usd:.4f} "
            f"(₹{response.cost_usd * 83.5:.2f}) via {response.provider}/{response.model}"
        )
        
        if "error" in extracted:
            return {"error": extracted["error"]}
        return extracted
    
    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

#### 3.2.3 Update batch_processor.py

Similar changes to use LLMProviderManager instead of direct emergentintegrations.

---

### Phase 3: Update Model Router (Week 2)

#### 3.3.1 Enhance model_router.py

```python
# Add provider-aware routing
def select_provider_and_model(
    quality_score: float,
    user_plan: str,
    is_multipage: bool = False,
    page_count: int = 1,
    available_providers: List[str] = None
) -> tuple:
    """
    Select optimal provider + model combination.
    Returns: (provider, model, reason)
    """
    # Premium plans → Anthropic Sonnet (best accuracy)
    if user_plan in PREMIUM_PLANS:
        if "anthropic" in available_providers:
            return ("anthropic", "claude-sonnet-4-5-20250929", "premium_plan")
        elif "openai" in available_providers:
            return ("openai", "gpt-4o", "premium_plan_fallback")
    
    # Low quality → Premium model
    if quality_score < QUALITY_THRESHOLD:
        if "anthropic" in available_providers:
            return ("anthropic", "claude-sonnet-4-5-20250929", f"low_quality_{quality_score:.2f}")
        elif "openai" in available_providers:
            return ("openai", "gpt-4o", f"low_quality_{quality_score:.2f}")
    
    # Complex multipage → Premium model
    if is_multipage and page_count > 3:
        if "anthropic" in available_providers:
            return ("anthropic", "claude-sonnet-4-5-20250929", f"multipage_{page_count}")
        elif "openai" in available_providers:
            return ("openai", "gpt-4o", f"multipage_{page_count}")
    
    # Standard extraction → Cheapest option
    # Prefer: Gemini Flash > OpenAI Mini > Anthropic Haiku
    if "gemini" in available_providers:
        return ("gemini", "gemini-1.5-flash", "budget_optimization")
    elif "openai" in available_providers:
        return ("openai", "gpt-4o-mini", "standard_extraction")
    elif "anthropic" in available_providers:
        return ("anthropic", "claude-haiku-4-5-20251001", "standard_extraction")
    
    # Fallback
    provider = available_providers[0]
    return (provider, "default", "fallback")
```

---

### Phase 4: Environment Configuration (Week 2)

#### 3.4.1 Update .env

```bash
# Old (remove):
# EMERGENT_LLM_KEY="your_emergent_llm_key_here"

# New (add all providers):
# Anthropic (Primary)
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_ENABLED=true

# OpenAI (Secondary/Cost-optimized)
OPENAI_API_KEY="sk-..."
OPENAI_ENABLED=true

# Google Gemini (Budget tier)
GOOGLE_API_KEY="AIza..."
GEMINI_ENABLED=true

# Azure OpenAI (Enterprise fallback - optional)
AZURE_OPENAI_API_KEY=""
AZURE_OPENAI_ENDPOINT=""
AZURE_OPENAI_ENABLED=false

# Provider Configuration
DEFAULT_LLM_PROVIDER="anthropic"
LLM_FALLBACK_ORDER="anthropic,openai,gemini"

# Feature Flags
ENABLE_LLM_FALLBACK=true
ENABLE_COST_TRACKING=true
```

#### 3.4.2 Update requirements.txt

```txt
# Remove:
# emergentintegrations==0.1.0

# Add:
anthropic>=0.40.0
openai>=1.60.0
google-generativeai>=0.8.3
azure-openai>=1.0.0  # Optional
```

---

### Phase 5: Database Schema Updates (Week 2)

#### 3.5.1 Add LLM Tracking Collection

```python
# New collection: llm_usage_logs
{
    "user_id": "uuid",
    "invoice_id": "uuid",
    "provider": "anthropic",
    "model": "claude-sonnet-4-5",
    "input_tokens": 1234,
    "output_tokens": 567,
    "cost_usd": 0.0234,
    "cost_inr": 1.95,
    "latency_ms": 1234,
    "success": true,
    "error": null,
    "timestamp": "2026-03-15T10:30:00Z"
}
```

#### 3.5.2 Add User Preferences

```python
# Update users collection:
{
    ...
    "llm_preferences": {
        "preferred_provider": "anthropic",  # or "auto"
        "enable_fallback": true,
        "budget_limit_monthly_inr": 500.0
    }
}
```

---

### Phase 6: Testing & Rollout (Week 3)

#### 3.6.1 Unit Tests

```python
# tests/test_llm_providers.py
async def test_anthropic_provider():
    provider = AnthropicProvider(api_key="test-key")
    message = LLMMessage(text="Test", images=[])
    # Mock response
    ...

async def test_provider_fallback():
    # Simulate Anthropic failure → OpenAI success
    ...

async def test_cost_tracking():
    # Verify cost calculations match expected values
    ...
```

#### 3.6.2 Integration Tests

```python
# tests/test_extraction_pipeline.py
async def test_extract_invoice_all_providers():
    # Test with real invoice image on all providers
    # Verify JSON output consistency
    ...

async def test_batch_processing_with_gemini():
    # Test batch queue with Gemini Flash
    ...
```

#### 3.6.3 Rollout Strategy

1. **Week 1-2:** Implement provider abstraction (no breaking changes)
2. **Week 2:** Deploy to staging, test with all providers
3. **Week 3:** 
   - Day 1-2: Deploy to 10% of production traffic (canary)
   - Day 3-4: Monitor metrics (success rate, latency, cost)
   - Day 5-7: Roll out to 100% if metrics stable

---

## 4. Migration Checklist

### Pre-Migration
- [ ] Obtain API keys for all providers (Anthropic, OpenAI, Gemini)
- [ ] Test each provider with sample invoices
- [ ] Benchmark accuracy across providers
- [ ] Set up cost monitoring dashboard

### Development
- [ ] Create provider abstraction layer
- [ ] Implement Anthropic provider
- [ ] Implement OpenAI provider
- [ ] Implement Gemini provider
- [ ] Create provider manager with fallback
- [ ] Update server.py extraction logic
- [ ] Update batch_processor.py
- [ ] Update model_router.py
- [ ] Add LLM usage logging to database
- [ ] Write unit tests
- [ ] Write integration tests

### Deployment
- [ ] Update .env with all API keys
- [ ] Update requirements.txt
- [ ] Run database migration for llm_usage_logs
- [ ] Deploy to staging
- [ ] Test all endpoints with different providers
- [ ] Load test with 1000 invoices
- [ ] Deploy to production (canary)
- [ ] Monitor error rates & costs
- [ ] Full rollout

### Post-Migration
- [ ] Remove emergentintegrations package
- [ ] Clean up old EMERGENT_LLM_KEY references
- [ ] Update documentation
- [ ] Create admin dashboard for provider stats
- [ ] Set up cost alerts (email when >₹500/day)

---

## 5. Cost Analysis

### Current Costs (Anthropic via emergentintegrations)

| Scenario | Model | Tokens (In/Out) | Cost per Invoice |
|----------|-------|-----------------|------------------|
| Premium user | Sonnet 4.5 | 2000/800 | $0.018 (₹1.50) |
| Standard user | Haiku 4.5 | 2000/800 | $0.006 (₹0.50) |
| Batch processing | Haiku 4.5 | 1500/600 | $0.0045 (₹0.38) |

**Monthly (10,000 invoices):**
- Premium users (20%): 2000 × ₹1.50 = ₹3,000
- Standard users (80%): 8000 × ₹0.50 = ₹4,000
- **Total: ₹7,000/month**

### Projected Costs (Multi-Provider Strategy)

| Scenario | Provider | Model | Cost per Invoice | Savings |
|----------|----------|-------|------------------|---------|
| Premium | Anthropic | Sonnet 4.5 | ₹1.50 | 0% |
| Standard | OpenAI | GPT-4o-mini | ₹0.10 | 80% |
| Batch | Gemini | Flash 1.5 | ₹0.03 | 92% |

**Monthly (10,000 invoices):**
- Premium: 2000 × ₹1.50 = ₹3,000
- Standard: 8000 × ₹0.10 = ₹800
- **Total: ₹3,800/month**
- **Savings: ₹3,200/month (46%)**

### ROI Calculation

**Implementation cost:** 3 weeks × 40 hours = 120 hours  
**Monthly savings:** ₹3,200  
**Breakeven:** If dev time = ₹500/hour → 120 × 500 = ₹60,000 → 19 months

**But consider:**
- Volume growth (20,000 invoices/month → ₹6,400 savings)
- Redundancy value (no single point of failure)
- Feature access (Gemini's multimodal, OpenAI's structured outputs)
- Negotiation leverage with providers

---

## 6. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Provider API changes | HIGH | MEDIUM | Version pinning, adapter pattern |
| Cost overruns | MEDIUM | LOW | Rate limiting, budget alerts, fallback to cheapest |
| Accuracy regression | HIGH | MEDIUM | A/B testing, quality metrics, gradual rollout |
| Latency increase | MEDIUM | LOW | Parallel provider testing, timeout configs |
| API key leaks | HIGH | LOW | Secrets manager, key rotation, audit logging |

---

## 7. Success Metrics

### Phase 1 (Week 1-2)
- [ ] All 3 providers integrated and tested
- [ ] Provider fallback working (99% success rate)
- [ ] Cost tracking database operational

### Phase 2 (Week 3)
- [ ] 10% canary deployment stable (error rate < 0.1%)
- [ ] Latency P95 < 3 seconds
- [ ] Cost reduction >= 40% vs baseline

### Phase 3 (Month 1-3)
- [ ] Full production rollout complete
- [ ] Average cost per invoice < ₹0.40
- [ ] 99.9% extraction success rate maintained
- [ ] Zero downtime from provider failures

---

## 8. Future Enhancements

### Short-term (Month 2-3)
- Admin dashboard for real-time provider stats
- Per-user provider preferences
- Automatic model selection based on cost/quality tradeoff
- Batch API integration for 50% additional savings

### Medium-term (Month 4-6)
- Fine-tuned models for invoice extraction
- Custom Anthropic/OpenAI models trained on Indian invoices
- Multi-language optimization (Hindi, Tamil, Gujarati)
- OCR preprocessing for non-digital invoices

### Long-term (Month 7-12)
- Self-hosted LLM option (Llama, Mistral) for cost optimization
- Hybrid approach: Edge LLM for simple invoices, cloud for complex
- ML-based provider routing (learn which provider works best per invoice type)

---

## 9. Documentation Updates Required

1. **README.md** - Update setup instructions with new API keys
2. **DEPLOYMENT.md** - Add provider configuration guide
3. **API.md** - Document new cost tracking endpoints
4. **DEVELOPER_GUIDE.md** - Explain provider abstraction architecture
5. **.env.example** - Add all new environment variables

---

## 10. Contact & Support

**Migration Lead:** Backend Team  
**Timeline:** 3 weeks (March 15 - April 5, 2026)  
**Budget:** ₹60,000 (120 dev hours)  
**Expected Savings:** ₹3,200/month (46% reduction)

---

**Status:** ✅ Plan Complete - Ready for Implementation  
**Next Step:** Obtain API keys and create provider abstraction layer
