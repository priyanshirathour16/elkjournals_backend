const newsService = require('../services/NewsService');

exports.createNews = async (req, res, next) => {
    try {
        const news = await newsService.createNews(req.body);
        res.status(201).json({
            success: true,
            message: 'News created successfully',
            data: news
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllNews = async (req, res, next) => {
    try {
        const newsList = await newsService.getAllNews();
        res.status(200).json({
            success: true,
            count: newsList.length,
            data: newsList
        });
    } catch (error) {
        next(error);
    }
};

exports.getNewsById = async (req, res, next) => {
    try {
        const news = await newsService.getNewsById(req.params.id);
        res.status(200).json({
            success: true,
            data: news
        });
    } catch (error) {
        if (error.message === 'News not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

exports.updateNews = async (req, res, next) => {
    try {
        const updatedNews = await newsService.updateNews(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: 'News updated successfully',
            data: updatedNews
        });
    } catch (error) {
        if (error.message === 'News not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

exports.deleteNews = async (req, res, next) => {
    try {
        await newsService.deleteNews(req.params.id);
        res.status(200).json({
            success: true,
            message: 'News deleted successfully'
        });
    } catch (error) {
        if (error.message === 'News not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};
