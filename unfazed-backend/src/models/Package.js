const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
  name: { type: String, required: true },
  description: String,
  sessionsCount: { type: Number, required: true, enum: [3, 6, 12] },
  pricePerSession: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  validityDays: { type: Number, default: 90 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
