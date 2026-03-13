"""Model router — selects cheapest model that handles the task correctly"""

# Model identifiers
HAIKU = "claude-haiku-4-5-20251001"
SONNET = "claude-sonnet-4-5-20250929"

# Image quality threshold below which we escalate to Sonnet
QUALITY_THRESHOLD = 0.40

# Plans that always get real-time + Sonnet (best accuracy + speed)
PREMIUM_PLANS = {"pro", "business"}

# Plans routed to batch queue (async, cheaper)
BATCH_PLANS = {"free", "starter"}


def select_model(
    quality_score: float,
    user_plan: str,
    is_multipage: bool = False,
    page_count: int = 1
) -> tuple:
    """
    Select most cost-effective model for this invoice.
    Returns: (model_id, reason_string)

    Decision logic:
    - Premium plan → always Sonnet (pays for best accuracy + speed)
    - Low quality image → Sonnet (Haiku struggles with blurry/dark photos)
    - Multi-page complex PDF (>3 pages) → Sonnet
    - Everything else → Haiku (5x cheaper, near-identical for structured extraction)
    """
    if user_plan in PREMIUM_PLANS:
        return SONNET, "premium_plan"

    if quality_score < QUALITY_THRESHOLD:
        return SONNET, f"low_quality_image_{quality_score:.2f}"

    if is_multipage and page_count > 3:
        return SONNET, f"multipage_pdf_{page_count}_pages"

    return HAIKU, "standard_extraction"


def should_use_batch(user_plan: str, batch_enabled: bool = True) -> bool:
    """Returns True if this user's invoices should be queued for batch processing"""
    return batch_enabled and user_plan in BATCH_PLANS


def estimate_cost_inr(model: str, input_tokens: int, output_tokens: int, cached: bool = True) -> float:
    """Estimate processing cost in INR for a single invoice"""
    USD_TO_INR = 83.5
    pricing = {
        HAIKU:  {"input": 1.0,  "output": 5.0,  "cached_input": 0.1},
        SONNET: {"input": 3.0,  "output": 15.0, "cached_input": 0.3},
    }
    p = pricing.get(model, pricing[HAIKU])
    input_rate = p["cached_input"] if cached else p["input"]
    cost_usd = (input_tokens / 1_000_000) * input_rate + (output_tokens / 1_000_000) * p["output"]
    return round(cost_usd * USD_TO_INR, 4)
