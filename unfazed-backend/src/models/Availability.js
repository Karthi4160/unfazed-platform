const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', required: true },
  weeklyTemplate: [{
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: String,
    endTime: String,
    isActive: { type: Boolean, default: true }
  }],
  overrides: [{
    date: Date,
    slots: [{ startTime: String, endTime: String }],
    isFullDay: { type: Boolean, default: false }
  }],
  blockedSlots: [{ start: Date, end: Date, reason: String }],
  sessionDuration: { type: Number, default: 60 },
  bufferTime: { type: Number, default: 15 }
}, { timestamps: true });

module.exports = mongoose.model('Availability', availabilitySchema);
