const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const proposalRequestController = require('../controllers/proposalRequestController');
const { proposalUpload, handleUploadError } = require('../middleware/proposalUploadMiddleware');

// Validation rules for proposal submission
const proposalValidation = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isIn(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']).withMessage('Invalid title'),
    body('firstName')
        .notEmpty().withMessage('First name is required')
        .trim()
        .isLength({ max: 100 }).withMessage('First name must be at most 100 characters'),
    body('lastName')
        .notEmpty().withMessage('Last name is required')
        .trim()
        .isLength({ max: 100 }).withMessage('Last name must be at most 100 characters'),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('confirmEmail')
        .notEmpty().withMessage('Confirm email is required')
        .custom((value, { req }) => {
            if (value !== req.body.email) {
                throw new Error('Emails do not match');
            }
            return true;
        }),
    body('institutionalAffiliation')
        .notEmpty().withMessage('Institutional affiliation is required')
        .trim()
        .isLength({ max: 255 }).withMessage('Institutional affiliation must be at most 255 characters'),
    body('country')
        .notEmpty().withMessage('Country is required')
        .trim(),
    body('countryCode')
        .notEmpty().withMessage('Country code is required')
        .trim(),
    body('mobileNumber')
        .notEmpty().withMessage('Mobile number is required')
        .trim()
        .isLength({ max: 20 }).withMessage('Mobile number must be at most 20 characters'),
    body('conferenceTitle')
        .notEmpty().withMessage('Conference title is required')
        .trim()
        .isLength({ max: 500 }).withMessage('Conference title must be at most 500 characters'),
    body('instituteName')
        .notEmpty().withMessage('Institute name is required')
        .trim()
        .isLength({ max: 255 }).withMessage('Institute name must be at most 255 characters'),
    body('instituteWebsite')
        .optional({ checkFalsy: true })
        .trim(),
    body('startDate')
        .notEmpty().withMessage('Start date is required')
        .isDate().withMessage('Invalid start date format'),
    body('endDate')
        .notEmpty().withMessage('End date is required')
        .isDate().withMessage('Invalid end date format')
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    body('publicationType')
        .optional()
        .isIn(['proceedings_edited', 'proceedings_only', 'edited_only'])
        .withMessage('Invalid publication type'),
    body('additionalComments')
        .optional()
        .trim()
];

// Validation for status update
const statusValidation = [
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['Pending', 'Under Review', 'Approved', 'Rejected', 'Completed'])
        .withMessage('Invalid status'),
    body('adminNotes')
        .optional()
        .trim()
];

// ==================== PUBLIC ROUTES ====================

// Submit a new proposal request (with file upload)
router.post(
    '/submit',
    proposalUpload.single('attachmentFile'),
    handleUploadError,
    proposalValidation,
    proposalRequestController.submitProposal
);

// Get proposal by proposalId (for tracking)
router.get(
    '/track/:proposalId',
    param('proposalId').notEmpty().withMessage('Proposal ID is required'),
    proposalRequestController.getProposalByProposalId
);

// Get proposals by email (for user to track their submissions)
router.get(
    '/email/:email',
    param('email').isEmail().withMessage('Invalid email format'),
    proposalRequestController.getProposalsByEmail
);

// ==================== ADMIN ROUTES ====================

// Get all proposals (with optional filters: status, email, search)
router.get('/', proposalRequestController.getAllProposals);

// Get proposal statistics
router.get('/statistics', proposalRequestController.getStatistics);

// Get single proposal by ID
router.get(
    '/:id',
    param('id').isInt().withMessage('Invalid proposal ID'),
    proposalRequestController.getProposalById
);

// Update proposal status
router.patch(
    '/:id/status',
    param('id').isInt().withMessage('Invalid proposal ID'),
    statusValidation,
    proposalRequestController.updateProposalStatus
);

// Update proposal (with optional file upload)
router.put(
    '/:id',
    proposalUpload.single('attachmentFile'),
    handleUploadError,
    param('id').isInt().withMessage('Invalid proposal ID'),
    proposalRequestController.updateProposal
);

// Delete proposal
router.delete(
    '/:id',
    param('id').isInt().withMessage('Invalid proposal ID'),
    proposalRequestController.deleteProposal
);

module.exports = router;
