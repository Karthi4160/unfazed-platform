const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getClientPayments,
  getTherapistPayments,
  getRevenueStats,
  downloadInvoice,
  handleWebhook
} = require('../controllers/paymentController');
const { protect, protectAny, protectClient } = require('../middleware/auth');

// Webhook (public)
router.post('/webhook', handleWebhook);

// Verify — accepts BOTH therapist AND client tokens
router.post('/verify', protectAny, verifyPayment);

// Create order — therapist only (they initiate payment)
router.post('/create-order', protect, createPaymentOrder);

// Status — accepts both
router.get('/status/:paymentId', protectAny, getPaymentStatus);

// Client payments
router.get('/client/:clientId', protectAny, getClientPayments);

// Therapist payments
router.get('/therapist/:therapistId', protect, getTherapistPayments);
router.get('/revenue/:therapistId', protect, getRevenueStats);

// Invoice — accepts both
router.get('/invoice/:paymentId', protectAny, downloadInvoice);

module.exports = router;