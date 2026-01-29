const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FullPaperFile = sequelize.define('FullPaperFile', {
    abstract_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'AbstractSubmissions',
            key: 'id',
        },
    },
    file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    file_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'authors.id',
        references: {
            model: 'authors',
            key: 'id',
        },
    },
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'FullPaperFiles',
});

module.exports = FullPaperFile;
