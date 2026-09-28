const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' },
  userModel: { type: String, enum: ['Therapist', 'Client'] },
  type: {
    type: String,
    enum: [
      'booking_confirmed', 'booking_reminder', 'booking_cancelled',
      'payment_success', 'payment_failed', 'session_completed',
      'note_shared', 'message_received', 'package_expiring',
      'subscription_renewal', 'waitlist_available'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  channels: [{ type: String, enum: ['email', 'sms', 'push', 'in-app'] }],
  read: { type: Boolean, default: false },
  readAt: Date,
  delivered: { type: Boolean, default: false },
  deliveredAt: Date,
  sentAt: Date,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  expiresAt: Date,
  actionUrl: String
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
