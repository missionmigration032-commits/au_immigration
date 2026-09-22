// src/services/stripeService.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Fetch public Stripe configuration from backend
 * @returns {Promise<{ publishableKey: string, isConfigured: boolean }>}
 */
export const fetchStripeConfig = async () => {
  try {
    const response = await fetch(`${API_URL}/api/payments/stripe-config`);
    if (response.ok) {
      return await response.json();
    }
    return { publishableKey: '', isConfigured: false };
  } catch (error) {
    console.error('Failed to fetch Stripe config:', error);
    return { publishableKey: '', isConfigured: false };
  }
};

/**
 * Create a Stripe Hosted Checkout Session
 * @param {Object} params
 * @param {string} [params.paymentId] - Existing Payment ID
 * @param {string} [params.visaId] - Visa ID (if creating payment on the fly)
 * @param {number|string} [params.amount] - Payment amount in AUD
 * @param {string} [params.currency='AUD'] - Currency code
 * @param {string} [params.successUrl] - Custom success redirect URL
 * @param {string} [params.cancelUrl] - Custom cancel redirect URL
 * @param {string} token - JWT auth token
 * @returns {Promise<{ url: string, sessionId: string, paymentId: string }>}
 */
export const createCheckoutSession = async (params, token) => {
  const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create Stripe checkout session');
  }

  return data;
};

/**
 * Verify a Stripe Checkout Session on the backend
 * @param {string} sessionId - Stripe session ID (cs_test_...)
 * @param {string} token - JWT auth token
 * @returns {Promise<{ verified: boolean, paymentStatus: string, payment: Object }>}
 */
export const verifyPaymentSession = async (sessionId, token) => {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/payments/verify-session/${sessionId}`, {
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify payment session');
  }

  return data;
};

/**
 * Create a Stripe PaymentIntent (for direct/Elements card processing)
 * @param {Object} params
 * @param {string} token - JWT auth token
 * @returns {Promise<{ clientSecret: string, paymentIntentId: string, paymentId: string }>}
 */
export const createPaymentIntent = async (params, token) => {
  const response = await fetch(`${API_URL}/api/payments/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create PaymentIntent');
  }

  return data;
};
