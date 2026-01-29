const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProposalRequest = sequelize.define('ProposalRequest', {
    // Auto-generated unique proposal ID (e.g., PROP-2025-001)
    proposalId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },

    // ==================== REQUESTOR DETAILS ====================
    title: {
        type: DataTypes.ENUM('Mr', 'Mrs', 'Ms', 'Dr', 'Prof'),
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    institutionalAffiliation: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    countryCode: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    mobileNumber: {
        type: DataTypes.STRING(20),
        allowNull: false
    },

    // ==================== CONFERENCE DETAILS ====================
    conferenceTitle: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    instituteName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    instituteWebsite: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },

    // ==================== PUBLICATION TYPE ====================
    publicationType: {
        type: DataTypes.ENUM('proceedings_edited', 'proceedings_only', 'edited_only'),
        allowNull: false,
        defaultValue: 'proceedings_edited'
    },

    // ==================== OPTIONAL SERVICES (JSON) ====================
    selectedServices: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            eCertificate: false,
            designing: false,
            plagiarism: false,
            doi: false
        }
    },

    // ==================== ATTACHMENT ====================
    attachmentFilePath: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    attachmentOriginalName: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    // ==================== ADDITIONAL INFO ====================
    additionalComments: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // ==================== STATUS TRACKING ====================
    status: {
        type: DataTypes.ENUM('Pending', 'Under Review', 'Approved', 'Rejected', 'Completed'),
        allowNull: false,
        defaultValue: 'Pending'
    },
    adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'proposal_requests',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
        {
            fields: ['email']
        },
        {
            fields: ['status']
        },
        {
            fields: ['proposalId']
        }
    ]
});

module.exports = ProposalRequest;
