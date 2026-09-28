const express = require('express');
const router = express.Router();
const {
  getStats, getRevenueTrend, getSessionDistribution,
  getActiveClientsTrend, getNoShowRateTrend
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getStats);
router.get('/revenue', getRevenueTrend);
router.get('/sessions-distribution', getSessionDistribution);
router.get('/clients-trend', getActiveClientsTrend);
router.get('/no-show-trend', getNoShowRateTrend);

module.exports = router;
