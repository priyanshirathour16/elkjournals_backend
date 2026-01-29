const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const editorApplicationController = require('../controllers/editorApplicationController');
const documentUpload = require('../middleware/documentUploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post(
    '/',
    documentUpload.single('file'), // 'file' matches the curl form-data name
    [
        body('firstName').notEmpty().withMessage('First Name is required'),
        body('lastName').notEmpty().withMessage('Last Name is required'),
        body('email').isEmail().withMessage('Please enter a valid email').trim().toLowerCase(),
        body('confirmEmail').custom((value, { req }) => {
            if (value !== req.body.email) {
                throw new Error('Email confirmation does not match email');
            }
            return true;
        }),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        }),
        body('journal').notEmpty().withMessage('Journal is required'),
    ],
    editorApplicationController.submitApplication
);

// API 2: GET available editors (Admin)
router.get('/editors', authMiddleware, roleMiddleware, editorApplicationController.getEditors);

// Admin only routes
router.get('/', authMiddleware, roleMiddleware, editorApplicationController.getAllApplications);

// Get editor applications by journal ID
router.get('/journal/:journalId', authMiddleware, roleMiddleware, editorApplicationController.getApplicationsByJournalId);

// Update editor application status (approve/reject)
router.patch('/:id/status', authMiddleware, roleMiddleware, editorApplicationController.updateApplicationStatus);

// Toggle editor active/inactive status
router.patch('/:id/active', authMiddleware, roleMiddleware, editorApplicationController.toggleActiveStatus);

router.get('/:id', authMiddleware, roleMiddleware, editorApplicationController.getApplicationById);
router.delete('/:id', authMiddleware, roleMiddleware, editorApplicationController.deleteApplication);

module.exports = router;
