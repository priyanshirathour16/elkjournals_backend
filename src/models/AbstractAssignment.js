const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AbstractAssignment = sequelize.define('AbstractAssignment', {
    abstract_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'AbstractSubmissions',
            key: 'id',
        },
    },
    editor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'editor_applications',
            key: 'id',
        },
    },
    stage: {
        type: DataTypes.ENUM('editor', 'conference_editor'),
        allowNull: false,
    },
    assigned_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Admins.id',
        references: {
            model: 'Admins',
            key: 'id',
        },
    },
    status: {
        type: DataTypes.ENUM('assigned', 'reviewed', 'reassigned', 'cancelled'),
        defaultValue: 'assigned',
    },
    assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    completed_at: {
        type: DataTypes.DATE,
        defaultValue: null,
    },
    notes: {
        type: DataTypes.TEXT,
        defaultValue: null,
    },
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'AbstractAssignments',
});

module.exports = AbstractAssignment;
