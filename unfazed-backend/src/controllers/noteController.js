const SessionNote = require('../models/SessionNote');
const Therapist = require('../models/Therapist');
const NotificationService = require('../services/notificationService');

exports.createNote = async (req, res) => {
  try {
    const { clientId, bookingId, type, title, content, structuredFormat, sessionDate, duration, tags, mood, progress } = req.body;
    const therapistId = req.therapist._id;

    const note = new SessionNote({
      therapistId, clientId, bookingId, type, title, content,
      structuredFormat,
      sessionDate: sessionDate || new Date(),
      duration, tags, mood, progress,
      isArchived: false
    });
    await note.save();

    if (type === 'shared') {
      const therapist = await Therapist.findById(therapistId);
      await NotificationService.handleNoteShared(note, therapist.name);
    }

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getClientNotes = async (req, res) => {
  try {
    const { clientId } = req.params;
    const therapistId = req.therapist?._id;
    const isClientRequest = !!req.client;
    const { type, limit = 50, page = 1 } = req.query;

    const query = { clientId };

    // If therapist, filter by their therapistId
    if (therapistId) {
      query.therapistId = therapistId;
    }

    // If client requesting, ONLY return shared notes
    if (isClientRequest) {
      query.type = 'shared';
      // Ensure the client is requesting their own notes
      if (clientId !== req.client._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      SessionNote.find(query)
        .sort({ sessionDate: -1 })
        .skip(skip).limit(parseInt(limit)),
      SessionNote.countDocuments(query)
    ]);

    res.json({
      success: true,
      notes,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get client notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNote = async (req, res) => {
  try {
    const note = await SessionNote.findById(req.params.noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const note = await SessionNote.findById(req.params.noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (note.therapistId.toString() !== therapistId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await SessionNote.findByIdAndUpdate(
      req.params.noteId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (req.body.type === 'shared' && note.type !== 'shared') {
      const therapist = await Therapist.findById(therapistId);
      await NotificationService.handleNoteShared(updated, therapist.name);
    }

    res.json({ success: true, note: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.archiveNote = async (req, res) => {
  try {
    const note = await SessionNote.findById(req.params.noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.therapistId.toString() !== req.therapist._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    note.isArchived = true;
    await note.save();
    res.json({ success: true, message: 'Note archived', note });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await SessionNote.findById(req.params.noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.therapistId.toString() !== req.therapist._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await SessionNote.findByIdAndDelete(req.params.noteId);
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNoteTemplates = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const entitlementService = require('../services/entitlementService');

    const templates = [{ id: 'freeform', name: 'Freeform', description: 'Flexible note taking' }];

    const hasSOAP = await entitlementService.canAccess(therapistId, 'noteTemplates.SOAP');
    if (hasSOAP) {
      templates.push({
        id: 'SOAP', name: 'SOAP Format',
        description: 'Subjective, Objective, Assessment, Plan',
        structure: ['Subjective', 'Objective', 'Assessment', 'Plan']
      });
    }

    const hasDAP = await entitlementService.canAccess(therapistId, 'noteTemplates.DAP');
    if (hasDAP) {
      templates.push({
        id: 'DAP', name: 'DAP Format',
        description: 'Data, Assessment, Plan',
        structure: ['Data', 'Assessment', 'Plan']
      });
    }

    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
