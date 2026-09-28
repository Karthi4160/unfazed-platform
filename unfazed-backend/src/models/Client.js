const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },
  name: { type: String, required: true },
  phone: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'] },
  intake: {
    presentingConcern: String,
    history: String,
    medications: String,
    allergies: String,
    emergencyContact: { name: String, relationship: String, phone: String },
    demographics: { occupation: String, education: String, maritalStatus: String },
    consent: { signed: { type: Boolean, default: false }, signedAt: Date, version: String }
  },
  status: { type: String, enum: ['active', 'inactive', 'waiting'], default: 'waiting' },
  tags: [String],
  notes: { type: String, maxlength: 5000 },
  lastSessionDate: Date,
  totalSessions: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

clientSchema.index({ therapistId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);

