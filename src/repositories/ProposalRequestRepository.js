const ProposalRequest = require('../models/ProposalRequest');
const { Op } = require('sequelize');

class ProposalRequestRepository {
    /**
     * Create a new proposal request
     */
    async create(data) {
        return await ProposalRequest.create(data);
    }

    /**
     * Find all proposal requests with optional filters
     */
    async findAll(filters = {}) {
        const where = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.email) {
            where.email = filters.email;
        }

        if (filters.search) {
            where[Op.or] = [
                { firstName: { [Op.like]: `%${filters.search}%` } },
                { lastName: { [Op.like]: `%${filters.search}%` } },
                { email: { [Op.like]: `%${filters.search}%` } },
                { conferenceTitle: { [Op.like]: `%${filters.search}%` } },
                { proposalId: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        return await ProposalRequest.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
    }

    /**
     * Find proposal request by ID
     */
    async findById(id) {
        return await ProposalRequest.findByPk(id);
    }

    /**
     * Find proposal request by proposalId
     */
    async findByProposalId(proposalId) {
        return await ProposalRequest.findOne({
            where: { proposalId }
        });
    }

    /**
     * Find proposals by email
     */
    async findByEmail(email) {
        return await ProposalRequest.findAll({
            where: { email },
            order: [['createdAt', 'DESC']]
        });
    }

    /**
     * Update proposal request
     */
    async update(id, data) {
        const proposal = await ProposalRequest.findByPk(id);
        if (!proposal) {
            return null;
        }
        return await proposal.update(data);
    }

    /**
     * Update status of proposal request
     */
    async updateStatus(id, status, adminNotes = null) {
        const proposal = await ProposalRequest.findByPk(id);
        if (!proposal) {
            return null;
        }
        const updateData = { status };
        if (adminNotes !== null) {
            updateData.adminNotes = adminNotes;
        }
        return await proposal.update(updateData);
    }

    /**
     * Soft delete proposal request
     */
    async delete(id) {
        return await ProposalRequest.destroy({
            where: { id }
        });
    }

    /**
     * Generate unique proposal ID (format: PROP-YYYY-XXXX)
     */
    async generateProposalId() {
        const year = new Date().getFullYear();
        const prefix = `PROP-${year}-`;

        // Find the last proposal for this year
        const lastProposal = await ProposalRequest.findOne({
            where: {
                proposalId: {
                    [Op.like]: `${prefix}%`
                }
            },
            order: [['proposalId', 'DESC']],
            paranoid: false // Include soft-deleted records
        });

        let nextNumber = 1;
        if (lastProposal) {
            const lastNumber = parseInt(lastProposal.proposalId.split('-')[2], 10);
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    }

    /**
     * Get proposal statistics
     */
    async getStatistics() {
        const total = await ProposalRequest.count();
        const pending = await ProposalRequest.count({ where: { status: 'Pending' } });
        const underReview = await ProposalRequest.count({ where: { status: 'Under Review' } });
        const approved = await ProposalRequest.count({ where: { status: 'Approved' } });
        const rejected = await ProposalRequest.count({ where: { status: 'Rejected' } });
        const completed = await ProposalRequest.count({ where: { status: 'Completed' } });

        return {
            total,
            pending,
            underReview,
            approved,
            rejected,
            completed
        };
    }
}

module.exports = new ProposalRequestRepository();
