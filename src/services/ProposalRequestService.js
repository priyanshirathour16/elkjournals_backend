const proposalRequestRepository = require('../repositories/ProposalRequestRepository');
const fs = require('fs');
const path = require('path');

class ProposalRequestService {
    /**
     * Submit a new proposal request
     */
    async submitProposal(data, file = null) {
        // Generate unique proposal ID
        const proposalId = await proposalRequestRepository.generateProposalId();

        // Prepare proposal data
        const proposalData = {
            proposalId,
            title: data.title,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            institutionalAffiliation: data.institutionalAffiliation,
            country: data.country,
            countryCode: data.countryCode,
            mobileNumber: data.mobileNumber,
            conferenceTitle: data.conferenceTitle,
            instituteName: data.instituteName,
            instituteWebsite: data.instituteWebsite || null,
            startDate: data.startDate,
            endDate: data.endDate,
            publicationType: data.publicationType || 'proceedings_edited',
            selectedServices: typeof data.selectedServices === 'string'
                ? JSON.parse(data.selectedServices)
                : data.selectedServices || {
                    eCertificate: false,
                    designing: false,
                    plagiarism: false,
                    doi: false
                },
            additionalComments: data.additionalComments || null,
            status: 'Pending'
        };

        // Handle file attachment if provided
        if (file) {
            proposalData.attachmentFilePath = file.path;
            proposalData.attachmentOriginalName = file.originalname;
        }

        const proposal = await proposalRequestRepository.create(proposalData);

        return {
            proposal,
            proposalId
        };
    }

    /**
     * Get all proposal requests with optional filters
     */
    async getAllProposals(filters = {}) {
        return await proposalRequestRepository.findAll(filters);
    }

    /**
     * Get proposal by ID
     */
    async getProposalById(id) {
        const proposal = await proposalRequestRepository.findById(id);
        if (!proposal) {
            throw new Error('Proposal request not found');
        }
        return proposal;
    }

    /**
     * Get proposal by proposalId (e.g., PROP-2025-0001)
     */
    async getProposalByProposalId(proposalId) {
        const proposal = await proposalRequestRepository.findByProposalId(proposalId);
        if (!proposal) {
            throw new Error('Proposal request not found');
        }
        return proposal;
    }

    /**
     * Get proposals by email
     */
    async getProposalsByEmail(email) {
        return await proposalRequestRepository.findByEmail(email);
    }

    /**
     * Update proposal status
     */
    async updateProposalStatus(id, status, adminNotes = null) {
        const validStatuses = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Completed'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const proposal = await proposalRequestRepository.updateStatus(id, status, adminNotes);
        if (!proposal) {
            throw new Error('Proposal request not found');
        }
        return proposal;
    }

    /**
     * Update proposal request
     */
    async updateProposal(id, data, file = null) {
        const existingProposal = await proposalRequestRepository.findById(id);
        if (!existingProposal) {
            throw new Error('Proposal request not found');
        }

        const updateData = { ...data };

        // Handle file update
        if (file) {
            // Delete old file if exists
            if (existingProposal.attachmentFilePath && fs.existsSync(existingProposal.attachmentFilePath)) {
                fs.unlinkSync(existingProposal.attachmentFilePath);
            }
            updateData.attachmentFilePath = file.path;
            updateData.attachmentOriginalName = file.originalname;
        }

        // Parse selectedServices if it's a string
        if (updateData.selectedServices && typeof updateData.selectedServices === 'string') {
            updateData.selectedServices = JSON.parse(updateData.selectedServices);
        }

        return await proposalRequestRepository.update(id, updateData);
    }

    /**
     * Delete proposal request
     */
    async deleteProposal(id) {
        const proposal = await proposalRequestRepository.findById(id);
        if (!proposal) {
            throw new Error('Proposal request not found');
        }

        // Delete attachment file if exists
        if (proposal.attachmentFilePath && fs.existsSync(proposal.attachmentFilePath)) {
            fs.unlinkSync(proposal.attachmentFilePath);
        }

        const deleted = await proposalRequestRepository.delete(id);
        if (!deleted) {
            throw new Error('Failed to delete proposal request');
        }
        return { message: 'Proposal request deleted successfully' };
    }

    /**
     * Get proposal statistics
     */
    async getStatistics() {
        return await proposalRequestRepository.getStatistics();
    }
}

module.exports = new ProposalRequestService();
