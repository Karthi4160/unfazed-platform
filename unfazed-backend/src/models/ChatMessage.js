const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'fromUserModel' },
  fromUserModel: { type: String, enum: ['Therapist', 'Client'], required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'toUserModel' },
  toUserModel: { type: String, enum: ['Therapist', 'Client'], required: true },
  message: { type: String, required: true, maxlength: 5000 },
  type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  attachmentUrl: String,
  read: { type: Boolean, default: false },
  readAt: Date,
  delivered: { type: Boolean, default: false },
  deliveredAt: Date
}, { timestamps: true });

chatMessageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });
chatMessageSchema.index({ toUserId: 1, read: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
