const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AbstractReview = sequelize.define('AbstractReview', {
    abstract_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'AbstractSubmissions',
            key: 'id',
        },
    },
    assignment_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        comment: 'NULL for admin final decision',
        references: {
            model: 'AbstractAssignments',
            key: 'id',
        },
    },
    reviewer_type: {
        type: DataTypes.ENUM('editor', 'conference_editor', 'admin'),
        allowNull: false,
    },
    reviewer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    decision: {
        type: DataTypes.ENUM('accepted', 'rejected'),
        allowNull: false,
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status_before: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    status_after: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    reviewed_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'AbstractReviews',
});

module.exports = AbstractReview;
