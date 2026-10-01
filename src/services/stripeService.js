// src/services/stripeService.js (Legacy compatibility proxy to Razorpay)
export {
  loadRazorpayScript,
  fetchRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyRazorpayOrder,
  fetchStripeConfig,
  createCheckoutSession,
  verifyPaymentSession,
} from './razorpayService.js';
