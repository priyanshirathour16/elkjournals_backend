const express = require('express');
const router = express.Router();
const abstractSubmissionController = require('../controllers/abstractSubmissionController');
const upload = require('../middleware/uploadMiddleware');
/* const authMiddleware = require('../middleware/authMiddleware'); */
/* const roleMiddleware = require('../middleware/roleMiddleware'); */

// POST: Submit Abstract
// Data: conference_id, abstract (file)
router.post('/submit-abstract', upload.single('abstract'), abstractSubmissionController.submitAbstract);

// PUT: Update Status (Admin)
// Data: status (Pending, Approved, Rejected)
// Uncomment middleware to secure this endpoint
// router.put('/update-status/:id', authMiddleware, roleMiddleware, abstractSubmissionController.updateStatus);
router.put('/update-status/:id', abstractSubmissionController.updateStatus);

// GET: Get Abstracts by Author
router.get('/author/:authorId', abstractSubmissionController.getAbstractsByAuthor);

// GET: Get All Abstracts
router.get('/', abstractSubmissionController.getAllAbstracts);

module.exports = router;
