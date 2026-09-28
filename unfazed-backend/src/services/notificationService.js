const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

class NotificationService {
  constructor() {
    this.transporter = null;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
    }
  }

  async createNotification({ userId, userModel, type, title, message, data = {}, channels = ['in-app'], priority = 'medium', actionUrl = null }) {
    const notification = new Notification({
      userId, userModel, type, title, message, data, channels, priority, actionUrl
    });
    await notification.save();
    await this.sendThroughChannels(notification);
    return notification;
  }

  async sendThroughChannels(notification) {
    const promises = [];
    if (notification.channels.includes('email') && this.transporter) {
      promises.push(this.sendEmail(notification));
    }
    if (notification.channels.includes('sms')) promises.push(this.sendSMS(notification));
    if (notification.channels.includes('push')) promises.push(this.sendPush(notification));
    await Promise.all(promises);
  }

  async sendEmail(notification) {
    try {
      let userEmail = null, userName = 'User';
      if (notification.userModel === 'Therapist') {
        const Therapist = require('../models/Therapist');
        const user = await Therapist.findById(notification.userId);
        if (user) { userEmail = user.email; userName = user.name; }
      } else if (notification.userModel === 'Client') {
        const Client = require('../models/Client');
        const user = await Client.findById(notification.userId);
        if (user) { userEmail = user.email; userName = user.name; }
      }
      if (!userEmail) return;

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: notification.title,
        html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;">
          <h2>${notification.title}</h2>
          <p>Hello ${userName},</p>
          <p>${notification.message}</p>
          ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="display:inline-block;padding:10px 20px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:5px;">View Details</a>` : ''}
        </div>`
      });

      notification.delivered = true;
      notification.deliveredAt = new Date();
      notification.sentAt = new Date();
      await notification.save();
    } catch (error) {
      console.error('Email send error:', error);
    }
  }

  async sendSMS(notification) {
    console.log('ðŸ“± SMS stub:', { message: notification.message });
  }

  async sendPush(notification) {
    console.log('ðŸ“² Push stub:', { title: notification.title });
  }

  async handleBookingConfirmed(booking) {
    const Therapist = require('../models/Therapist');
    const therapist = await Therapist.findById(booking.therapistId);

    await this.createNotification({
      userId: booking.clientId,
      userModel: 'Client',
      type: 'booking_confirmed',
      title: 'Booking Confirmed!',
      message: `Your session with ${therapist?.name} on ${new Date(booking.startTime).toLocaleString()} has been confirmed.`,
      channels: ['in-app', 'email'],
      actionUrl: `${process.env.CLIENT_URL}/client/sessions`
    });

    await this.createNotification({
      userId: booking.therapistId,
      userModel: 'Therapist',
      type: 'booking_confirmed',
      title: 'New Booking',
      message: `A new booking has been confirmed for ${new Date(booking.startTime).toLocaleString()}`,
      channels: ['in-app', 'email']
    });
  }

  async handlePaymentSuccess(payment) {
    await this.createNotification({
      userId: payment.clientId,
      userModel: 'Client',
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Your payment of â‚¹${payment.amount} has been processed. Invoice #${payment.invoiceNumber}`,
      channels: ['in-app', 'email']
    });
  }

  async handleNoteShared(note, therapistName) {
    await this.createNotification({
      userId: note.clientId,
      userModel: 'Client',
      type: 'note_shared',
      title: 'New Session Note',
      message: `${therapistName} has shared a new session note with you.`,
      channels: ['in-app'],
      actionUrl: `${process.env.CLIENT_URL}/client/notes`
    });
  }
}

module.exports = new NotificationService();
