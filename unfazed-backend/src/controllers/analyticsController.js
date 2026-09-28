const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Payment = require('../models/Payment');

exports.getStats = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalClients, upcomingSessions, revenueAgg, totalBookings, noShowCount] = await Promise.all([
      Client.countDocuments({ therapistId, isActive: true }),
      Booking.countDocuments({
        therapistId,
        status: { $in: ['confirmed', 'pending'] },
        startTime: { $gte: now }
      }),
      Payment.aggregate([
        { $match: {
          therapistId: new mongoose.Types.ObjectId(therapistId),
          status: 'paid',
          createdAt: { $gte: monthStart }
        } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Booking.countDocuments({ therapistId, startTime: { $gte: monthStart } }),
      Booking.countDocuments({
        therapistId, status: 'no-show',
        startTime: { $gte: monthStart }
      })
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const noShowRate = totalBookings > 0
      ? Math.round((noShowCount / totalBookings) * 100) : 0;

    res.json({ totalClients, upcomingSessions, revenue, noShowRate });
  } catch (error) {
    console.error('Analytics stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRevenueTrend = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const data = await Payment.aggregate([
      { $match: {
        therapistId: new mongoose.Types.ObjectId(therapistId),
        status: 'paid'
      } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$amount' },
        netRevenue: { $sum: '$netAmount' },
        count: { $sum: 1 }
      } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    res.json(data.map(d => ({
      month: `${months[d._id.month - 1]} ${d._id.year}`,
      revenue: d.revenue,
      netRevenue: d.netRevenue,
      count: d.count
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSessionDistribution = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const data = await Booking.aggregate([
      { $match: { therapistId: new mongoose.Types.ObjectId(therapistId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(data.map(d => ({ name: d._id || 'unknown', value: d.count })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getActiveClientsTrend = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const now = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = await Client.countDocuments({
        therapistId,
        createdAt: { $lte: monthEnd },
        isActive: true
      });
      data.push({
        month: months[monthEnd.getMonth()],
        clients: count
      });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNoShowRateTrend = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const data = await Booking.aggregate([
      { $match: {
        therapistId: new mongoose.Types.ObjectId(therapistId),
        startTime: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
      } },
      { $group: {
        _id: { year: { $year: '$startTime' }, month: { $month: '$startTime' } },
        total: { $sum: 1 },
        noShows: { $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] } }
      } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    res.json(data.map(d => ({
      month: months[d._id.month - 1],
      rate: d.total > 0 ? Math.round((d.noShows / d.total) * 100) : 0
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
