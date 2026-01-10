const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public Routes
router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);

// Protected Routes (Admin only)
router.post('/', authMiddleware, roleMiddleware, newsController.createNews);
router.put('/:id', authMiddleware, roleMiddleware, newsController.updateNews);
router.delete('/:id', authMiddleware, roleMiddleware, newsController.deleteNews);

module.exports = router;
