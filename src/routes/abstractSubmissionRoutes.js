const express = require('express');
const router = express.Router();
const abstractSubmissionController = require('../controllers/abstractSubmissionController');
const upload = require('../middleware/uploadMiddleware');
const fullPaperUpload = require('../middleware/fullPaperUploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const editorMiddleware = require('../middleware/editorMiddleware');
const authorMiddleware = require('../middleware/authorMiddleware');

// ─── Existing routes ───

// POST: Submit Abstract (public / author)
router.post('/submit-abstract', upload.single('abstract'), abstractSubmissionController.submitAbstract);

// PUT: Update Status (Admin) — legacy
router.put('/update-status/:id', abstractSubmissionController.updateStatus);

// ─── New routes (static paths before parameterized) ───

// API 9: GET accepted abstracts for author (Author — must be before /author/:authorId)
router.get('/author/accepted', authMiddleware, authorMiddleware, abstractSubmissionController.getAuthorAcceptedAbstracts);

// GET: Get Abstracts by Author (by param)
router.get('/author/:authorId', abstractSubmissionController.getAbstractsByAuthor);

// API 6: GET abstracts assigned to editor (Editor)
router.get('/editor/assigned', authMiddleware, editorMiddleware, abstractSubmissionController.getEditorAssignedAbstracts);

// API 1: GET abstracts by conference (Admin)
router.get('/conference/:conferenceId', authMiddleware, roleMiddleware, abstractSubmissionController.getAbstractsByConference);

// API 3: POST assign editor — Stage 1 (Admin)
router.post('/:abstractId/assign-editor', authMiddleware, roleMiddleware, abstractSubmissionController.assignEditor);

// API 4: POST assign conference editor — Stage 2 (Admin)
router.post('/:abstractId/assign-conference-editor', authMiddleware, roleMiddleware, abstractSubmissionController.assignConferenceEditor);

// API 5: POST admin final decision — Stage 3 (Admin)
router.post('/:abstractId/admin-decision', authMiddleware, roleMiddleware, abstractSubmissionController.adminDecision);

// API 7+8: POST editor review accept/reject (Editor)
router.post('/:abstractId/review', authMiddleware, editorMiddleware, abstractSubmissionController.editorReview);

// API 10: POST submit full paper files (Author — multipart)
router.post('/:abstractId/full-paper', authMiddleware, authorMiddleware, fullPaperUpload.array('files', 10), abstractSubmissionController.submitFullPaper);

// GET: Get All Abstracts (legacy)
router.get('/', abstractSubmissionController.getAllAbstracts);

module.exports = router;
