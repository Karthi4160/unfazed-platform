const mongoose = require('mongoose');

const subscriptionTierConfigSchema = new mongoose.Schema({
  tier: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    required: true,
    unique: true
  },
  name: { type: String, required: true },
  description: String,
  price: { monthly: Number, yearly: Number },
  features: {
    maxActiveClients: { type: Number, default: 5 },
    maxTherapists: { type: Number, default: 1 },
    noteTemplates: { type: [String], default: ['freeform'] },
    analyticsDepth: {
      type: String,
      enum: ['basic', 'advanced', 'premium'],
      default: 'basic'
    },
    allowPackages: { type: Boolean, default: false },
    allowChat: { type: Boolean, default: true },
    allowVideoCalls: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    exportData: { type: Boolean, default: false },
    advancedReporting: { type: Boolean, default: false }
  },
  caps: {
    sessionsPerMonth: { type: Number, default: 10 },
    storageGB: { type: Number, default: 1 },
    clientsPerMonth: { type: Number, default: 5 }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SubscriptionTierConfig', subscriptionTierConfigSchema);
