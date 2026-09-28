const express = require('express');
const router = express.Router();
const {
  createNote, getClientNotes, getNote, updateNote,
  archiveNote, deleteNote, getNoteTemplates
} = require('../controllers/noteController');
const { protect, protectAny } = require('../middleware/auth');
const { checkEntitlement } = require('../middleware/entitlement');

// Get client notes (both therapist and client can view — controller decides what's visible)
router.get('/client/:clientId', protectAny, getClientNotes);

// Everything below needs therapist auth
router.use(protect);

router.get('/templates', checkEntitlement('noteTemplates'), getNoteTemplates);
router.post('/', checkEntitlement('noteTemplates'), createNote);
router.get('/:noteId', getNote);
router.put('/:noteId', updateNote);
router.patch('/:noteId/archive', archiveNote);
router.delete('/:noteId', deleteNote);

module.exports = router;