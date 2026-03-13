"""Image preprocessing service — reduces vision API tokens by 50-60%"""

from PIL import Image, ImageEnhance, ImageFilter
import io
import base64
import hashlib
import numpy as np
from typing import Tuple


MAX_WIDTH = 1500
MAX_HEIGHT = 2000
JPEG_QUALITY = 85


def preprocess_invoice_image(image_b64: str) -> Tuple[str, float]:
    """
    Preprocess invoice image before sending to AI.
    Returns: (processed_base64, quality_score 0.0–1.0)
    - Resize to max 1500px width (reduces vision tokens ~50%)
    - Convert to grayscale (invoices are text, color rarely helps)
    - Enhance contrast and sharpness (improves OCR accuracy)
    - Assess blur quality score (used by model router)
    """
    try:
        img_bytes = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(img_bytes))
    except Exception:
        return image_b64, 0.7  # Return original if decode fails

    img = _fix_orientation(img)

    # Resize preserving aspect ratio
    if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
        img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)

    # Convert to grayscale — invoices are text documents
    img = img.convert('L')

    # Enhance contrast for faded text
    img = ImageEnhance.Contrast(img).enhance(1.4)

    # Sharpen for text clarity
    img = img.filter(ImageFilter.SHARPEN)

    # Assess quality score
    quality_score = _assess_blur(img)

    # Re-encode as optimized JPEG
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    processed_b64 = base64.b64encode(output.getvalue()).decode('utf-8')

    return processed_b64, quality_score


def _fix_orientation(img: Image.Image) -> Image.Image:
    """Correct rotation from EXIF metadata (common with phone camera photos)"""
    try:
        from PIL import ExifTags
        exif = img._getexif()
        if exif:
            for tag, value in exif.items():
                if ExifTags.TAGS.get(tag) == 'Orientation':
                    rotations = {3: 180, 6: 270, 8: 90}
                    if value in rotations:
                        img = img.rotate(rotations[value], expand=True)
    except Exception:
        pass
    return img


def _assess_blur(img: Image.Image) -> float:
    """
    Estimate sharpness using Laplacian variance.
    Returns 0.0 (very blurry) to 1.0 (sharp/clear)
    """
    try:
        from scipy.ndimage import convolve
        arr = np.array(img, dtype=np.float32)
        kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
        laplacian = convolve(arr, kernel)
        variance = float(laplacian.var())
        score = min(variance / 800.0, 1.0)
        return round(score, 3)
    except Exception:
        return 0.7  # Default to medium quality if assessment fails


def get_image_hash(image_b64: str) -> str:
    """SHA-256 hash for deduplication — returns same hash for identical images"""
    try:
        img_bytes = base64.b64decode(image_b64)
        return hashlib.sha256(img_bytes).hexdigest()
    except Exception:
        return hashlib.sha256(image_b64.encode()).hexdigest()
