const entitlementService = require('../services/entitlementService');

const checkEntitlement = (featureKey) => {
  return async (req, res, next) => {
    try {
      const therapistId = req.therapist?._id || req.body.therapistId;
      if (!therapistId) return res.status(400).json({ message: 'Therapist ID required' });

      const hasAccess = await entitlementService.canAccess(therapistId, featureKey);
      if (!hasAccess) {
        return res.status(403).json({
          message: 'Feature not available in your current plan',
          feature: featureKey,
          requiresUpgrade: true
        });
      }
      next();
    } catch (error) {
      console.error('Entitlement check error:', error);
      res.status(500).json({ message: 'Error checking entitlements' });
    }
  };
};

const checkCap = (capKey) => {
  return async (req, res, next) => {
    try {
      const therapistId = req.therapist?._id || req.body.therapistId;
      if (!therapistId) return res.status(400).json({ message: 'Therapist ID required' });

      const canUse = await entitlementService.checkCap(therapistId, capKey);
      if (!canUse) {
        return res.status(403).json({
          message: 'Usage limit reached for this feature',
          cap: capKey,
          requiresUpgrade: true
        });
      }
      next();
    } catch (error) {
      console.error('Cap check error:', error);
      res.status(500).json({ message: 'Error checking caps' });
    }
  };
};

module.exports = { checkEntitlement, checkCap };
