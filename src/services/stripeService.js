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
    const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    return { publishableKey: envKey, isConfigured: Boolean(envKey) };
  } catch (error) {
    console.error('Failed to fetch Stripe config from API, using fallback:', error);
    const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    return { publishableKey: envKey, isConfigured: Boolean(envKey) };
  }
};

/**
 * Create a Stripe Checkout Session on the backend
 * @param {Object} params
 * @param {string} [params.paymentId] - Existing Payment ID
 * @param {string} [params.visaId] - Visa ID
 * @param {string} [params.sponsorshipId] - Sponsorship ID
 * @param {string} [params.nominationId] - Nomination ID
 * @param {number|string} [params.amount] - Payment amount in AUD
 * @param {string} [params.currency='AUD'] - Currency code
 * @param {string} [params.comments] - Comments or Visa subclass
 * @param {string} [params.customerEmail] - Customer email
 * @param {string} [params.origin='au'] - Origin
 * @param {string} [params.successUrl] - Custom success redirect URL
 * @param {string} [params.cancelUrl] - Custom cancel redirect URL
 * @param {string} token - JWT auth token
 * @returns {Promise<{ url: string, sessionId: string, paymentId: string, referenceNumber: string }>}
 */
export const createCheckoutSession = async (params, token) => {
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const successUrl = params.successUrl || `${originUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&payment_id=${params.paymentId || ''}`;
  const cancelUrl = params.cancelUrl || `${originUrl}/payment/cancel?payment_id=${params.paymentId || ''}`;

  const payload = {
    ...params,
    successUrl,
    cancelUrl,
  };

  const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create Stripe checkout session');
  }

  return data;
};

/**
 * Verify a Stripe Checkout Session status on the backend
 * @param {string} sessionId - Stripe checkout session ID (cs_...)
 * @param {string} [token] - JWT auth token
 * @returns {Promise<{ verified: boolean, paymentStatus: string, payment: Object }>}
 */
export const verifyPaymentSession = async (sessionId, token) => {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/payments/verify-session/${sessionId}`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify Stripe payment session');
  }

  return data;
};

/**
 * Redirect user directly to Stripe Checkout
 * @param {Object} params - Session creation params
 * @param {string} token - JWT auth token
 */
export const redirectToStripeCheckout = async (params, token) => {
  const session = await createCheckoutSession(params, token);
  if (session && session.url) {
    window.location.href = session.url;
  } else {
    throw new Error('No checkout URL returned from Stripe session.');
  }
};

// Aliases for backward compatibility
export const fetchRazorpayConfig = fetchStripeConfig;
export const createRazorpayOrder = createCheckoutSession;
export const verifyRazorpayPayment = verifyPaymentSession;
export const verifyRazorpayOrder = verifyPaymentSession;
export const loadRazorpayScript = () => Promise.resolve(true);
