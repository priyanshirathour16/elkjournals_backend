const { validationResult } = require('express-validator');
const editorApplicationService = require('../services/EditorApplicationService');
const { EditorApplication } = require('../models');
const { decrypt } = require('../utils/encryption');

exports.submitApplication = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const applicationData = req.body;

        // Handle file upload
        if (req.file) {
            applicationData.cvFile = req.file.path;
        }

        const result = await editorApplicationService.submitApplication(applicationData);

        // Don't simplify return too much, returning the created object is fine but omit password
        const { password, ...resultWithoutPassword } = result.toJSON();

        res.status(201).json({
            message: 'Editor application submitted successfully',
            application: resultWithoutPassword
        });
    } catch (error) {
        if (error.message === 'Application with this email already exists') {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === 'Passwords do not match') {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

exports.getAllApplications = async (req, res, next) => {
    try {
        const applications = await editorApplicationService.getAllApplications();
        const formattedApplications = applications.map(app => {
            const appJson = app.toJSON();
            return {
                ...appJson,
                journal: app.journalData ? app.journalData.title : 'N/A'
            };
        });
        res.json(formattedApplications);
    } catch (error) {
        next(error);
    }
};

exports.getApplicationById = async (req, res, next) => {
    try {
        const application = await editorApplicationService.getApplicationById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        const appJson = application.toJSON();
        const formattedApplication = {
            ...appJson,
            journal: application.journalData ? application.journalData.title : 'N/A'
        };
        res.json(formattedApplication);
    } catch (error) {
        if (error.message === 'Application not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

exports.deleteApplication = async (req, res, next) => {
    try {
        await editorApplicationService.deleteApplication(req.params.id);
        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        if (error.message === 'Application not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

// API 2: Get available editors (Admin)
exports.getEditors = async (req, res, next) => {
    try {
        const editors = await EditorApplication.findAll({
            where: { status: 'approved' },
            attributes: ['id', 'firstName', 'lastName', 'email', 'specialization'],
        });

        const data = editors.map(e => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`,
            email: e.email,
            specialization: e.specialization,
        }));

        res.json({ success: true, data, message: 'Editors fetched successfully' });
    } catch (error) {
        next(error);
    }
};

// API: Get editor applications by journal ID
exports.getApplicationsByJournalId = async (req, res, next) => {
    try {
        // Decrypt the journalId as it comes encrypted from frontend
        const decryptedJournalId = decrypt(req.params.journalId);
        const applications = await EditorApplication.findAll({
            where: { journal_id: decryptedJournalId },
            order: [['updatedAt', 'DESC']],
        });
        res.json(applications);
    } catch (error) {
        if (error.message === 'Invalid encrypted ID') {
            return res.status(400).json({ message: 'Invalid journal ID' });
        }
        next(error);
    }
};

// API: Update editor application status (approve/reject)
exports.updateApplicationStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected' });
        }

        const application = await EditorApplication.findByPk(id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        await application.update({ status });

        res.json({
            success: true,
            message: `Editor application ${status} successfully`,
            application: application.toJSON()
        });
    } catch (error) {
        next(error);
    }
};

// API: Toggle editor active/inactive status
exports.toggleActiveStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ message: 'is_active must be a boolean value' });
        }

        const application = await EditorApplication.findByPk(id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        await application.update({ is_active });

        res.json({
            success: true,
            message: `Editor ${is_active ? 'activated' : 'deactivated'} successfully`,
            application: application.toJSON()
        });
    } catch (error) {
        next(error);
    }
};
