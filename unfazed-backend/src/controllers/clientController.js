const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const SessionNote = require('../models/SessionNote');
const Therapist = require('../models/Therapist');
const entitlementService = require('../services/entitlementService');

// ============ THERAPIST-SIDE METHODS ============

exports.createClient = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const canAdd = await entitlementService.checkCap(therapistId, 'maxActiveClients');
    if (!canAdd) {
      return res.status(403).json({
        message: 'Active client limit reached. Please upgrade your plan.',
        requiresUpgrade: true
      });
    }

    const client = new Client({ therapistId, ...req.body });
    await client.save();
    res.status(201).json({ success: true, client });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getClients = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const { status, tag, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const query = { therapistId, isActive: true };
    if (status) query.status = status;
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const clients = await Client.find(query).sort({ [sortBy]: order === 'desc' ? -1 : 1 });
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getClient = async (req, res) => {
  try {
    // Client requesting their own data
    if (req.client) {
      if (req.params.clientId !== req.client._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const client = await Client.findById(req.client._id)
        .select('-passwordHash')
        .populate('therapistId', 'name slug profileImage email');
      return res.json({ success: true, client });
    }

    // Therapist requesting one of their clients
    if (req.therapist) {
      const client = await Client.findOne({
        _id: req.params.clientId,
        therapistId: req.therapist._id
      });
      if (!client) return res.status(404).json({ message: 'Client not found' });
      return res.json({ success: true, client });
    }

    return res.status(401).json({ message: 'Not authorized' });
  } catch (error) {
    console.error('getClient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.clientId, therapistId: req.therapist._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ success: true, client });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.clientId, therapistId: req.therapist._id },
      { isActive: false },
      { new: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ success: true, message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.submitIntake = async (req, res) => {
  try {
    const { clientId } = req.params;

    // If a client is logged in, they can only update their own intake
    if (req.client && clientId !== req.client._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Ensure intake subobjects exist before merging
    if (!client.intake) client.intake = {};
    if (!client.intake.emergencyContact) client.intake.emergencyContact = {};
    if (!client.intake.demographics) client.intake.demographics = {};
    if (!client.intake.consent) client.intake.consent = {};

    // Deep merge: only overwrite fields present in req.body
    const allowedFields = ['presentingConcern', 'history', 'medications', 'allergies'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        client.intake[field] = req.body[field];
      }
    });

    // Handle nested objects if provided
    if (req.body.emergencyContact && typeof req.body.emergencyContact === 'object') {
      Object.keys(req.body.emergencyContact).forEach(k => {
        client.intake.emergencyContact[k] = req.body.emergencyContact[k];
      });
    }
    if (req.body.demographics && typeof req.body.demographics === 'object') {
      Object.keys(req.body.demographics).forEach(k => {
        client.intake.demographics[k] = req.body.demographics[k];
      });
    }

    client.status = 'active';
    await client.save();

    res.json({ success: true, client });
  } catch (error) {
    console.error('submitIntake error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.captureConsent = async (req, res) => {
  try {
    const { clientId } = req.params;

    // If a client is logged in, they can only sign their own consent
    if (req.client && clientId !== req.client._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Ensure intake and consent objects exist
    if (!client.intake) client.intake = {};
    if (!client.intake.consent) client.intake.consent = {};

    client.intake.consent.signed = true;
    client.intake.consent.signedAt = new Date();
    client.intake.consent.version = req.body.version || '1.0';

    await client.save();

    res.json({
      success: true,
      message: 'Consent captured',
      consent: client.intake.consent
    });
  } catch (error) {
    console.error('captureConsent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getClientProfile = async (req, res) => {
  try {
    const { clientId } = req.params;
    const therapistId = req.therapist._id;
    const client = await Client.findOne({ _id: clientId, therapistId });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const [bookings, payments, notes] = await Promise.all([
      Booking.find({ clientId, therapistId }).sort({ startTime: -1 }).limit(20),
      Payment.find({ clientId, therapistId }).sort({ createdAt: -1 }).limit(20),
      SessionNote.find({ clientId, therapistId }).sort({ sessionDate: -1 }).limit(20)
    ]);

    res.json({ success: true, client, bookings, payments, notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============ CLIENT-SIDE AUTH ============

const generateClientToken = (id) => {
  return jwt.sign({ id, userType: 'client' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

exports.clientRegister = async (req, res) => {
  try {
    const { name, email, password, phone, therapistSlug } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Find therapist
    let therapist;
    if (therapistSlug) {
      therapist = await Therapist.findOne({ slug: therapistSlug });
    } else {
      therapist = await Therapist.findOne({ isActive: true });
    }
    if (!therapist) {
      return res.status(404).json({ message: 'No therapist available' });
    }

    // Check for existing client
    const existing = await Client.findOne({ therapistId: therapist._id, email });
    if (existing) {
      return res.status(400).json({ message: 'Client already exists with this email' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create client
    const client = new Client({
      therapistId: therapist._id,
      name,
      email,
      phone: phone || '',
      status: 'waiting',
      passwordHash
    });

    await client.save();

    const token = generateClientToken(client._id);

    res.status(201).json({
      success: true,
      token,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        therapistId: client.therapistId,
        userType: 'client'
      }
    });
  } catch (error) {
    console.error('Client register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.clientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // IMPORTANT: explicitly select passwordHash
    const client = await Client.findOne({ email }).select('+passwordHash');
    if (!client) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!client.passwordHash) {
      return res.status(401).json({
        message: 'This client account has no password set. Contact your therapist.'
      });
    }

    const isMatch = await bcrypt.compare(password, client.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateClientToken(client._id);

    res.json({
      success: true,
      token,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        therapistId: client.therapistId,
        userType: 'client'
      }
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getClientMe = async (req, res) => {
  try {
    const client = await Client.findById(req.client._id)
      .populate('therapistId', 'name slug profileImage');
    if (!client) return res.status(404).json({ message: 'Client not found' });

    res.json({
      success: true,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        therapistId: client.therapistId,
        userType: 'client',
        status: client.status,
        intake: client.intake
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};