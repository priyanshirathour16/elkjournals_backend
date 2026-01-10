const express = require('express');
const router = express.Router();
const copyrightController = require('../controllers/copyrightController');

// Get the active copyright template schema
// GET /api/copyright/template/active
router.get('/template/active', copyrightController.getActiveTemplate);

// Submit copyright agreement
// POST /api/copyright/submit
router.post('/submit', copyrightController.submitCopyright);

// Get copyright submission by manuscript ID (with template used at signing)
// GET /api/copyright/submission/:manuscript_id
router.get('/submission/:manuscript_id', copyrightController.getSubmission);

// Get manuscript details for copyright form rendering (with authors)
// GET /api/copyright/manuscript/:manuscript_id
router.get('/manuscript/:manuscript_id', copyrightController.getManuscriptForCopyright);

module.exports = router;
