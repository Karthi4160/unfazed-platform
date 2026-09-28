const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register, login, getMe, updateProfile,
  changePassword, getPublicProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile/:slug', getPublicProfile);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;

// ============= CLIENT AUTH ROUTES =============
const clientController = require('../controllers/clientController');
const { protectClient } = require('../middleware/auth');

router.post('/client/register', clientController.clientRegister);
router.post('/client/login', clientController.clientLogin);
router.get('/client/me', protectClient, clientController.getClientMe);
