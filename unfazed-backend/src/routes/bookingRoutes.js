const express = require('express');
const router = express.Router();
const {
  getAvailableSlots, bookSession, getTherapistBookings,
  getClientBookings, cancelBooking, rescheduleBooking, addToWaitlist
} = require('../controllers/bookingController');
const { protect, protectAny } = require('../middleware/auth');
const { checkCap } = require('../middleware/entitlement');

router.get('/available-slots', getAvailableSlots);
router.post('/book', checkCap('sessionsPerMonth'), bookSession);
router.post('/waitlist', addToWaitlist);

router.get('/therapist/:therapistId', protect, getTherapistBookings);
router.get('/client/:clientId', protectAny, getClientBookings);   // ✅ accepts both
router.put('/:bookingId/cancel', protectAny, cancelBooking);
router.put('/:bookingId/reschedule', protectAny, rescheduleBooking);

module.exports = router;