/**
 * Payment Service - Razorpay Integration
 * Handles payment flows for credit purchases and subscription upgrades
 */

import { Linking } from 'react-native';
import { API_BASE_URL } from './api';

export interface PaymentOrderRequest {
  amount: number; // Amount in rupees
  currency?: string;
  type: 'credit_purchase' | 'subscription_upgrade';
  credits?: number;
  plan?: string;
  notes?: Record<string, any>;
}

export interface PaymentOrderResponse {
  order_id: string;
  amount: number; // Amount in paise
  currency: string;
  key_id: string;
  transaction_id: string;
}

export interface PaymentResult {
  success: boolean;
  transaction_id: string;
  credits_added?: number;
  new_balance?: number;
  plan_upgraded?: string;
  message: string;
  error?: string;
}

/**
 * Create a payment order on backend
 */
export async function createPaymentOrder(
  token: string,
  orderRequest: PaymentOrderRequest
): Promise<PaymentOrderResponse> {
  const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderRequest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create payment order');
  }

  return response.json();
}

/**
 * Verify payment on backend after Razorpay checkout
 */
export async function verifyPayment(
  token: string,
  verificationData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    transaction_id: string;
  }
): Promise<PaymentResult> {
  const response = await fetch(`${API_BASE_URL}/payment/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(verificationData),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      success: false,
      transaction_id: verificationData.transaction_id,
      message: result.detail || 'Payment verification failed',
      error: result.detail,
    };
  }

  return {
    success: result.success,
    transaction_id: result.transaction_id,
    credits_added: result.credits_added,
    new_balance: result.new_balance,
    plan_upgraded: result.plan_upgraded,
    message: result.message,
  };
}

/**
 * Initiate Razorpay Web Checkout
 * Opens Razorpay payment page in browser
 */
export async function initiateRazorpayCheckout(
  order: PaymentOrderResponse,
  userDetails: {
    name: string;
    email: string;
    phone?: string;
  },
  callbacks: {
    onSuccess: (paymentData: any) => void;
    onFailure: (error: any) => void;
    onDismiss?: () => void;
  }
): Promise<void> {
  // For web/Expo, we'll use Razorpay's hosted checkout page
  // In production, you might want to use their Checkout.js SDK
  
  const checkoutUrl = createRazorpayCheckoutUrl(order, userDetails);
  
  try {
    // Open Razorpay checkout in browser
    const supported = await Linking.canOpenURL(checkoutUrl);
    
    if (supported) {
      await Linking.openURL(checkoutUrl);
      // Note: In a real implementation, you'd need to handle the callback
      // This is a simplified version - consider using deep linking or webhooks
    } else {
      throw new Error('Cannot open payment URL');
    }
  } catch (error) {
    callbacks.onFailure(error);
  }
}

/**
 * Create Razorpay checkout URL (for web-based flow)
 */
function createRazorpayCheckoutUrl(
  order: PaymentOrderResponse,
  userDetails: { name: string; email: string; phone?: string }
): string {
  // Build Razorpay standard checkout URL
  const params = new URLSearchParams({
    key_id: order.key_id,
    amount: order.amount.toString(),
    currency: order.currency,
    order_id: order.order_id,
    name: 'InvoiceAI',
    description: 'Credit Purchase',
    prefill_name: userDetails.name,
    prefill_email: userDetails.email,
    ...(userDetails.phone && { prefill_contact: userDetails.phone }),
  });

  return `https://api.razorpay.com/v1/checkout/embedded?${params.toString()}`;
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Calculate total amount with any discounts
 */
export function calculateTotalAmount(baseAmount: number, discountPercent: number = 0): number {
  if (discountPercent > 0) {
    return baseAmount * (1 - discountPercent / 100);
  }
  return baseAmount;
}

/**
 * Get credit package by credits amount
 */
export function getCreditPackage(credits: number): {
  credits: number;
  price: number;
  bonus: number;
  total: number;
  savings: number;
} | null {
  const packages = [
    { credits: 100, price: 100, bonus: 0, total: 100, savings: 0 },
    { credits: 500, price: 500, bonus: 50, total: 550, savings: 10 },
    { credits: 1000, price: 1000, bonus: 200, total: 1200, savings: 20 },
    { credits: 5000, price: 5000, bonus: 1500, total: 6500, savings: 30 },
  ];

  return packages.find((pkg) => pkg.credits === credits) || null;
}

/**
 * Get plan pricing
 */
export function getPlanPricing(plan: string): {
  price: number;
  credits: number;
  duration: string;
} | null {
  const plans: Record<string, { price: number; credits: number; duration: string }> = {
    free: { price: 0, credits: 100, duration: 'forever' },
    starter: { price: 299, credits: 1000, duration: '30 days' },
    pro: { price: 999, credits: 5000, duration: '30 days' },
  };

  return plans[plan] || null;
}

/**
 * Check if payment gateway is available
 */
export async function checkPaymentGatewayAvailability(): Promise<{
  available: boolean;
  gateways: string[];
  primary: string | null;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/gateways`);
    const data = await response.json();
    
    return {
      available: data.available_gateways.length > 0,
      gateways: data.available_gateways,
      primary: data.primary,
    };
  } catch (error) {
    return {
      available: false,
      gateways: [],
      primary: null,
    };
  }
}

/**
 * Payment status polling (for webhook delays)
 * Polls transaction status until it's completed or times out
 */
export async function pollPaymentStatus(
  token: string,
  transactionId: string,
  maxAttempts: number = 10,
  intervalMs: number = 2000
): Promise<{ status: string; completed: boolean }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions?limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const transaction = data.transactions?.find(
          (t: any) => t.id === transactionId
        );

        if (transaction) {
          if (transaction.status === 'completed') {
            return { status: 'completed', completed: true };
          }
          if (transaction.status === 'failed') {
            return { status: 'failed', completed: true };
          }
        }
      }
    } catch (error) {
      console.error('Error polling payment status:', error);
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  // Timeout
  return { status: 'pending', completed: false };
}

/**
 * Error messages for common payment errors
 */
export function getPaymentErrorMessage(error: any): string {
  const message = error?.message || error?.detail || String(error);

  // Map common errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'Payment gateway not configured': 
      'Payment service is currently unavailable. Please try again later or contact support.',
    'Invalid payment signature': 
      'Payment verification failed. Please contact support if amount was deducted.',
    'Insufficient credits': 
      'You don\'t have enough credits. Please purchase more.',
    'Transaction not found': 
      'Transaction record not found. Please contact support.',
    'Failed to create payment order': 
      'Unable to initiate payment. Please check your connection and try again.',
  };

  // Check if error message matches any known patterns
  for (const [pattern, friendlyMessage] of Object.entries(errorMap)) {
    if (message.includes(pattern)) {
      return friendlyMessage;
    }
  }

  // Generic error
  return 'Payment failed. Please try again or contact support if the issue persists.';
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number): {
  valid: boolean;
  error?: string;
} {
  if (amount < 100) {
    return { valid: false, error: 'Minimum payment amount is ₹100' };
  }

  if (amount > 100000) {
    return { valid: false, error: 'Maximum payment amount is ₹1,00,000' };
  }

  return { valid: true };
}

/**
 * Generate receipt/invoice ID
 */
export function generateReceiptId(prefix: string = 'INV'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}`;
}
