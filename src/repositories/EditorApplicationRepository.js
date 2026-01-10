const EditorApplication = require('../models/EditorApplication');

class EditorApplicationRepository {
    async create(data) {
        return await EditorApplication.create(data);
    }

    async findAll() {
        const { Journal } = require('../models');
        return await EditorApplication.findAll({
            include: [{
                model: Journal,
                as: 'journalData',
                attributes: ['title']
            }],
            order: [['updatedAt', 'DESC']]
        });
    }

    async findById(id) {
        const { Journal } = require('../models');
        return await EditorApplication.findByPk(id, {
            include: [{
                model: Journal,
                as: 'journalData',
                attributes: ['title']
            }]
        });
    }

    async findByEmail(email) {
        return await EditorApplication.findOne({ where: { email }, paranoid: false }); // Check even deleted ones if needed, but here we focus on active. Wait, standard check is fine.
    }

    async update(id, data) {
        const application = await EditorApplication.findByPk(id);
        if (!application) return null;
        return await application.update(data);
    }

    async delete(id) {
        return await EditorApplication.destroy({ where: { id } });
    }
}

module.exports = new EditorApplicationRepository();
