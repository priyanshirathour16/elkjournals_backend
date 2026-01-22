const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const conferenceRegistrationController = require('../controllers/conferenceRegistrationController');

// Validation rules
const registrationValidation = [
    check('title', 'Title is required').not().isEmpty(),
    check('firstName', 'First Name is required').not().isEmpty(),
    check('lastName', 'Last Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('confirmEmail', 'Emails do not match').custom((value, { req }) => {
        if (value !== req.body.email) {
            throw new Error('Emails do not match');
        }
        return true;
    }),
    check('mobile', 'Mobile number is required').not().isEmpty(),
    check('conferenceId', 'Conference ID is required').not().isEmpty(),
    check('terms', 'You must accept the terms and conditions').custom((value) => {
        return value === 'true' || value === true;
    })
];

// Routes
router.post('/', registrationValidation, conferenceRegistrationController.createRegistration);
router.get('/', conferenceRegistrationController.getAllRegistrations);
router.get('/:id', conferenceRegistrationController.getRegistrationById);
router.get('/conference/:conferenceId', conferenceRegistrationController.getRegistrationsByConferenceId);
router.put('/:id', conferenceRegistrationController.updateRegistration);
router.delete('/:id', conferenceRegistrationController.deleteRegistration);

module.exports = router;
