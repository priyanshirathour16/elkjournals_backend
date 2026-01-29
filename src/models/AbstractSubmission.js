const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AbstractSubmission = sequelize.define('AbstractSubmission', {
    abstract_file: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    conference_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING(500),
        defaultValue: null,
    },
    status: {
        type: DataTypes.ENUM(
            'Submitted',
            'Assigned to Editor',
            'Reviewed by Editor',
            'Assigned to Conference Editor',
            'Reviewed by Conference Editor',
            'Accepted',
            'Rejected'
        ),
        defaultValue: 'Submitted',
    },
    current_editor_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
    },
    current_conference_editor_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
    },
}, {
    paranoid: true,
});

module.exports = AbstractSubmission;
