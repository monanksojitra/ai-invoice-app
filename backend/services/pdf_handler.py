"""PDF handler — free local text extraction for digital PDFs (no AI tokens needed)"""

import fitz  # PyMuPDF
import base64
from typing import Tuple

MIN_TEXT_LENGTH = 80  # Chars threshold to classify as digital PDF


def process_pdf(pdf_b64: str) -> Tuple[str, bool, int]:
    """
    Intelligently process a PDF.
    - Digital PDF (has selectable text): extract text FREE via PyMuPDF
    - Scanned PDF (image-based): convert first page to image for vision API

    Returns: (content, is_digital, page_count)
      - content: extracted text (digital) or base64 JPEG image (scanned)
      - is_digital: True = use text extraction, False = use vision API
      - page_count: total pages (used by model router complexity assessment)
    """
    try:
        pdf_bytes = base64.b64decode(pdf_b64)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)

        # Try text extraction first (FREE, no API call needed)
        full_text = ""
        for page in doc:
            full_text += page.get_text()

        if len(full_text.strip()) >= MIN_TEXT_LENGTH:
            # Digital PDF — return text (cap at 5000 chars to limit tokens)
            clean_text = " ".join(full_text.split())  # Normalize whitespace
            return clean_text[:5000], True, page_count

        # Scanned PDF — render first page as image
        first_page = doc[0]
        mat = fitz.Matrix(150 / 72, 150 / 72)  # 150 DPI — good quality/size balance
        pix = first_page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("jpeg")
        img_b64 = base64.b64encode(img_bytes).decode('utf-8')
        return img_b64, False, page_count

    except Exception as e:
        # If PDF processing fails, return empty and flag as non-digital
        return "", False, 1
