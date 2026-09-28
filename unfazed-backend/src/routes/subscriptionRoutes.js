const express = require('express');
const router = express.Router();
const {
  getTiers, getCurrentSubscription, changeTier,
  checkAccess, getUsage, getAvailableFeatures
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

router.get('/tiers', getTiers);

router.use(protect);
router.get('/current', getCurrentSubscription);
router.post('/change-tier', changeTier);
router.get('/check/:featureKey', checkAccess);
router.get('/usage', getUsage);
router.get('/features', getAvailableFeatures);

module.exports = router;
