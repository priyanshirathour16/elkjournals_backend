const { Op } = require('sequelize');
const {
    AbstractSubmission,
    Conference,
    Author,
    EditorApplication,
    Admin,
    AbstractAssignment,
    AbstractReview,
    AbstractStatusHistory,
    FullPaperFile,
} = require('../models');

// ─── Helper: Build the full abstract response shape expected by frontend ───
async function buildAbstractResponse(abstractId, includeFullPaperFiles = true) {
    const abstract = await AbstractSubmission.findByPk(abstractId, {
        include: [
            { model: Conference, as: 'conference', attributes: ['id', 'name'] },
            { model: Author, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
    });
    if (!abstract) return null;

    const plain = abstract.toJSON();

    // Assigned editor (stage = 'editor', latest non-cancelled)
    const editorAssignment = await AbstractAssignment.findOne({
        where: { abstract_id: abstractId, stage: 'editor', status: { [Op.in]: ['assigned', 'reviewed'] } },
        order: [['createdAt', 'DESC']],
        include: [
            { model: EditorApplication, as: 'editor', attributes: ['id', 'firstName', 'lastName'] },
            { model: Admin, as: 'assignedByAdmin', attributes: ['id', 'email'] },
        ],
    });

    // Assigned conference editor (stage = 'conference_editor')
    const confEditorAssignment = await AbstractAssignment.findOne({
        where: { abstract_id: abstractId, stage: 'conference_editor', status: { [Op.in]: ['assigned', 'reviewed'] } },
        order: [['createdAt', 'DESC']],
        include: [
            { model: EditorApplication, as: 'editor', attributes: ['id', 'firstName', 'lastName'] },
            { model: Admin, as: 'assignedByAdmin', attributes: ['id', 'email'] },
        ],
    });

    // Editor review comment
    const editorReview = await AbstractReview.findOne({
        where: { abstract_id: abstractId, reviewer_type: 'editor' },
        order: [['reviewed_at', 'DESC']],
    });

    // Conference editor review comment
    const confEditorReview = await AbstractReview.findOne({
        where: { abstract_id: abstractId, reviewer_type: 'conference_editor' },
        order: [['reviewed_at', 'DESC']],
    });

    // Admin final review comment
    const adminReview = await AbstractReview.findOne({
        where: { abstract_id: abstractId, reviewer_type: 'admin' },
        order: [['reviewed_at', 'DESC']],
    });

    // Build response
    const result = {
        id: plain.id,
        conference_id: plain.conference_id,
        conference: plain.conference,
        author: plain.author,
        abstract_file: plain.abstract_file,
        title: plain.title,
        status: plain.status,
        assigned_editor: editorAssignment
            ? { id: editorAssignment.editor.id, name: `${editorAssignment.editor.firstName} ${editorAssignment.editor.lastName}` }
            : null,
        assigned_by: editorAssignment
            ? { name: editorAssignment.assignedByAdmin.email }
            : null,
        editor_comment: editorReview ? editorReview.comment : null,
        assigned_conference_editor: confEditorAssignment
            ? { id: confEditorAssignment.editor.id, name: `${confEditorAssignment.editor.firstName} ${confEditorAssignment.editor.lastName}` }
            : null,
        conference_editor_assigned_by: confEditorAssignment
            ? { name: confEditorAssignment.assignedByAdmin.email }
            : null,
        conference_editor_comment: confEditorReview ? confEditorReview.comment : null,
        admin_final_comment: adminReview ? adminReview.comment : null,
        createdAt: plain.createdAt,
    };

    if (includeFullPaperFiles) {
        const files = await FullPaperFile.findAll({
            where: { abstract_id: abstractId },
            include: [{ model: Author, as: 'uploader', attributes: ['firstName', 'lastName'] }],
            order: [['createdAt', 'DESC']],
        });
        result.full_paper_files = files.map(f => ({
            id: f.id,
            file_name: f.file_name,
            file_type: f.file_type,
            file_path: f.file_path,
            uploaded_at: f.createdAt,
            uploaded_by: f.uploader ? { firstName: f.uploader.firstName, lastName: f.uploader.lastName } : null,
        }));
    } else {
        result.full_paper_files = [];
    }

    return result;
}

// ─── Helper: Create status history entry ───
async function createStatusHistory({ abstract_id, status_from, status_to, changed_by_type, changed_by_id, assignment_id, review_id, remarks }) {
    return AbstractStatusHistory.create({
        abstract_id,
        status_from,
        status_to,
        changed_by_type,
        changed_by_id: changed_by_id || null,
        assignment_id: assignment_id || null,
        review_id: review_id || null,
        remarks: remarks || null,
        changed_at: new Date(),
    });
}

// ─── Existing API: Submit Abstract ───
exports.submitAbstract = async (req, res, next) => {
    try {
        const { conference_id, author_id, title } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Abstract file is required.' });
        }
        if (!conference_id) {
            return res.status(400).json({ success: false, message: 'Conference ID is required.' });
        }
        if (!author_id) {
            return res.status(400).json({ success: false, message: 'Author ID is required.' });
        }

        const existingSubmission = await AbstractSubmission.findOne({
            where: { conference_id, author_id }
        });
        if (existingSubmission) {
            return res.status(400).json({ success: false, message: 'You have already submitted an abstract for this conference.' });
        }

        const submission = await AbstractSubmission.create({
            conference_id,
            author_id,
            abstract_file: req.file.path,
            title: title || null,
            status: 'Submitted',
        });

        // Status history for initial submission
        await createStatusHistory({
            abstract_id: submission.id,
            status_from: null,
            status_to: 'Submitted',
            changed_by_type: 'author',
            changed_by_id: author_id,
        });

        res.status(201).json({
            success: true,
            message: 'Abstract submitted successfully.',
            data: submission,
        });
    } catch (error) {
        next(error);
    }
};

// ─── Existing API: Update Status (legacy — kept for backward compat) ───
exports.updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = [
            'Submitted', 'Assigned to Editor', 'Reviewed by Editor',
            'Assigned to Conference Editor', 'Reviewed by Conference Editor',
            'Accepted', 'Rejected',
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const submission = await AbstractSubmission.findByPk(id);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found.' });
        }

        const oldStatus = submission.status;
        submission.status = status;
        await submission.save();

        await createStatusHistory({
            abstract_id: id,
            status_from: oldStatus,
            status_to: status,
            changed_by_type: 'admin',
            changed_by_id: req.user ? req.user.id : null,
        });

        res.json({ success: true, message: 'Status updated successfully.', data: submission });
    } catch (error) {
        next(error);
    }
};

