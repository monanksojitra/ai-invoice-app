"""
Payment Gateway Utilities for InvoiceAI
Handles Razorpay and Stripe integrations
"""

import os
import hmac
import hashlib
from typing import Dict, Optional
import razorpay
from dotenv import load_dotenv

load_dotenv()

# ═══════════════════════════════════════════════════════════════════════════════
# RAZORPAY CLIENT
# ═══════════════════════════════════════════════════════════════════════════════

def get_razorpay_client():
    """Get initialized Razorpay client"""
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_id or not key_secret or "PLACEHOLDER" in key_id:
        raise ValueError("Razorpay credentials not configured. Please add to .env file.")
    
    return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order(amount: int, currency: str = "INR", receipt: str = None, notes: Dict = None) -> Dict:
    """
    Create a Razorpay order
    
    Args:
        amount: Amount in paise (₹100 = 10000 paise)
        currency: Currency code (default: INR)
        receipt: Receipt/order ID for tracking
        notes: Additional metadata
    
    Returns:
        Order details including order_id
    """
    client = get_razorpay_client()
    
    order_data = {
        "amount": amount,  # Amount in paise
        "currency": currency,
        "payment_capture": 1  # Auto-capture payment
    }
    
    if receipt:
        order_data["receipt"] = receipt
    if notes:
        order_data["notes"] = notes
    
    order = client.order.create(data=order_data)
    return order


def verify_razorpay_payment(order_id: str, payment_id: str, signature: str) -> bool:
    """
    Verify Razorpay payment signature
    
    Args:
        order_id: Razorpay order ID
        payment_id: Razorpay payment ID
        signature: Payment signature from Razorpay
    
    Returns:
        True if signature is valid, False otherwise
    """
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if not key_secret or "PLACEHOLDER" in key_secret:
        raise ValueError("Razorpay secret not configured")
    
    # Generate expected signature
    message = f"{order_id}|{payment_id}"
    expected_signature = hmac.new(
        key_secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)


def verify_razorpay_webhook(payload: bytes, signature: str) -> bool:
    """
    Verify Razorpay webhook signature
    
    Args:
        payload: Raw webhook payload (bytes)
        signature: X-Razorpay-Signature header value
    
    Returns:
        True if signature is valid
    """
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    
    if not webhook_secret or "PLACEHOLDER" in webhook_secret:
        # In development, skip verification if not configured
        return True
    
    expected_signature = hmac.new(
        webhook_secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)


def fetch_payment_details(payment_id: str) -> Dict:
    """
    Fetch payment details from Razorpay
    
    Args:
        payment_id: Razorpay payment ID
    
    Returns:
        Payment details
    """
    client = get_razorpay_client()
    return client.payment.fetch(payment_id)


def create_razorpay_refund(payment_id: str, amount: Optional[int] = None, notes: Dict = None) -> Dict:
    """
    Create a refund for a payment
    
    Args:
        payment_id: Razorpay payment ID
        amount: Refund amount in paise (None for full refund)
        notes: Additional metadata
    
    Returns:
        Refund details
    """
    client = get_razorpay_client()
    
    refund_data = {}
    if amount:
        refund_data["amount"] = amount
    if notes:
        refund_data["notes"] = notes
    
    return client.payment.refund(payment_id, refund_data)


# ═══════════════════════════════════════════════════════════════════════════════
# STRIPE CLIENT (Optional - for international payments)
# ═══════════════════════════════════════════════════════════════════════════════

def get_stripe_client():
    """Get initialized Stripe client"""
    try:
        import stripe
    except ImportError:
        raise ImportError("Stripe SDK not installed. Run: pip install stripe")
    
    secret_key = os.getenv("STRIPE_SECRET_KEY")
    
    if not secret_key or "PLACEHOLDER" in secret_key:
        raise ValueError("Stripe credentials not configured")
    
    stripe.api_key = secret_key
    return stripe


def create_stripe_payment_intent(amount: int, currency: str = "usd", metadata: Dict = None) -> Dict:
    """
    Create a Stripe PaymentIntent
    
    Args:
        amount: Amount in cents ($100 = 10000 cents)
        currency: Currency code (default: usd)
        metadata: Additional metadata
    
    Returns:
        PaymentIntent details including client_secret
    """
    stripe = get_stripe_client()
    
    intent_data = {
        "amount": amount,
        "currency": currency,
        "automatic_payment_methods": {"enabled": True}
    }
    
    if metadata:
        intent_data["metadata"] = metadata
    
    return stripe.PaymentIntent.create(**intent_data)


def verify_stripe_webhook(payload: bytes, signature: str) -> Dict:
    """
    Verify and parse Stripe webhook
    
    Args:
        payload: Raw webhook payload
        signature: Stripe-Signature header
    
    Returns:
        Parsed event object
    """
    stripe = get_stripe_client()
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    if not webhook_secret or "PLACEHOLDER" in webhook_secret:
        raise ValueError("Stripe webhook secret not configured")
    
    return stripe.Webhook.construct_event(
        payload, signature, webhook_secret
    )


# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def rupees_to_paise(rupees: float) -> int:
    """Convert rupees to paise (₹1 = 100 paise)"""
    return int(rupees * 100)


def paise_to_rupees(paise: int) -> float:
    """Convert paise to rupees"""
    return paise / 100


def dollars_to_cents(dollars: float) -> int:
    """Convert dollars to cents"""
    return int(dollars * 100)


def cents_to_dollars(cents: int) -> float:
    """Convert cents to dollars"""
    return cents / 100


def format_currency(amount: float, currency: str = "INR") -> str:
    """Format currency for display"""
    if currency == "INR":
        return f"₹{amount:,.2f}"
    elif currency == "USD":
        return f"${amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"


# ═══════════════════════════════════════════════════════════════════════════════
# TESTING / DEVELOPMENT HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def is_razorpay_configured() -> bool:
    """Check if Razorpay is properly configured"""
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    return bool(key_id and key_secret and "PLACEHOLDER" not in key_id)


def is_stripe_configured() -> bool:
    """Check if Stripe is properly configured"""
    secret_key = os.getenv("STRIPE_SECRET_KEY", "")
    return bool(secret_key and "PLACEHOLDER" not in secret_key)


def get_configured_gateways() -> list:
    """Get list of configured payment gateways"""
    gateways = []
    if is_razorpay_configured():
        gateways.append("razorpay")
    if is_stripe_configured():
        gateways.append("stripe")
    return gateways
