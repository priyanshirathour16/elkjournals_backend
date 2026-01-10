const { CopyrightTemplate, CopyrightSubmission, Manuscript, ManuscriptAuthor, Journal } = require('../models');

class CopyrightRepository {
    /**
     * Find the currently active copyright template
     */
    async findActiveTemplate() {
        return await CopyrightTemplate.findOne({
            where: { is_active: true }
        });
    }

    /**
     * Find a template by version string
     */
    async findTemplateByVersion(version) {
        return await CopyrightTemplate.findOne({
            where: { version }
        });
    }

    /**
     * Find a template by ID
     */
    async findTemplateById(id) {
        return await CopyrightTemplate.findByPk(id);
    }

    /**
     * Find a copyright submission by manuscript UUID (public ID)
     */
    async findSubmissionByManuscriptId(manuscriptId) {
        return await CopyrightSubmission.findOne({
            where: { manuscript_id: manuscriptId },
            include: [
                {
                    model: CopyrightTemplate,
                    as: 'template',
                    attributes: ['id', 'version', 'schema', 'createdAt']
                }
            ]
        });
    }

    /**
     * Create a new copyright submission
     */
    async createSubmission(data, transaction = null) {
        const options = transaction ? { transaction } : {};
        return await CopyrightSubmission.create(data, options);
    }

    /**
     * Create a new copyright template
     */
    async createTemplate(data, transaction = null) {
        const options = transaction ? { transaction } : {};
        return await CopyrightTemplate.create(data, options);
    }

    /**
     * Update a template (e.g., set is_active)
     */
    async updateTemplate(id, data, transaction = null) {
        const options = { where: { id } };
        if (transaction) options.transaction = transaction;
        return await CopyrightTemplate.update(data, options);
    }

    /**
     * Deactivate all templates (before setting a new active one)
     */
    async deactivateAllTemplates(transaction = null) {
        const options = { where: {} };
        if (transaction) options.transaction = transaction;
        return await CopyrightTemplate.update({ is_active: false }, options);
    }

    /**
     * Find manuscript by public UUID with authors
     */
    async findManuscriptWithAuthors(manuscriptId) {
        return await Manuscript.findOne({
            where: { manuscript_id: manuscriptId },
            include: [
                {
                    model: ManuscriptAuthor,
                    as: 'authors',
                    attributes: [
                        'id', 'first_name', 'last_name', 'email', 'phone',
                        'institution', 'designation', 'city', 'state', 'country',
                        'is_corresponding_author'
                    ]
                },
                {
                    model: Journal,
                    as: 'journal',
                    attributes: ['id', 'title']
                }
            ]
        });
    }
}

module.exports = new CopyrightRepository();
