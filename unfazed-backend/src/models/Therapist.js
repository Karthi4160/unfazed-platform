const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const therapistSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  bio: { type: String, maxlength: 2000 },
  profileImage: String,
  specializations: [String],
  languages: [String],
  credentials: String,
  yearsOfExperience: Number,
  address: {
    street: String, city: String, state: String, zipCode: String, country: String
  },
  sessionDuration: { type: Number, default: 60 },
  bufferTime: { type: Number, default: 15 },
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  subscriptionExpiry: Date,
  settings: {
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    paymentSettings: {
      currency: { type: String, default: 'INR' },
      sessionRate: { type: Number, default: 1000 }
    }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

therapistSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

therapistSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

therapistSchema.statics.generateSlug = function(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

module.exports = mongoose.model('Therapist', therapistSchema);
