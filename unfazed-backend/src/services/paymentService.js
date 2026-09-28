const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  async createOrder(amount, currency = 'INR', receipt = null) {
    const options = {
      amount: amount * 100,
      currency,
      receipt: receipt || `order_${Date.now()}`,
      payment_capture: 1
    };
    return await this.razorpay.orders.create(options);
  }

  async verifyPayment(orderId, paymentId, signature) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generated = crypto.createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return generated === signature;
  }

  async createPaymentRecord(data) {
    const platformFee = data.platformFee ?? Math.round(data.amount * 0.05);
    const payment = new Payment({
      bookingId: data.bookingId,
      therapistId: data.therapistId,
      clientId: data.clientId,
      amount: data.amount,
      platformFee,
      netAmount: data.amount - platformFee,
      currency: data.currency || 'INR',
      gatewayTransactionId: data.gatewayTransactionId,
      gatewayOrderId: data.gatewayOrderId,
      gatewayPaymentId: data.gatewayPaymentId,
      gatewaySignature: data.gatewaySignature,
      status: data.status || 'pending',
      paymentMethod: data.paymentMethod,
      packageId: data.packageId,
      isPackage: data.isPackage || false,
      metadata: data.metadata
    });
    await payment.save();
    return payment;
  }

  async handleWebhook(body, signature) {
    try {
      const generated = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');
      if (generated !== signature) throw new Error('Invalid webhook signature');

      const event = body.event;
      const payload = body.payload;

      if (event === 'payment.captured') {
        await this.processSuccessfulPayment(payload.payment.entity);
      } else if (event === 'payment.failed') {
        await this.processFailedPayment(payload.payment.entity);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false, error: error.message };
    }
  }

  async processSuccessfulPayment(data) {
    const payment = await Payment.findOne({ gatewayOrderId: data.order_id });
    if (!payment) return;

    payment.status = 'paid';
    payment.gatewayPaymentId = data.id;
    payment.webhookReceived = true;
    await payment.save();

    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        paymentStatus: 'paid',
        status: 'confirmed'
      });
    }
  }

  async processFailedPayment(data) {
    const payment = await Payment.findOne({ gatewayOrderId: data.order_id });
    if (payment) {
      payment.status = 'failed';
      payment.webhookReceived = true;
      await payment.save();
    }
  }

  async getClientPayments(clientId) {
    return await Payment.find({ clientId }).sort({ createdAt: -1 });
  }

  async getTherapistPayments(therapistId, startDate, endDate) {
    const query = { therapistId };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }
    return await Payment.find(query).sort({ createdAt: -1 })
      .populate('clientId', 'name email');
  }

  async getRevenueStats(therapistId, startDate, endDate) {
    const query = { therapistId, status: 'paid' };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }
    const payments = await Payment.find(query);

    return {
      totalRevenue: payments.reduce((s, p) => s + p.amount, 0),
      totalPlatformFees: payments.reduce((s, p) => s + p.platformFee, 0),
      totalNetRevenue: payments.reduce((s, p) => s + p.netAmount, 0),
      transactionCount: payments.length,
      averageTransaction: payments.length
        ? payments.reduce((s, p) => s + p.amount, 0) / payments.length
        : 0
    };
  }
}

module.exports = new PaymentService();
