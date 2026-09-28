const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');

const checkDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database temporarily unavailable. Please try again.' });
    return false;
  }
  return true;
};

const protect = async (req, res, next) => {
  try {
    if (!checkDB(res)) return;

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.therapist = await Therapist.findById(decoded.id).select('-passwordHash');
    if (!req.therapist) return res.status(401).json({ message: 'Not authorized, therapist not found' });
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const protectClient = async (req, res, next) => {
  try {
    if (!checkDB(res)) return;

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.client = await Client.findById(decoded.id).select('-passwordHash');
    if (!req.client) return res.status(401).json({ message: 'Client not found' });
    next();
  } catch (error) {
    console.error('Client auth error:', error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const protectAny = async (req, res, next) => {
  try {
    if (!checkDB(res)) return;

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const therapist = await Therapist.findById(decoded.id).select('-passwordHash');
    if (therapist) {
      req.therapist = therapist;
      req.userType = 'therapist';
      return next();
    }

    const client = await Client.findById(decoded.id).select('-passwordHash');
    if (client) {
      req.client = client;
      req.userType = 'client';
      return next();
    }

    return res.status(401).json({ message: 'User not found' });
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect, protectClient, protectAny };