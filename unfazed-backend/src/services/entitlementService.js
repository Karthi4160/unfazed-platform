const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Booking = require('../models/Booking');

class EntitlementService {
  async getTherapistSubscription(therapistId) {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) throw new Error('Therapist not found');

    let config = await SubscriptionTierConfig.findOne({ tier: therapist.subscriptionTier });
    if (!config) config = await SubscriptionTierConfig.findOne({ tier: 'free' });
    return config;
  }

  async canAccess(therapistId, featureKey) {
    try {
      const config = await this.getTherapistSubscription(therapistId);
      const featurePath = featureKey.split('.');
      let featureValue = config.features;

      for (const key of featurePath) {
        if (featureValue && typeof featureValue === 'object') {
          featureValue = featureValue[key];
        } else {
          return false;
        }
      }

      if (Array.isArray(featureValue)) return featureValue.length > 0;
      return Boolean(featureValue);
    } catch (error) {
      console.error('Entitlement check error:', error);
      return false;
    }
  }

  async checkCap(therapistId, capKey) {
    try {
      const config = await this.getTherapistSubscription(therapistId);
      const capLimit = config.caps[capKey];
      if (!capLimit) return true;

      switch (capKey) {
        case 'maxActiveClients': {
          const activeClients = await Client.countDocuments({ therapistId, isActive: true });
          return activeClients < capLimit;
        }
        case 'sessionsPerMonth': {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const sessions = await Booking.countDocuments({
            therapistId, status: 'completed', createdAt: { $gte: monthStart }
          });
          return sessions < capLimit;
        }
        case 'clientsPerMonth': {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const newClients = await Client.countDocuments({
            therapistId, createdAt: { $gte: monthStart }
          });
          return newClients < capLimit;
        }
        default:
          return true;
      }
    } catch (error) {
      console.error('Cap check error:', error);
      return true;
    }
  }

  async getUsageStats(therapistId) {
    try {
      const [activeClients, sessionsThisMonth, newClientsThisMonth] = await Promise.all([
        Client.countDocuments({ therapistId, isActive: true }),
        Booking.countDocuments({
          therapistId, status: 'completed',
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }),
        Client.countDocuments({
          therapistId,
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        })
      ]);

      const config = await this.getTherapistSubscription(therapistId);

      return {
        activeClients,
        sessionsThisMonth,
        newClientsThisMonth,
        limits: config.caps,
        tier: config.tier,
        usagePercentages: {
          activeClients: Math.round((activeClients / config.caps.maxActiveClients) * 100) || 0,
          sessionsThisMonth: Math.round((sessionsThisMonth / config.caps.sessionsPerMonth) * 100) || 0
        }
      };
    } catch (error) {
      console.error('Usage stats error:', error);
      return null;
    }
  }

  async getAvailableFeatures(therapistId) {
    const config = await this.getTherapistSubscription(therapistId);
    return config.features;
  }
}

module.exports = new EntitlementService();
