const News = require('../models/News');

class NewsRepository {
    async create(data) {
        return await News.create(data);
    }

    async findAll() {
        return await News.findAll({
            order: [['news_date', 'DESC'], ['createdAt', 'DESC']]
        });
    }

    async findById(id) {
        return await News.findByPk(id);
    }

    async update(id, data) {
        const news = await News.findByPk(id);
        if (!news) return null;
        return await news.update(data);
    }

    async delete(id) {
        // Soft delete logic is handled by 'paranoid: true' in model + destroy()
        return await News.destroy({ where: { id } });
    }
}

module.exports = new NewsRepository();
