const Availability = require('../models/Availability');

exports.getAvailability = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    let availability = await Availability.findOne({ therapistId });

    if (!availability) {
      availability = new Availability({
        therapistId,
        weeklyTemplate: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true }
        ]
      });
      await availability.save();
    }

    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateWeeklyTemplate = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const availability = await Availability.findOneAndUpdate(
      { therapistId },
      { weeklyTemplate: req.body.weeklyTemplate },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addOverride = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const availability = await Availability.findOne({ therapistId });
    if (!availability) return res.status(404).json({ message: 'Not found' });

    availability.overrides.push(req.body);
    await availability.save();
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeOverride = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const availability = await Availability.findOneAndUpdate(
      { therapistId },
      { $pull: { overrides: { _id: req.params.overrideId } } },
      { new: true }
    );
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addBlockedSlot = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const availability = await Availability.findOne({ therapistId });
    if (!availability) return res.status(404).json({ message: 'Not found' });

    availability.blockedSlots.push(req.body);
    await availability.save();
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeBlockedSlot = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const availability = await Availability.findOneAndUpdate(
      { therapistId },
      { $pull: { blockedSlots: { _id: req.params.slotId } } },
      { new: true }
    );
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
