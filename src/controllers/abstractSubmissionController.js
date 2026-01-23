const { AbstractSubmission, Conference, Author } = require('../models');

// Submit Abstract
exports.submitAbstract = async (req, res, next) => {
    try {
        const { conference_id, author_id } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Abstract file is required.' });
        }

        if (!conference_id) {
            return res.status(400).json({ message: 'Conference ID is required.' });
        }

        if (!author_id) {
            return res.status(400).json({ message: 'Author ID is required.' });
        }

        const existingSubmission = await AbstractSubmission.findOne({
            where: { conference_id, author_id }
        });

        if (existingSubmission) {
            return res.status(400).json({ message: 'You have already submitted an abstract for this conference.' });
        }

        const submission = await AbstractSubmission.create({
            conference_id,
            author_id,
            abstract_file: req.file.path,
            status: 'Pending'
        });

        res.status(201).json({
            message: 'Abstract submitted successfully.',
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

// Update Status (Admin)
exports.updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be Pending, Approved, or Rejected.' });
        }

        const submission = await AbstractSubmission.findByPk(id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        submission.status = status;
        await submission.save();

        res.json({
            message: 'Status updated successfully.',
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

// Get All Abstracts
exports.getAllAbstracts = async (req, res, next) => {
    try {
        const submissions = await AbstractSubmission.findAll({
            include: [
                {
                    model: Conference,
                    as: 'conference',
                    attributes: ['id', 'name']
                },
                {
                    model: Author,
                    as: 'author',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(submissions);
    } catch (error) {
        next(error);
    }
};

// Get Abstracts by Author
exports.getAbstractsByAuthor = async (req, res, next) => {
    try {
        const { authorId } = req.params;

        const submissions = await AbstractSubmission.findAll({
            where: { author_id: authorId },
            include: [
                {
                    model: Conference,
                    as: 'conference',
                    attributes: ['id', 'name']
                },
                {
                    model: Author,
                    as: 'author',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(submissions);
    } catch (error) {
        next(error);
    }
};
