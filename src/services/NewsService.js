const newsRepository = require('../repositories/NewsRepository');

class NewsService {
    async createNews(data) {
        // Validate required fields
        if (!data.title || !data.description || !data.news_date) {
            throw new Error('Title, description, and date are required');
        }

        // Ensure tags is array if provided
        if (data.tags && !Array.isArray(data.tags)) {
            // Try to parse if string
            try {
                data.tags = JSON.parse(data.tags);
            } catch (e) {
                // If not parseable, wrap in array if single string, or empty array
                if (typeof data.tags === 'string') {
                    data.tags = [data.tags];
                } else {
                    data.tags = [];
                }
            }
        }

        return await newsRepository.create(data);
    }

    async getAllNews() {
        return await newsRepository.findAll();
    }

    async getNewsById(id) {
        const news = await newsRepository.findById(id);
        if (!news) {
            throw new Error('News not found');
        }
        return news;
    }

    async updateNews(id, data) {
        // Basic validation for existing news
        const existingNews = await newsRepository.findById(id);
        if (!existingNews) {
            throw new Error('News not found');
        }

        if (data.tags && !Array.isArray(data.tags)) {
            try {
                data.tags = JSON.parse(data.tags);
            } catch (e) {
                if (typeof data.tags === 'string') {
                    data.tags = [data.tags];
                }
            }
        }

        return await newsRepository.update(id, data);
    }

    async deleteNews(id) {
        const deleted = await newsRepository.delete(id);
        if (!deleted) {
            throw new Error('News not found');
        }
        return { message: 'News deleted successfully' };
    }
}

module.exports = new NewsService();
