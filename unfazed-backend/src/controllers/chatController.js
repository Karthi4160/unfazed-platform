const ChatMessage = require('../models/ChatMessage');

exports.getConversation = async (req, res) => {
  try {
    const { otherUserId, otherUserType } = req.query;
    const userId = req.therapist._id;
    const userType = 'Therapist';

    const messages = await ChatMessage.find({
      $or: [
        { fromUserId: userId, fromUserModel: userType, toUserId: otherUserId, toUserModel: otherUserType },
        { fromUserId: otherUserId, fromUserModel: otherUserType, toUserId: userId, toUserModel: userType }
      ]
    }).sort({ createdAt: 1 }).limit(200);

    await ChatMessage.updateMany(
      { toUserId: userId, toUserModel: userType, fromUserId: otherUserId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Client-side conversation getter
exports.getClientConversation = async (req, res) => {
  try {
    const { otherUserId, otherUserType } = req.query;
    const userId = req.client._id;
    const userType = 'Client';

    const messages = await ChatMessage.find({
      $or: [
        { fromUserId: userId, fromUserModel: userType, toUserId: otherUserId, toUserModel: otherUserType },
        { fromUserId: otherUserId, fromUserModel: otherUserType, toUserId: userId, toUserModel: userType }
      ]
    }).sort({ createdAt: 1 }).limit(200);

    await ChatMessage.updateMany(
      { toUserId: userId, toUserModel: userType, fromUserId: otherUserId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get client conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.sendMessage = async (req, res) => {
  try {
    const { toUserId, toUserType, message, type = 'text' } = req.body;
    const fromUserId = req.therapist._id;

    const chatMessage = new ChatMessage({
      fromUserId, fromUserModel: 'Therapist',
      toUserId, toUserModel: toUserType,
      message, type
    });
    await chatMessage.save();

    res.status(201).json({ success: true, message: chatMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.therapist._id);

    const conversations = await ChatMessage.aggregate([
      { $match: { $or: [
        { fromUserId: userId, fromUserModel: 'Therapist' },
        { toUserId: userId, toUserModel: 'Therapist' }
      ] } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: { $cond: [{ $eq: ['$fromUserId', userId] }, '$toUserId', '$fromUserId'] },
        lastMessage: { $first: '$$ROOT' }
      } }
    ]);

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await ChatMessage.countDocuments({
      toUserId: req.therapist._id,
      toUserModel: 'Therapist',
      read: false
    });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
