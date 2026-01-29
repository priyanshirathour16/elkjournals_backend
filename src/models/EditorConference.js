const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EditorConference = sequelize.define('EditorConference', {
    editor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'editor_applications',
            key: 'id',
        },
    },
    conference_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Conferences',
            key: 'id',
        },
    },
    role: {
        type: DataTypes.ENUM('editor', 'conference_editor'),
        defaultValue: 'editor',
    },
    assigned_by: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        references: {
            model: 'Admins',
            key: 'id',
        },
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'EditorConferences',
    indexes: [
        {
            unique: true,
            fields: ['editor_id', 'conference_id', 'role'],
        },
    ],
});

module.exports = EditorConference;
