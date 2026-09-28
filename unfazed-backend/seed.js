const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SubscriptionTierConfig = require('./src/models/SubscriptionTierConfig');

dotenv.config();

const tiers = [
  {
    tier: 'free',
    name: 'Free',
    description: 'Basic plan for getting started',
    price: { monthly: 0, yearly: 0 },
    features: {
      maxActiveClients: 5, maxTherapists: 1,
      noteTemplates: ['freeform'], analyticsDepth: 'basic',
      allowPackages: false, allowChat: true, allowVideoCalls: false,
      customBranding: false, apiAccess: false, prioritySupport: false,
      exportData: false, advancedReporting: false
    },
    caps: { sessionsPerMonth: 10, storageGB: 1, clientsPerMonth: 5 },
    isActive: true
  },
  {
    tier: 'basic',
    name: 'Basic',
    description: 'For solo practitioners',
    price: { monthly: 999, yearly: 9999 },
    features: {
      maxActiveClients: 20, maxTherapists: 1,
      noteTemplates: ['freeform', 'SOAP'], analyticsDepth: 'basic',
      allowPackages: true, allowChat: true, allowVideoCalls: false,
      customBranding: false, apiAccess: false, prioritySupport: false,
      exportData: false, advancedReporting: false
    },
    caps: { sessionsPerMonth: 50, storageGB: 5, clientsPerMonth: 20 },
    isActive: true
  },
  {
    tier: 'pro',
    name: 'Professional',
    description: 'For growing practices',
    price: { monthly: 2999, yearly: 29999 },
    features: {
      maxActiveClients: 50, maxTherapists: 5,
      noteTemplates: ['freeform', 'SOAP', 'DAP'], analyticsDepth: 'advanced',
      allowPackages: true, allowChat: true, allowVideoCalls: true,
      customBranding: true, apiAccess: true, prioritySupport: true,
      exportData: true, advancedReporting: true
    },
    caps: { sessionsPerMonth: 100, storageGB: 10, clientsPerMonth: 50 },
    isActive: true
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'For clinics and organizations',
    price: { monthly: 9999, yearly: 99999 },
    features: {
      maxActiveClients: 1000, maxTherapists: 100,
      noteTemplates: ['freeform', 'SOAP', 'DAP'], analyticsDepth: 'premium',
      allowPackages: true, allowChat: true, allowVideoCalls: true,
      customBranding: true, apiAccess: true, prioritySupport: true,
      exportData: true, advancedReporting: true
    },
    caps: { sessionsPerMonth: 10000, storageGB: 100, clientsPerMonth: 1000 },
    isActive: true
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await SubscriptionTierConfig.deleteMany({});
    await SubscriptionTierConfig.insertMany(tiers);
    console.log('Seeded ' + tiers.length + ' subscription tiers');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
