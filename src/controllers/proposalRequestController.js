const { validationResult } = require('express-validator');
const proposalRequestService = require('../services/ProposalRequestService');

/**
 * Submit a new proposal request
 */
exports.submitProposal = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const file = req.file || null;
        const result = await proposalRequestService.submitProposal(req.body, file);

        res.status(201).json({
            message: 'Proposal request submitted successfully',
            data: result.proposal,
            proposalId: result.proposalId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all proposal requests (with optional filters)
 */
exports.getAllProposals = async (req, res, next) => {
    try {
        const filters = {
            status: req.query.status,
            email: req.query.email,
            search: req.query.search
        };

        const proposals = await proposalRequestService.getAllProposals(filters);
        res.json({
            message: 'Proposals retrieved successfully',
            data: proposals,
            count: proposals.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get proposal by ID
 */
exports.getProposalById = async (req, res, next) => {
    try {
        const proposal = await proposalRequestService.getProposalById(req.params.id);
        res.json({
            message: 'Proposal retrieved successfully',
            data: proposal
        });
    } catch (error) {
        if (error.message === 'Proposal request not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Get proposal by proposalId (e.g., PROP-2025-0001)
 */
exports.getProposalByProposalId = async (req, res, next) => {
    try {
        const proposal = await proposalRequestService.getProposalByProposalId(req.params.proposalId);
        res.json({
            message: 'Proposal retrieved successfully',
            data: proposal
        });
    } catch (error) {
        if (error.message === 'Proposal request not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Get proposals by email
 */
exports.getProposalsByEmail = async (req, res, next) => {
    try {
        const proposals = await proposalRequestService.getProposalsByEmail(req.params.email);
        res.json({
            message: 'Proposals retrieved successfully',
            data: proposals,
            count: proposals.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update proposal status
 */
exports.updateProposalStatus = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status, adminNotes } = req.body;
        const proposal = await proposalRequestService.updateProposalStatus(
            req.params.id,
            status,
            adminNotes
        );

        res.json({
            message: 'Proposal status updated successfully',
            data: proposal
        });
    } catch (error) {
        if (error.message === 'Proposal request not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Invalid status')) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Update proposal request
 */
exports.updateProposal = async (req, res, next) => {
    try {
        const file = req.file || null;
        const proposal = await proposalRequestService.updateProposal(
            req.params.id,
            req.body,
            file
        );

        res.json({
            message: 'Proposal updated successfully',
            data: proposal
        });
    } catch (error) {
        if (error.message === 'Proposal request not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Delete proposal request
 */
exports.deleteProposal = async (req, res, next) => {
    try {
        const result = await proposalRequestService.deleteProposal(req.params.id);
        res.json(result);
    } catch (error) {
        if (error.message === 'Proposal request not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Get proposal statistics
 */
exports.getStatistics = async (req, res, next) => {
    try {
        const stats = await proposalRequestService.getStatistics();
        res.json({
            message: 'Statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
