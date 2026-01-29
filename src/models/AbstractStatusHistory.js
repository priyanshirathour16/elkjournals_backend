const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AbstractStatusHistory = sequelize.define('AbstractStatusHistory', {
    abstract_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'AbstractSubmissions',
            key: 'id',
        },
    },
    status_from: {
        type: DataTypes.STRING(50),
        defaultValue: null,
    },
    status_to: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    changed_by_type: {
        type: DataTypes.ENUM('system', 'admin', 'editor', 'conference_editor', 'author'),
        allowNull: false,
    },
    changed_by_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
    },
    assignment_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
    },
    review_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
    },
    remarks: {
        type: DataTypes.TEXT,
        defaultValue: null,
    },
    changed_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    timestamps: true,
    updatedAt: false,
    tableName: 'AbstractStatusHistory',
});

module.exports = AbstractStatusHistory;
