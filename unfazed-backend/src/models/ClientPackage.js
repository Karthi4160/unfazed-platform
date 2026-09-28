const mongoose = require('mongoose');

const clientPackageSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  sessionsTotal: { type: Number, required: true },
  sessionsUsed: { type: Number, default: 0 },
  sessionsRemaining: { type: Number, required: true },
  pricePaid: { type: Number, required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  status: {
    type: String,
    enum: ['active', 'expired', 'exhausted', 'cancelled'],
    default: 'active'
  },
  purchaseDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ClientPackage', clientPackageSchema);
