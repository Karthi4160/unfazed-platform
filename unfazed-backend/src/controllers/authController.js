const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');
const { validationResult } = require('express-validator');
const slugify = require('../utils/generateSlug');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, specializations, languages } = req.body;

    const existing = await Therapist.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Therapist already exists' });

    let slug = slugify(name);
    let uniqueSlug = slug;
    let counter = 1;
    while (await Therapist.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter++}`;
    }

    const therapist = await Therapist.create({
      email,
      passwordHash: password,
      name,
      slug: uniqueSlug,
      specializations: specializations || [],
      languages: languages || [],
      settings: {
        timezone: req.body.timezone || 'UTC',
        paymentSettings: { sessionRate: req.body.sessionRate || 1000 }
      }
    });

    const token = generateToken(therapist._id);
    res.status(201).json({
      success: true,
      token,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        specializations: therapist.specializations,
        profileUrl: `${process.env.CLIENT_URL}/${therapist.slug}`
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const therapist = await Therapist.findOne({ email });
    if (!therapist) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await therapist.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(therapist._id);
    res.json({
      success: true,
      token,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        specializations: therapist.specializations,
        subscriptionTier: therapist.subscriptionTier,
        profileUrl: `${process.env.CLIENT_URL}/${therapist.slug}`
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.therapist._id).select('-passwordHash');
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });
    res.json({ success: true, therapist });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.passwordHash;
    delete updates.email;
    delete updates._id;

    const therapist = await Therapist.findById(req.therapist._id);
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });

    if (updates.name && updates.name !== therapist.name) {
      let slug = slugify(updates.name);
      let uniqueSlug = slug;
      let counter = 1;
      while (await Therapist.findOne({ slug: uniqueSlug, _id: { $ne: therapist._id } })) {
        uniqueSlug = `${slug}-${counter++}`;
      }
      updates.slug = uniqueSlug;
    }

    const updated = await Therapist.findByIdAndUpdate(
      req.therapist._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({ success: true, therapist: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const therapist = await Therapist.findById(req.therapist._id);
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });

    const isMatch = await therapist.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    therapist.passwordHash = newPassword;
    await therapist.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const therapist = await Therapist.findOne({ slug: req.params.slug, isActive: true })
      .select('-passwordHash -__v');
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });

    res.json({
      success: true,
      therapist: {
        id: therapist._id,
        name: therapist.name,
        slug: therapist.slug,
        bio: therapist.bio,
        profileImage: therapist.profileImage,
        specializations: therapist.specializations,
        languages: therapist.languages,
        credentials: therapist.credentials,
        yearsOfExperience: therapist.yearsOfExperience,
        sessionDuration: therapist.sessionDuration,
        settings: therapist.settings,
        createdAt: therapist.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
