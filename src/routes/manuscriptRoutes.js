const express = require('express');
const router = express.Router();
const manuscriptController = require('../controllers/manuscriptController');
const manuscriptUpload = require('../middleware/manuscriptUploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Manuscript submission route (public - allows anyone to submit)
router.post(
    '/submit',
    manuscriptUpload.fields([
        { name: 'manuscriptFile', maxCount: 1 },
        { name: 'coverLetter', maxCount: 1 }
    ]),
    manuscriptController.submitManuscript
);

// Get all manuscripts with optional status filter (admin only)
router.get('/', authMiddleware, roleMiddleware, manuscriptController.getAllManuscripts);
router.get('/new-manuscript/:id', manuscriptController.getNewManuscriptDetails); // New endpoint
router.get('/author/:authorId', manuscriptController.getManuscriptsByAuthor);
router.get('/:id', manuscriptController.getManuscriptById);
router.patch('/:id/status', manuscriptController.updateManuscriptStatus);

module.exports = router;
