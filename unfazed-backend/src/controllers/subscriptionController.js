const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Therapist = require('../models/Therapist');
const entitlementService = require('../services/entitlementService');

exports.getTiers = async (req, res) => {
  try {
    const tiers = await SubscriptionTierConfig.find({ isActive: true })
      .sort({ 'price.monthly': 1 });
    res.json({ success: true, tiers });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCurrentSubscription = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.therapist._id);
    const config = await entitlementService.getTherapistSubscription(req.therapist._id);
    const usage = await entitlementService.getUsageStats(req.therapist._id);

    res.json({
      success: true,
      tier: therapist.subscriptionTier,
      expiry: therapist.subscriptionExpiry,
      config, usage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changeTier = async (req, res) => {
  try {
    const { tier } = req.body;
    const valid = ['free', 'basic', 'pro', 'enterprise'];
    if (!valid.includes(tier)) return res.status(400).json({ message: 'Invalid tier' });

    const config = await SubscriptionTierConfig.findOne({ tier });
    if (!config) return res.status(404).json({ message: 'Tier not found' });

    const therapist = await Therapist.findById(req.therapist._id);
    therapist.subscriptionTier = tier;

    if (tier !== 'free') {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      therapist.subscriptionExpiry = expiry;
    } else {
      therapist.subscriptionExpiry = null;
    }
    await therapist.save();

    res.json({
      success: true,
      message: `Subscription changed to ${tier}`,
      therapist: {
        id: therapist._id,
        subscriptionTier: therapist.subscriptionTier,
        subscriptionExpiry: therapist.subscriptionExpiry
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.checkAccess = async (req, res) => {
  try {
    const hasAccess = await entitlementService.canAccess(
      req.therapist._id,
      req.params.featureKey
    );
    res.json({ success: true, featureKey: req.params.featureKey, hasAccess });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsage = async (req, res) => {
  try {
    const usage = await entitlementService.getUsageStats(req.therapist._id);
    res.json({ success: true, usage });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAvailableFeatures = async (req, res) => {
  try {
    const features = await entitlementService.getAvailableFeatures(req.therapist._id);
    res.json({ success: true, features });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
