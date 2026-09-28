const mongoose = require('mongoose');

const sessionNoteSchema = new mongoose.Schema({
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  type: { type: String, enum: ['private', 'shared'], required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  structuredFormat: {
    type: { type: String, enum: ['freeform', 'SOAP', 'DAP'] },
    data: mongoose.Schema.Types.Mixed
  },
  sessionDate: { type: Date, required: true },
  duration: Number,
  tags: [String],
  mood: String,
  progress: { type: Number, min: 0, max: 100 },
  attachments: [{
    name: String, url: String, type: String, uploadedAt: Date
  }],
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

sessionNoteSchema.index({ therapistId: 1, clientId: 1 });
sessionNoteSchema.index({ type: 1, clientId: 1 });

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
