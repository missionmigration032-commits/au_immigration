// src/services/razorpayService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Dynamically loads the Razorpay checkout script if not already loaded on the page
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Fetch public Razorpay configuration from backend
 * @returns {Promise<{ keyId: string, isConfigured: boolean }>}
 */
export const fetchRazorpayConfig = async () => {
  try {
    const response = await fetch(`${API_URL}/api/payments/razorpay-config`);
    if (response.ok) {
      return await response.json();
    }
    return { keyId: '', isConfigured: false };
  } catch (error) {
    console.error('Failed to fetch Razorpay config:', error);
    return { keyId: '', isConfigured: false };
  }
};

/**
 * Create a Razorpay Order on the backend
 * @param {Object} params
 * @param {string} [params.paymentId] - Existing Payment ID
 * @param {string} [params.visaId] - Visa ID (if creating payment on the fly)
 * @param {number|string} [params.amount] - Payment amount in AUD/INR
 * @param {string} [params.currency='AUD'] - Currency code
 * @param {string} [params.comments] - Comments or Visa subclass
 * @param {string} [params.customerEmail] - Customer email
 * @param {string} [params.origin='au'] - Origin
 * @param {string} token - JWT auth token
 * @returns {Promise<{ orderId: string, keyId: string, amount: number, currency: string, paymentId: string, referenceNumber: string }>}
 */
export const createRazorpayOrder = async (params, token) => {
  const response = await fetch(`${API_URL}/api/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create Razorpay order');
  }

  return data;
};

/**
 * Verify a Razorpay Payment Signature on the backend
 * @param {Object} params
 * @param {string} params.razorpay_order_id
 * @param {string} params.razorpay_payment_id
 * @param {string} params.razorpay_signature
 * @param {string} [params.paymentId]
 * @param {string} token - JWT auth token
 * @returns {Promise<{ verified: boolean, message: string, payment: Object }>}
 */
export const verifyRazorpayPayment = async (params, token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/payments/verify-payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify Razorpay payment');
  }

  return data;
};

/**
 * Verify an order status directly on the backend
 * @param {string} orderId - Razorpay order ID (order_...)
 * @param {string} [token] - JWT auth token
 * @returns {Promise<{ verified: boolean, paymentStatus: string, payment: Object }>}
 */
export const verifyRazorpayOrder = async (orderId, token) => {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/payments/verify-order/${orderId}`, {
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify payment order');
  }

  return data;
};

// Aliases for backward compatibility with Stripe service signatures
export const fetchStripeConfig = fetchRazorpayConfig;
export const createCheckoutSession = createRazorpayOrder;
export const verifyPaymentSession = verifyRazorpayOrder;
