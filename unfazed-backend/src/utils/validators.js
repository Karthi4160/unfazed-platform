const { body } = require('express-validator');

exports.registerValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ characters'),
  body('name').notEmpty().withMessage('Name required')
];

exports.loginValidation = [
  body('email').isEmail(),
  body('password').notEmpty()
];

exports.bookingValidation = [
  body('therapistId').isMongoId(),
  body('clientId').isMongoId(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601()
];

exports.noteValidation = [
  body('clientId').isMongoId(),
  body('type').isIn(['private', 'shared']),
  body('title').notEmpty(),
  body('content').notEmpty()
];
