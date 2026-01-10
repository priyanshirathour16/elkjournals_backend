const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CopyrightTemplate = sequelize.define('CopyrightTemplate', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    version: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Version string, e.g., "1.0", "1.1"'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Only one template should be active at a time'
    },
    schema: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'JSON schema defining form structure, sections, and legal text'
    }
}, {
    timestamps: true,
    tableName: 'copyright_templates',
    indexes: [
        {
            unique: true,
            fields: ['version']
        }
    ]
});

module.exports = CopyrightTemplate;
