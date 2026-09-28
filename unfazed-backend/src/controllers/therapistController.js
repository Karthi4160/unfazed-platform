const Therapist = require('../models/Therapist');

exports.getProfile = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.therapist._id).select('-passwordHash');
    res.json({ success: true, therapist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAvailabilitySettings = async (req, res) => {
  try {
    const { sessionDuration, bufferTime, timezone } = req.body;
    const therapist = await Therapist.findById(req.therapist._id);
    if (!therapist) return res.status(404).json({ message: 'Not found' });

    if (sessionDuration) therapist.sessionDuration = sessionDuration;
    if (bufferTime !== undefined) therapist.bufferTime = bufferTime;
    if (timezone) therapist.settings.timezone = timezone;

    await therapist.save();
    res.json({ success: true, therapist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePaymentSettings = async (req, res) => {
  try {
    const { sessionRate, currency } = req.body;
    const therapist = await Therapist.findById(req.therapist._id);
    if (!therapist) return res.status(404).json({ message: 'Not found' });

    if (sessionRate) therapist.settings.paymentSettings.sessionRate = sessionRate;
    if (currency) therapist.settings.paymentSettings.currency = currency;

    await therapist.save();
    res.json({ success: true, therapist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPublicTherapists = async (req, res) => {
  try {
    const therapists = await Therapist.find({ isActive: true })
      .select('name slug bio specializations profileImage languages')
      .limit(50);
    res.json({ success: true, therapists });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
