const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const News = sequelize.define('News', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    news_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    tags: {
        type: DataTypes.JSON, // Stores array of strings
        allowNull: true,
        defaultValue: []
    }
}, {
    timestamps: true,
    paranoid: true, // Enable soft delete
    tableName: 'news'
});

module.exports = News;
