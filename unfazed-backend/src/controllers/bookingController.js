const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const Client = require('../models/Client');
const Therapist = require('../models/Therapist');
const PaymentService = require('../services/paymentService');
const NotificationService = require('../services/notificationService');


  exports.getAvailableSlots = async (req, res) => {
  try {
    const { therapistId, date } = req.query;

    if (!therapistId || !date) {
      return res.status(400).json({ message: 'Therapist ID and date required' });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const availability = await Availability.findOne({ therapistId });
    if (!availability) return res.json({ slots: [] });

    const dateStr = targetDate.toISOString().split('T')[0];
    const override = availability.overrides.find(
      o => o.date.toISOString().split('T')[0] === dateStr
    );
    const blocked = availability.blockedSlots.filter(
      b => b.start <= targetDate && b.end >= targetDate
    );

    let timeSlots = [];

    if (override) {
      timeSlots = override.slots.map(slot => ({
        start: new Date(`${dateStr}T${slot.startTime}`),
        end: new Date(`${dateStr}T${slot.endTime}`)
      }));
    } else {
      const dayTemplate = availability.weeklyTemplate.find(
        t => t.dayOfWeek === dayOfWeek && t.isActive
      );
      if (!dayTemplate) return res.json({ slots: [] });

      const sessionDuration = availability.sessionDuration || 60;
      const bufferTime = availability.bufferTime || 0;
      const start = new Date(`${dateStr}T${dayTemplate.startTime}`);
      const end = new Date(`${dateStr}T${dayTemplate.endTime}`);

      let current = new Date(start);
      while (current < end) {
        const slotEnd = new Date(current.getTime() + sessionDuration * 60000);
        if (slotEnd <= end) {
          timeSlots.push({ start: new Date(current), end: new Date(slotEnd) });
        }
        current = new Date(current.getTime() + (sessionDuration + bufferTime) * 60000);
      }
    }

    timeSlots = timeSlots.filter(slot => {
      return !blocked.some(b => slot.start >= b.start && slot.end <= b.end);
    });

    const bookings = await Booking.find({
      therapistId,
      startTime: {
        $gte: new Date(`${dateStr}T00:00:00`),
        $lt: new Date(`${dateStr}T23:59:59`)
      },
      status: { $nin: ['cancelled', 'no-show'] }
    });

    const availableSlots = timeSlots.filter(slot => {
      return !bookings.some(b =>
        (slot.start >= b.startTime && slot.start < b.endTime) ||
        (slot.end > b.startTime && slot.end <= b.endTime)
      );
    });

    res.json({ success: true, date: targetDate, slots: availableSlots });
  } catch (error) {
    console.error('Available slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.bookSession = async (req, res) => {
  console.log('\n=== BOOK SESSION ===');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const { therapistId, clientId, startTime, endTime, duration, type, notes } = req.body;

    console.log('Therapist ID:', therapistId);
    console.log('Client ID:', clientId);
    console.log('Start:', startTime);
    console.log('End:', endTime);

    if (!therapistId || !clientId || !startTime || !endTime) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check existing booking
    const existing = await Booking.findOne({
      therapistId,
      startTime,
      status: { $nin: ['cancelled', 'no-show'] }
    });
    if (existing) {
      console.log('❌ Slot already booked');
      return res.status(409).json({ message: 'Slot already booked' });
    }

    // Lookup therapist and client
    const [therapist, client] = await Promise.all([
      Therapist.findById(therapistId),
      Client.findById(clientId)
    ]);

    console.log('Therapist found:', !!therapist);
    console.log('Client found:', !!client);

    if (!therapist || !client) {
      console.log('❌ Therapist or client not found');
      return res.status(404).json({ message: 'Therapist or client not found' });
    }

    const sessionRate = therapist.settings?.paymentSettings?.sessionRate || 1000;
    const platformFee = Math.round(sessionRate * 0.05);
    const netAmount = sessionRate - platformFee;

    console.log('Session rate:', sessionRate);
    console.log('Platform fee:', platformFee);

    // Create booking
    const booking = new Booking({
      therapistId,
      clientId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: duration || 60,
      type: type || 'individual',
      status: 'pending',
      amount: sessionRate,
      platformFee,
      netAmount,
      notes
    });

    console.log('Saving booking...');
    await booking.save();
    console.log('✅ Booking saved:', booking._id);

    // Create Razorpay order
    console.log('Creating Razorpay order...');
    let order;
    try {
      order = await PaymentService.createOrder(
        sessionRate, 'INR', `booking_${booking._id}`
      );
      console.log('✅ Order created:', order.id);
    } catch (razorpayErr) {
      console.log('⚠️  Razorpay failed (continuing without payment):', razorpayErr.message);
      // Continue without payment — allow booking to be created
      booking.status = 'confirmed';
      booking.paymentStatus = 'pending';
      await booking.save();

      // Notify
      try {
        await NotificationService.handleBookingConfirmed(booking);
      } catch (nErr) {
        console.log('Notification error:', nErr.message);
      }

      return res.status(201).json({
        success: true,
        booking,
        payment: null,
        warning: 'Booking created without payment. Razorpay not configured.'
      });
    }

    // Create payment record
    console.log('Creating payment record...');
    const payment = await PaymentService.createPaymentRecord({
      bookingId: booking._id,
      therapistId,
      clientId,
      amount: sessionRate,
      platformFee,
      netAmount,
      gatewayOrderId: order.id,
      status: 'pending'
    });
    console.log('✅ Payment record created:', payment._id);

    booking.paymentId = payment._id;
    await booking.save();

    try {
      await NotificationService.handleBookingConfirmed(booking);
    } catch (nErr) {
      console.log('Notification error:', nErr.message);
    }

    console.log('✅ BOOK SESSION COMPLETE\n');

    res.status(201).json({
      success: true,
      booking,
      payment: {
        id: payment._id,
        orderId: order.id,
        amount: sessionRate,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.log('\n=== ❌ BOOK SESSION FAILED ===');
    console.log('Error type:', typeof error);
    console.log('Error name:', error?.name);
    console.log('Error message:', error?.message);
    console.log('Error stack:', error?.stack);
    console.log('Full error:', JSON.stringify(error, null, 2));

    if (error?.errors) {
      console.log('Mongoose validation errors:');
      Object.keys(error.errors).forEach(k => {
        console.log('  -', k, ':', error.errors[k].message);
      });
    }

    res.status(500).json({
      message: 'Server error',
      error: error?.message || 'Unknown error',
      type: error?.name || 'Unknown'
    });
  }
};

exports.getTherapistBookings = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { startDate, endDate, status, limit = 50, page = 1 } = req.query;

    const query = { therapistId };
    if (status) query.status = status;
    if (startDate) query.startTime = { $gte: new Date(startDate) };
    if (endDate) query.startTime = { ...query.startTime, $lte: new Date(endDate) };

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('clientId', 'name email phone')
        .populate('paymentId')
        .sort({ startTime: -1 })
        .skip(skip).limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    res.json({
      success: true,
      bookings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getClientBookings = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status, limit = 20, page = 1 } = req.query;

    // If client is requesting, ensure they're asking for their own data
    if (req.client && clientId !== req.client._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { clientId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('therapistId', 'name slug profileImage')
        .populate('paymentId')
        .sort({ startTime: -1 })
        .skip(skip).limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    res.json({
      success: true,
      bookings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newStartTime, newEndTime, reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const existing = await Booking.findOne({
      therapistId: booking.therapistId,
      startTime: new Date(newStartTime),
      status: { $nin: ['cancelled', 'no-show'] },
      _id: { $ne: bookingId }
    });
    if (existing) return res.status(409).json({ message: 'Slot already booked' });

    booking.rescheduleHistory.push({
      from: booking.startTime,
      to: new Date(newStartTime),
      reason: reason || 'Rescheduled',
      rescheduledAt: new Date()
    });
    booking.startTime = new Date(newStartTime);
    booking.endTime = new Date(newEndTime);
    booking.status = 'pending';
    await booking.save();

    res.json({ success: true, message: 'Rescheduled', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addToWaitlist = async (req, res) => {
  try {
    const { therapistId, clientId, startTime } = req.body;

    const waitlistCount = await Booking.countDocuments({
      therapistId, isWaitlisted: true, startTime: new Date(startTime)
    });

    if (waitlistCount >= 5) {
      return res.status(409).json({ message: 'Waitlist is full' });
    }

    const entry = new Booking({
      therapistId, clientId,
      startTime: new Date(startTime),
      endTime: new Date(startTime),
      duration: 0, status: 'pending', amount: 0,
      isWaitlisted: true,
      waitlistPosition: waitlistCount + 1
    });
    await entry.save();

    res.status(201).json({
      success: true,
      message: 'Added to waitlist',
      position: waitlistCount + 1,
      waitlistEntry: entry
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
