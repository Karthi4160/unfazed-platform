const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Payment = require('../models/Payment');

class PDFService {
  async generateInvoice(paymentId) {
    const payment = await Payment.findById(paymentId)
      .populate('therapistId')
      .populate('clientId');

    if (!payment) throw new Error('Payment not found');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `invoice_${payment.invoiceNumber}.pdf`;
    const filepath = path.join(__dirname, '../../uploads/invoices', filename);

    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.fontSize(24).fillColor('#2c3e50').text('Unfazed', 50, 50);
    doc.fontSize(10).fillColor('#666').text('Therapy Practice Management', 50, 75);

    let y = 120;
    doc.fontSize(20).fillColor('#2c3e50').text('INVOICE', 50, y);
    y += 30;
    doc.fontSize(12).fillColor('#666')
      .text(`Invoice #: ${payment.invoiceNumber}`, 50, y)
      .text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 50, y + 20)
      .text(`Status: ${payment.status.toUpperCase()}`, 50, y + 40);

    y += 80;
    doc.fontSize(14).fillColor('#2c3e50').text('Billing Details', 50, y);
    y += 25;

    const therapist = payment.therapistId;
    const client = payment.clientId;

    doc.fontSize(10).fillColor('#666').text('From:', 50, y)
      .fontSize(11).fillColor('#333').text(therapist?.name || 'Therapist', 50, y + 15);

    doc.fontSize(10).fillColor('#666').text('To:', 300, y)
      .fontSize(11).fillColor('#333').text(client?.name || 'Client', 300, y + 15)
      .text(client?.email || '', 300, y + 30);

    y += 80;
    doc.fontSize(11).fillColor('#2c3e50')
      .text('Description', 50, y)
      .text('Amount', 400, y, { align: 'right' });

    y += 20;
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#ddd').stroke();
    y += 15;

    doc.fontSize(11).fillColor('#333')
      .text('Therapy Session', 50, y)
      .text(payment.amount.toFixed(2), 400, y, { align: 'right' });
    y += 20;

    doc.text(`Platform Fee`, 50, y)
      .text(`-${payment.platformFee.toFixed(2)}`, 400, y, { align: 'right' });

    y += 30;
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#ddd').stroke();
    y += 15;

    doc.fontSize(14).fillColor('#2c3e50')
      .text('Total Amount:', 50, y)
      .fontSize(16)
      .text(`${payment.currency} ${payment.netAmount.toFixed(2)}`, 400, y, { align: 'right' });

    doc.fontSize(9).fillColor('#999')
      .text('Thank you for your business!', 50, doc.page.height - 80)
      .text('This is a system-generated invoice.', 50, doc.page.height - 65);

    const invoiceUrl = `/uploads/invoices/${filename}`;
    payment.invoiceUrl = invoiceUrl;
    await payment.save();

    doc.end();

    return new Promise((resolve) => {
      stream.on('finish', () => resolve({ filename, filepath, invoiceUrl }));
    });
  }

  async getInvoiceStream(invoiceNumber) {
    const filename = `invoice_${invoiceNumber}.pdf`;
    const filepath = path.join(__dirname, '../../uploads/invoices', filename);
    if (!fs.existsSync(filepath)) throw new Error('Invoice not found');
    return fs.createReadStream(filepath);
  }
}

module.exports = new PDFService();
