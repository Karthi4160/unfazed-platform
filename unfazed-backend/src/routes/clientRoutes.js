const express = require('express');
const router = express.Router();
const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  submitIntake,
  captureConsent,
  getClientProfile
} = require('../controllers/clientController');
const { protect, protectAny } = require('../middleware/auth');
const { checkCap } = require('../middleware/entitlement');

// ---------- CLIENT OR THERAPIST ----------
router.get('/:clientId', protectAny, getClient);
router.get('/:clientId/profile', protectAny, getClientProfile);
router.post('/:clientId/intake', protectAny, submitIntake);
router.post('/:clientId/consent', protectAny, captureConsent);

// ---------- THERAPIST ONLY ----------
router.use(protect);
router.post('/', checkCap('clientsPerMonth'), createClient);
router.get('/', getClients);
router.put('/:clientId', updateClient);
router.delete('/:clientId', deleteClient);

module.exports = router;