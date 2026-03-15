"""Service-level unit tests for backend helpers."""

import base64
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import fitz
from PIL import Image

from services.image_preprocessor import preprocess_invoice_image, get_image_hash
from services.model_router import select_model, should_use_batch, HAIKU, SONNET
from services.pdf_handler import process_pdf


def _make_test_image_b64() -> str:
    img = Image.new("RGB", (64, 64), color=(255, 255, 255))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def test_preprocess_invoice_image_returns_base64_and_score():
    image_b64 = _make_test_image_b64()
    processed_b64, quality = preprocess_invoice_image(image_b64)

    assert isinstance(processed_b64, str)
    assert processed_b64
    assert 0.0 <= quality <= 1.0


def test_get_image_hash_is_stable():
    image_b64 = _make_test_image_b64()
    first = get_image_hash(image_b64)
    second = get_image_hash(image_b64)

    assert first == second


def test_model_router_selects_expected_models():
    model, reason = select_model(0.9, "free")
    assert model == HAIKU
    assert reason == "standard_extraction"

    model, reason = select_model(0.2, "free")
    assert model == SONNET
    assert reason.startswith("low_quality_image_")

    model, reason = select_model(0.9, "pro")
    assert model == SONNET
    assert reason == "premium_plan"


def test_should_use_batch_for_free_plan():
    assert should_use_batch("free", batch_enabled=True) is True
    assert should_use_batch("business", batch_enabled=True) is False


def test_process_pdf_detects_digital_text():
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Invoice text line " * 12)
    pdf_bytes = doc.tobytes()
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")

    content, is_digital, page_count = process_pdf(pdf_b64)

    assert is_digital is True
    assert "Invoice" in content
    assert page_count == 1
