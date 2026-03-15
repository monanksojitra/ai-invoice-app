"""
Batch processor — queue invoices for async processing with Haiku model.
Provides 70-80% cost savings vs real-time Sonnet:
  - Haiku model (5x cheaper than Sonnet)
  - Image preprocessing (50% fewer tokens)
  - Queue-based processing (CPU efficient)
  
Note: Batch processing uses the configured LLM provider manager with a low-cost model.
"""

import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from llm_providers import LLMMessage, build_manager_from_env
from .image_preprocessor import preprocess_invoice_image, get_image_hash
from .pdf_handler import process_pdf

logger = logging.getLogger(__name__)

_llm_manager = None


def _get_llm_manager():
    global _llm_manager
    if _llm_manager is None:
        _llm_manager = build_manager_from_env()
    return _llm_manager

EXTRACTION_SYSTEM_PROMPT = """You are an expert invoice data extraction AI specializing in Indian business documents.
Extract all invoice fields from the provided image or text.
Return ONLY valid JSON — no explanation, no preamble, no markdown fences.

JSON SCHEMA (use null for missing fields, never empty string):
{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "vendor_name": "string or null",
  "vendor_gstin": "15-char string or null",
  "vendor_phone": "string or null",
  "vendor_address": "string or null",
  "buyer_name": "string or null",
  "buyer_gstin": "string or null",
  "line_items": [{"description": "string", "hsn_code": "string or null", "quantity": "number or null", "unit": "string or null", "unit_price": "number or null", "line_total": "number", "gst_rate": "number or null"}],
  "subtotal": "number or null",
  "discount": "number or null",
  "cgst": "number or null",
  "sgst": "number or null",
  "igst": "number or null",
  "total_tax": "number or null",
  "grand_total": "number",
  "currency": "INR",
  "payment_terms": "string or null",
  "notes": "string or null",
  "confidence_scores": {"invoice_number": 0, "invoice_date": 0, "vendor_name": 0, "grand_total": 0, "line_items": 0}
}

RULES: Intra-state = CGST+SGST, inter-state = IGST. GSTIN is 15 chars. grand_total is mandatory.
For Hindi/Gujarati/Tamil: extract values, transliterate vendor name to English. All amounts are numbers."""


async def queue_for_batch(
    file_b64: str,
    mime_type: str,
    source_type: str,
    user_id: str,
    user_plan: str,
    image_hash: str,
    push_token: Optional[str],
    db
) -> str:
    """Add invoice to batch processing queue. Returns job_id."""
    job_id = str(uuid.uuid4())
    await db.batch_queue.insert_one({
        "job_id": job_id,
        "user_id": user_id,
        "user_plan": user_plan,
        "file_b64": file_b64,
        "mime_type": mime_type,
        "source_type": source_type,
        "image_hash": image_hash,
        "push_token": push_token,
        "status": "queued",
        "queued_at": datetime.now(timezone.utc),
        "processed_at": None,
        "result": None,
        "error": None
    })
    logger.info(f"[BATCH] Queued job {job_id} for user {user_id}")
    return job_id


async def extract_invoice_with_llm(content: str, is_digital: bool) -> dict:
    """Core AI extraction using the provider manager."""
    llm_manager = _get_llm_manager()
    if not llm_manager.has_providers():
        raise ValueError("No LLM providers configured")

    provider, resolved_model = llm_manager.resolve_provider_and_model("standard")

    if is_digital:
        user_message = LLMMessage(text=f"Extract all invoice fields as JSON per schema.\n\nINVOICE TEXT:\n{content}")
    else:
        user_message = LLMMessage(
            text="Extract all invoice fields as JSON per schema.",
            images=[content],
            image_mime_type="image/jpeg",
        )

    response = await llm_manager.complete(
        system_prompt=EXTRACTION_SYSTEM_PROMPT,
        user_message=user_message,
        model=resolved_model,
        provider=provider,
        enable_fallback=True,
    )
    text = response.content.strip()
    if text.startswith("```"):
        # More robust parsing - handle multiple code fences
        fences = [i for i in range(len(text)) if text[i:i+3] == "```"]
        if len(fences) >= 2:
            text = text[fences[0]+3:fences[-1]]
        else:
            text = text[3:]
        if text.lstrip().startswith("json"):
            text = text[4:]
        text = text.strip()

    return json.loads(text)


async def process_batch_queue(db):
    """
    Called by scheduler every 15 minutes.
    Process all queued invoices using Haiku model.
    """
    pending = await db.batch_queue.find({"status": "queued"}).limit(50).to_list(50)
    if not pending:
        return

    logger.info(f"[BATCH] Processing {len(pending)} queued invoices")

    for item in pending:
        try:
            # Mark as processing
            await db.batch_queue.update_one(
                {"job_id": item["job_id"]},
                {"$set": {"status": "processing"}}
            )

            # Determine content type and preprocess
            file_b64 = item["file_b64"]
            source_type = item.get("source_type", "camera")
            is_digital = False

            if source_type == "pdf":
                content, is_digital, _ = process_pdf(file_b64)
                if not is_digital:
                    content, _ = preprocess_invoice_image(content)
            else:
                content, _ = preprocess_invoice_image(file_b64)

            # Extract using Haiku (cheapest model for batch)
            extracted = await extract_invoice_with_llm(content, is_digital)

            if "error" in extracted:
                raise ValueError(extracted["error"])

            # Store result in batch_queue
            await db.batch_queue.update_one(
                {"job_id": item["job_id"]},
                {"$set": {
                    "status": "complete",
                    "result": extracted,
                    "processed_at": datetime.now(timezone.utc)
                }}
            )

            # Send push notification if token available
            push_token = item.get("push_token")
            if push_token:
                vendor_name = extracted.get("vendor_name") or "Unknown"
                await send_expo_push(
                    token=push_token,
                    title="Invoice Ready ✓",
                    body=f"Invoice from {vendor_name} is ready to review",
                    data={"job_id": item["job_id"], "type": "invoice_ready"}
                )

            logger.info(f"[BATCH] Completed job {item['job_id']}")

        except Exception as e:
            logger.error(f"[BATCH] Failed job {item['job_id']}: {e}")
            await db.batch_queue.update_one(
                {"job_id": item["job_id"]},
                {"$set": {"status": "failed", "error": str(e)}}
            )


async def send_expo_push(token: str, title: str, body: str, data: dict):
    """Send Expo push notification (free, no Firebase required)"""
    try:
        import httpx
        async with httpx.AsyncClient() as http_client:
            await http_client.post(
                "https://exp.host/--/api/v2/push/send",
                json={"to": token, "sound": "default", "title": title, "body": body, "data": data},
                headers={"Content-Type": "application/json"},
                timeout=10.0
            )
    except Exception as e:
        logger.warning(f"[PUSH] Failed to send notification: {e}")


def setup_scheduler(app, database):
    """Setup APScheduler for batch processing"""
    try:
        import asyncio
        from apscheduler.schedulers.asyncio import AsyncIOScheduler

        scheduler = AsyncIOScheduler(timezone="UTC")
        scheduler.add_job(
            lambda: asyncio.get_event_loop().create_task(process_batch_queue(database)),
            'interval',
            minutes=15,
            id='process_batch_queue',
            replace_existing=True
        )
        scheduler.start()
        app.state.scheduler = scheduler
        logger.info("[SCHEDULER] Batch scheduler started — runs every 15 minutes")
    except Exception as e:
        logger.error(f"[SCHEDULER] Failed to start: {e}")
