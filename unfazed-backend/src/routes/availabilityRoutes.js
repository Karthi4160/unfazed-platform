const express = require('express');
const router = express.Router();
const {
  getAvailability, updateWeeklyTemplate, addOverride,
  removeOverride, addBlockedSlot, removeBlockedSlot
} = require('../controllers/availabilityController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAvailability);
router.put('/weekly-template', updateWeeklyTemplate);
router.post('/overrides', addOverride);
router.delete('/overrides/:overrideId', removeOverride);
router.post('/blocked-slots', addBlockedSlot);
router.delete('/blocked-slots/:slotId', removeBlockedSlot);

module.exports = router;
