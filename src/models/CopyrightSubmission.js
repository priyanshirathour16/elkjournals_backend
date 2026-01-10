const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CopyrightSubmission = sequelize.define('CopyrightSubmission', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    manuscript_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'References manuscripts.manuscript_id (the public-facing UUID)'
    },
    template_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'copyright_templates',
            key: 'id'
        },
        comment: 'References the template version used at time of signing'
    },
    submission_data: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'Stores signatures: { "signatures": { "0": { "name": "...", "date": "..." } } }'
    }
}, {
    timestamps: true,
    tableName: 'copyright_submissions',
    indexes: [
        {
            unique: true,
            fields: ['manuscript_id'],
            name: 'unique_manuscript_submission'
        }
    ]
});

module.exports = CopyrightSubmission;
