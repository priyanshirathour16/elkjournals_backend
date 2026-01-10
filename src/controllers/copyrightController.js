const copyrightService = require('../services/CopyrightService');

/**
 * Get the currently active copyright template
 * GET /api/copyright/template/active
 */
exports.getActiveTemplate = async (req, res, next) => {
    try {
        const template = await copyrightService.getActiveTemplate();

        res.status(200).json({
            success: true,
            data: template
        });
    } catch (error) {
        if (error.message === 'No active copyright template found') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        next(error);
    }
};

/**
 * Submit copyright agreement
 * POST /api/copyright/submit
 * Body: { manuscript_id, template_version, signatures }
 */
exports.submitCopyright = async (req, res, next) => {
    try {
        const { manuscript_id, template_version, signatures } = req.body;

        // Validate required fields
        if (!manuscript_id) {
            return res.status(400).json({
                success: false,
                error: 'manuscript_id is required'
            });
        }

        if (!template_version) {
            return res.status(400).json({
                success: false,
                error: 'template_version is required'
            });
        }

        if (!signatures || typeof signatures !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'signatures object is required'
            });
        }

        const result = await copyrightService.submitCopyright(
            manuscript_id,
            template_version,
            signatures
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error.message === 'Manuscript not found') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        if (error.message.includes('template version') && error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        if (error.message === 'Copyright agreement already submitted for this manuscript') {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        next(error);
    }
};

/**
 * Get copyright submission by manuscript ID
 * GET /api/copyright/submission/:manuscript_id
 */
exports.getSubmission = async (req, res, next) => {
    try {
        const { manuscript_id } = req.params;

        const result = await copyrightService.getSubmissionByManuscriptId(manuscript_id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error.message === 'Copyright submission not found for this manuscript') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        next(error);
    }
};

/**
 * Get manuscript details for copyright form (with authors)
 * GET /api/copyright/manuscript/:manuscript_id
 */
exports.getManuscriptForCopyright = async (req, res, next) => {
    try {
        const { manuscript_id } = req.params;

        const result = await copyrightService.getManuscriptForCopyright(manuscript_id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error.message === 'Manuscript not found') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        next(error);
    }
};
