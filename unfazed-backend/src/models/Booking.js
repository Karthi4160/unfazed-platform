const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'pending'
  },
  type: { type: String, enum: ['individual', 'couple', 'family', 'group'], default: 'individual' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  amount: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  notes: String,
  cancellationReason: String,
  rescheduleHistory: [{
    from: Date, to: Date, reason: String, rescheduledAt: Date
  }],
  isWaitlisted: { type: Boolean, default: false },
  waitlistPosition: Number
}, { timestamps: true });

bookingSchema.index({ therapistId: 1, startTime: 1 });
bookingSchema.index({ clientId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
