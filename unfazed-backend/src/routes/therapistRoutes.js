const express = require('express');
const router = express.Router();
const {
  getProfile, updateAvailabilitySettings,
  updatePaymentSettings, getPublicTherapists
} = require('../controllers/therapistController');
const { protect } = require('../middleware/auth');

router.get('/', getPublicTherapists);
router.get('/profile', protect, getProfile);
router.put('/availability-settings', protect, updateAvailabilitySettings);
router.put('/payment-settings', protect, updatePaymentSettings);

module.exports = router;
