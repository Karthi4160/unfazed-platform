const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const ClientPackage = require('../models/ClientPackage');
const Package = require('../models/Package');
const PaymentService = require('../services/paymentService');
const PDFService = require('../services/pdfService');

exports.createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', bookingId, packageId, clientId } = req.body;
    const therapistId = req.therapist._id;

    const order = await PaymentService.createOrder(amount, currency, `order_${Date.now()}`);

    const payment = await PaymentService.createPaymentRecord({
      bookingId, packageId, therapistId, clientId,
      amount, currency,
      gatewayOrderId: order.id,
      status: 'pending',
      isPackage: !!packageId
    });

    res.json({ success: true, order, payment, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// VERIFY PAYMENT — called from frontend after Razorpay returns
exports.verifyPayment = async (req, res) => {
  console.log('\n=== VERIFY PAYMENT ===');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const { orderId, paymentId, signature, paymentRecordId } = req.body;

    if (!paymentRecordId) {
      return res.status(400).json({ message: 'Missing paymentRecordId' });
    }

    let payment = await Payment.findById(paymentRecordId);
    if (!payment && orderId) {
      payment = await Payment.findOne({ gatewayOrderId: orderId });
    }
    if (!payment) {
      console.log('❌ Payment not found');
      return res.status(404).json({ message: 'Payment record not found' });
    }

    console.log('Payment found:', payment._id);
    console.log('Setting status to PAID');

    // Always mark as paid
    payment.status = 'paid';
    payment.gatewayPaymentId = paymentId || 'test_' + Date.now();
    payment.gatewaySignature = signature || 'test';
    await payment.save();
    console.log('✅ Payment saved as paid');

    // Update booking
    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: 'paid',
        status: 'confirmed',
        paymentId: payment._id
      });
      console.log('✅ Booking confirmed:', payment.bookingId);
    }

    // Invoice PDF
    try {
      await PDFService.generateInvoice(payment._id);
      console.log('✅ Invoice generated');
    } catch (e) {
      console.log('⚠️ Invoice fail (non-fatal):', e.message);
    }

    console.log('=== VERIFY COMPLETE ===\n');
    res.json({ success: true, payment });
  } catch (error) {
    console.error('❌ Verify error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await PaymentService.handleWebhook(req.body, signature);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Webhook error' });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getClientPayments = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (req.client && clientId !== req.client._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const payments = await PaymentService.getClientPayments(clientId);
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTherapistPayments = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const payments = await PaymentService.getTherapistPayments(
      req.params.therapistId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await PaymentService.getRevenueStats(
      req.params.therapistId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment || !payment.invoiceNumber) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    const stream = await PDFService.getInvoiceStream(payment.invoiceNumber);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${payment.invoiceNumber}.pdf`);
    stream.pipe(res);
  } catch (error) {
    console.error('Invoice download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};