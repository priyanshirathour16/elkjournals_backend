const { ConferenceRegistration, Conference } = require('../models');
const { validationResult } = require('express-validator');

exports.createRegistration = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const data = req.body;

        // Basic validation for existence of Conference
        const conference = await Conference.findByPk(data.conferenceId);
        if (!conference) {
            return res.status(404).json({ message: 'Conference not found' });
        }

        const registration = await ConferenceRegistration.create(data);
        res.status(201).json({
            message: 'Registration successful',
            data: registration
        });
    } catch (error) {
        console.error('Error creating registration:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllRegistrations = async (req, res) => {
    try {
        const registrations = await ConferenceRegistration.findAll({
            include: [{ model: Conference, as: 'conference', attributes: ['name'] }]
        });
        res.status(200).json({ data: registrations });
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getRegistrationsByConferenceId = async (req, res) => {
    try {
        const { conferenceId } = req.params;
        const registrations = await ConferenceRegistration.findAll({
            where: { conferenceId },
            include: [{ model: Conference, as: 'conference', attributes: ['name'] }]
        });
        res.status(200).json({ data: registrations });
    } catch (error) {
        console.error('Error fetching conference registrations:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getRegistrationById = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await ConferenceRegistration.findByPk(id, {
            include: [{ model: Conference, as: 'conference', attributes: ['name'] }]
        });

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        res.status(200).json({ data: registration });
    } catch (error) {
        console.error('Error fetching registration:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const registration = await ConferenceRegistration.findByPk(id);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        await registration.update(data);
        res.status(200).json({
            message: 'Registration updated successfully',
            data: registration
        });
    } catch (error) {
        console.error('Error updating registration:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await ConferenceRegistration.findByPk(id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        await registration.destroy(); // Soft delete because paranoid: true is set in model
        res.status(200).json({ message: 'Registration deleted successfully' });
    } catch (error) {
        console.error('Error deleting registration:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