// ─── Existing API: Get All Abstracts ───
exports.getAllAbstracts = async (req, res, next) => {
    try {
        const submissions = await AbstractSubmission.findAll({
            include: [
                { model: Conference, as: 'conference', attributes: ['id', 'name'] },
                { model: Author, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(submissions);
    } catch (error) {
        next(error);
    }
};

// ─── Existing API: Get Abstracts by Author ───
exports.getAbstractsByAuthor = async (req, res, next) => {
    try {
        const { authorId } = req.params;
        const submissions = await AbstractSubmission.findAll({
            where: { author_id: authorId },
            include: [
                { model: Conference, as: 'conference', attributes: ['id', 'name'] },
                { model: Author, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(submissions);
    } catch (error) {
        next(error);
    }
};

// ─── API 1: Get abstracts by conference (Admin) ───
exports.getAbstractsByConference = async (req, res, next) => {
    try {
        const { conferenceId } = req.params;

        const submissions = await AbstractSubmission.findAll({
            where: { conference_id: conferenceId },
            include: [
                { model: Conference, as: 'conference', attributes: ['id', 'name'] },
                { model: Author, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        const data = await Promise.all(
            submissions.map(s => buildAbstractResponse(s.id, true))
        );

        res.json({ success: true, data, message: 'Abstracts fetched successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── API 3: Assign editor to abstract — Stage 1 (Admin) ───
exports.assignEditor = async (req, res, next) => {
    try {
        const { abstractId } = req.params;
        const { editorId } = req.body;
        const adminId = req.user.id;

        if (!editorId) {
            return res.status(400).json({ success: false, message: 'editorId is required.' });
        }

        const abstract = await AbstractSubmission.findByPk(abstractId);
        if (!abstract) {
            return res.status(404).json({ success: false, message: 'Abstract not found.' });
        }
        if (abstract.status !== 'Submitted') {
            return res.status(400).json({ success: false, message: `Cannot assign editor. Current status is "${abstract.status}", expected "Submitted".` });
        }

        const editor = await EditorApplication.findByPk(editorId);
        if (!editor) {
            return res.status(404).json({ success: false, message: 'Editor not found.' });
        }

        // Create assignment
        const assignment = await AbstractAssignment.create({
            abstract_id: abstractId,
            editor_id: editorId,
            stage: 'editor',
            assigned_by: adminId,
            status: 'assigned',
            assigned_at: new Date(),
        });

        // Update abstract
        const oldStatus = abstract.status;
        abstract.status = 'Assigned to Editor';
        abstract.current_editor_id = editorId;
        await abstract.save();

        // Status history
        await createStatusHistory({
            abstract_id: abstractId,
            status_from: oldStatus,
            status_to: 'Assigned to Editor',
            changed_by_type: 'admin',
            changed_by_id: adminId,
            assignment_id: assignment.id,
        });

        const data = await buildAbstractResponse(abstractId);
        res.json({ success: true, data, message: 'Abstract assigned to editor successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── API 4: Assign conference editor — Stage 2 (Admin) ───
exports.assignConferenceEditor = async (req, res, next) => {
    try {
        const { abstractId } = req.params;
        const { editorId } = req.body;
        const adminId = req.user.id;

        if (!editorId) {
            return res.status(400).json({ success: false, message: 'editorId is required.' });
        }

        const abstract = await AbstractSubmission.findByPk(abstractId);
        if (!abstract) {
            return res.status(404).json({ success: false, message: 'Abstract not found.' });
        }
        if (abstract.status !== 'Reviewed by Editor') {
            return res.status(400).json({ success: false, message: `Cannot assign conference editor. Current status is "${abstract.status}", expected "Reviewed by Editor".` });
        }

        const editor = await EditorApplication.findByPk(editorId);
        if (!editor) {
            return res.status(404).json({ success: false, message: 'Editor not found.' });
        }

        const assignment = await AbstractAssignment.create({
            abstract_id: abstractId,
            editor_id: editorId,
            stage: 'conference_editor',
            assigned_by: adminId,
            status: 'assigned',
            assigned_at: new Date(),
        });

        const oldStatus = abstract.status;
        abstract.status = 'Assigned to Conference Editor';
        abstract.current_conference_editor_id = editorId;
        await abstract.save();

        await createStatusHistory({
            abstract_id: abstractId,
            status_from: oldStatus,
            status_to: 'Assigned to Conference Editor',
            changed_by_type: 'admin',
            changed_by_id: adminId,
            assignment_id: assignment.id,
        });

        const data = await buildAbstractResponse(abstractId);
        res.json({ success: true, data, message: 'Abstract assigned to conference editor successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── API 5: Admin final decision — Stage 3 (Admin) ───
exports.adminDecision = async (req, res, next) => {
    try {
        const { abstractId } = req.params;
        const { action, comment } = req.body;
        const adminId = req.user.id;

        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'action must be "accept" or "reject".' });
        }

        const abstract = await AbstractSubmission.findByPk(abstractId);
        if (!abstract) {
            return res.status(404).json({ success: false, message: 'Abstract not found.' });
        }
        if (abstract.status !== 'Reviewed by Conference Editor') {
            return res.status(400).json({ success: false, message: `Cannot make final decision. Current status is "${abstract.status}", expected "Reviewed by Conference Editor".` });
        }

        if (action === 'reject' && (!comment || !comment.trim())) {
            return res.status(400).json({ success: false, message: 'Comment is mandatory when rejecting.' });
        }

        const oldStatus = abstract.status;
        const newStatus = action === 'accept' ? 'Accepted' : 'Rejected';

        // Create review
        const review = await AbstractReview.create({
            abstract_id: abstractId,
            assignment_id: null,
            reviewer_type: 'admin',
            reviewer_id: adminId,
            decision: action === 'accept' ? 'accepted' : 'rejected',
            comment: comment || '',
            status_before: oldStatus,
            status_after: newStatus,
            reviewed_at: new Date(),
        });

        abstract.status = newStatus;
        await abstract.save();

        await createStatusHistory({
            abstract_id: abstractId,
            status_from: oldStatus,
            status_to: newStatus,
            changed_by_type: 'admin',
            changed_by_id: adminId,
            review_id: review.id,
        });

        const data = await buildAbstractResponse(abstractId);
        const msg = action === 'accept' ? 'Abstract accepted successfully' : 'Abstract rejected successfully';
        res.json({ success: true, data, message: msg });
    } catch (error) {
        next(error);
    }
};

// ─── API 6: Get abstracts assigned to editor (Editor) ───
exports.getEditorAssignedAbstracts = async (req, res, next) => {
    try {
        const editorId = req.user.id;

        const submissions = await AbstractSubmission.findAll({
            where: {
                [Op.or]: [
                    {
                        current_editor_id: editorId,
                        status: { [Op.in]: ['Assigned to Editor', 'Reviewed by Editor'] },
                    },
                    {
                        current_conference_editor_id: editorId,
                        status: { [Op.in]: ['Assigned to Conference Editor', 'Reviewed by Conference Editor'] },
                    },
                    // Also show rejected abstracts where this editor was assigned
                    {
                        status: 'Rejected',
                        [Op.or]: [
                            { current_editor_id: editorId },
                            { current_conference_editor_id: editorId },
                        ],
                    },
                ],
            },
            include: [
                { model: Conference, as: 'conference', attributes: ['id', 'name'] },
                { model: Author, as: 'author', attributes: ['id', 'firstName', 'lastName'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        const data = await Promise.all(
            submissions.map(s => buildAbstractResponse(s.id, false))
        );

        res.json({ success: true, data, message: 'Assigned abstracts fetched successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── API 7 + 8: Editor review (accept/reject) ───
exports.editorReview = async (req, res, next) => {
    try {
        const { abstractId } = req.params;
        const { action, comment } = req.body;
        const editorId = req.user.id;

        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'action must be "accept" or "reject".' });
        }
        if (!comment || !comment.trim()) {
            return res.status(400).json({ success: false, message: 'Comment is mandatory.' });
        }

        const abstract = await AbstractSubmission.findByPk(abstractId);
        if (!abstract) {
            return res.status(404).json({ success: false, message: 'Abstract not found.' });
        }

        let stage, reviewerType, newStatus;

        if (abstract.status === 'Assigned to Editor' && abstract.current_editor_id === editorId) {
            stage = 'editor';
            reviewerType = 'editor';
            newStatus = action === 'accept' ? 'Reviewed by Editor' : 'Rejected';
        } else if (abstract.status === 'Assigned to Conference Editor' && abstract.current_conference_editor_id === editorId) {
            stage = 'conference_editor';
            reviewerType = 'conference_editor';
            newStatus = action === 'accept' ? 'Reviewed by Conference Editor' : 'Rejected';
        } else {
            return res.status(403).json({ success: false, message: 'You are not authorized to review this abstract at its current stage.' });
        }

        // Find the matching assignment
        const assignment = await AbstractAssignment.findOne({
            where: {
                abstract_id: abstractId,
                editor_id: editorId,
                stage,
                status: 'assigned',
            },
            order: [['createdAt', 'DESC']],
        });

        if (assignment) {
            assignment.status = 'reviewed';
            assignment.completed_at = new Date();
            await assignment.save();
        }

        const oldStatus = abstract.status;

        // Create review record
        const review = await AbstractReview.create({
            abstract_id: abstractId,
            assignment_id: assignment ? assignment.id : null,
            reviewer_type: reviewerType,
            reviewer_id: editorId,
            decision: action === 'accept' ? 'accepted' : 'rejected',
            comment,
            status_before: oldStatus,
            status_after: newStatus,
            reviewed_at: new Date(),
        });

        abstract.status = newStatus;
        await abstract.save();

        await createStatusHistory({
            abstract_id: abstractId,
            status_from: oldStatus,
            status_to: newStatus,
            changed_by_type: reviewerType,
            changed_by_id: editorId,
            assignment_id: assignment ? assignment.id : null,
            review_id: review.id,
        });

        const data = await buildAbstractResponse(abstractId, false);
        const msg = action === 'accept' ? 'Abstract accepted successfully' : 'Abstract rejected successfully';
        res.json({ success: true, data, message: msg });
    } catch (error) {
        next(error);
    }
};

// ─── API 9: Get accepted abstracts for author (Author) ───
exports.getAuthorAcceptedAbstracts = async (req, res, next) => {
    try {
        const authorId = req.user.id;

        const submissions = await AbstractSubmission.findAll({
            where: { author_id: authorId, status: 'Accepted' },
            include: [
                { model: Conference, as: 'conference', attributes: ['id', 'name'] },
                { model: Author, as: 'author', attributes: ['id', 'firstName', 'lastName'] },
                {
                    model: FullPaperFile,
                    as: 'full_paper_files',
                    include: [{ model: Author, as: 'uploader', attributes: ['firstName', 'lastName'] }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const data = submissions.map(s => {
            const plain = s.toJSON();
            return {
                id: plain.id,
                conference_id: plain.conference_id,
                conference: plain.conference,
                author: plain.author,
                abstract_file: plain.abstract_file,
                title: plain.title,
                status: plain.status,
                full_paper_files: (plain.full_paper_files || []).map(f => ({
                    id: f.id,
                    file_name: f.file_name,
                    file_type: f.file_type,
                    file_path: f.file_path,
                    uploaded_at: f.createdAt,
                    uploaded_by: f.uploader ? { firstName: f.uploader.firstName, lastName: f.uploader.lastName } : null,
                })),
                createdAt: plain.createdAt,
            };
        });

        res.json({ success: true, data, message: 'Accepted abstracts fetched successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── API 10: Submit full paper files (Author) ───
exports.submitFullPaper = async (req, res, next) => {
    try {
        const { abstractId } = req.params;
        const authorId = req.user.id;

        const abstract = await AbstractSubmission.findByPk(abstractId);
        if (!abstract) {
            return res.status(404).json({ success: false, message: 'Abstract not found.' });
        }
        if (abstract.status !== 'Accepted') {
            return res.status(400).json({ success: false, message: 'Full paper can only be submitted for accepted abstracts.' });
        }
        if (abstract.author_id !== authorId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to upload files for this abstract.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one file is required.' });
        }

        // Create FullPaperFile records
        const fileRecords = await Promise.all(
            req.files.map(file =>
                FullPaperFile.create({
                    abstract_id: abstractId,
                    file_name: file.originalname,
                    file_type: file.mimetype,
                    file_path: file.path,
                    uploaded_by: authorId,
                })
            )
        );

        const data = await buildAbstractResponse(abstractId, true);
        res.json({ success: true, data, message: 'Full paper submitted successfully' });
    } catch (error) {
        next(error);
    }
};
