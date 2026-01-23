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
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
    }
}, {
    paranoid: true, // Enable soft delete
});

module.exports = AbstractSubmission;
