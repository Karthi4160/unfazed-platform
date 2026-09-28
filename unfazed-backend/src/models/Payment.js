const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  amount: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  gateway: { type: String, default: 'razorpay' },
  gatewayTransactionId: { type: String, unique: true, sparse: true },
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  isPackage: { type: Boolean, default: false },
  invoiceNumber: String,
  invoiceUrl: String,
  metadata: mongoose.Schema.Types.Mixed,
  refundDetails: {
    amount: Number, reason: String, refundedAt: Date, transactionId: String
  },
  webhookReceived: { type: Boolean, default: false }
}, { timestamps: true });

paymentSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Payment').countDocuments();
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
