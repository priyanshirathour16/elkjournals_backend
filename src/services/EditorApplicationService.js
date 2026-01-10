const editorApplicationRepository = require('../repositories/EditorApplicationRepository');
const authorRepository = require('../repositories/AuthorRepository');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');
const { editorWelcomeTemplate } = require('../utils/emailTemplates');

class EditorApplicationService {
    async submitApplication(data) {
        if (data.journal) {
            data.journal_id = data.journal;
            delete data.journal;
        }

        // Check if email already exists in EditorApplication
        const existingApplication = await editorApplicationRepository.findByEmail(data.email);

        // Check if email already exists in Author
        const existingAuthor = await authorRepository.findByEmail(data.email);
        if (existingAuthor) {
            throw new Error('Email is already registered as an author');
        }

        if (data.password !== data.confirmPassword) {
            throw new Error('Passwords do not match');
        }

        // Hash password
        const plainPassword = data.password;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        const applicationData = {
            ...data,
            password: hashedPassword,
            status: 'pending' // Force status to pending for new or re-submission
        };

        let resultApplication;
        console.log(existingApplication);

        if (existingApplication) {
            // Check status or if deleted
            if (existingApplication.status === 'rejected' || existingApplication.deletedAt) {
                // Allow re-submission: Update the existing record
                // We need to restore it if it was soft-deleted (though findByEmail uses paranoid:false now so we see it)
                if (existingApplication.deletedAt) {
                    await existingApplication.restore();
                }

                // Update fields
                await editorApplicationRepository.update(existingApplication.id, applicationData);
                resultApplication = await editorApplicationRepository.findById(existingApplication.id);
            } else {
                // Status is pending or approved - Block submission
                throw new Error('Application with this email already exists');
            }
        } else {
            // New application
            resultApplication = await editorApplicationRepository.create(applicationData);
        }

        // Send welcome email with credentials
        try {
            await emailService.sendEmail({
                to: resultApplication.email,
                subject: 'Editor Application - Account Created',
                html: editorWelcomeTemplate({
                    name: `${resultApplication.firstName} ${resultApplication.lastName}`,
                    email: resultApplication.email,
                    password: plainPassword
                })
            });
        } catch (emailError) {
            console.error('Failed to send editor welcome email:', emailError);
        }

        return resultApplication;
    }

    async getAllApplications() {
        return await editorApplicationRepository.findAll();
    }

    async getApplicationById(id) {
        const application = await editorApplicationRepository.findById(id);
        if (!application) {
            throw new Error('Application not found');
        }
        return application;
    }

    async deleteApplication(id) {
        const deleted = await editorApplicationRepository.delete(id);
        if (!deleted) {
            throw new Error('Application not found');
        }
        return { message: 'Application deleted successfully' };
    }
}

module.exports = new EditorApplicationService();
