const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Conference = require('./Conference');

const ConferenceRegistration = sequelize.define('ConferenceRegistration', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mobile: {
        type: DataTypes.STRING,
        allowNull: false
    },
    designation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    institution: {
        type: DataTypes.STRING,
        allowNull: true
    },
    institutionAddress: {
        type: DataTypes.STRING, // Was 'institutionAddress' in JSON, using camelCase for consistency with JSON if DB supports it or mapped. JSON had 'institutionAddress'
        allowNull: true
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pincode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    presentingPaper: {
        type: DataTypes.STRING,
        allowNull: true
    },
    residentialDelegate: {
        type: DataTypes.STRING,
        allowNull: true
    },
    terms: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    conferenceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Conference,
            key: 'id'
        }
    }
}, {
    tableName: 'conference_registrations',
    timestamps: true,
    paranoid: true
});

ConferenceRegistration.belongsTo(Conference, { foreignKey: 'conferenceId', as: 'conference' });
Conference.hasMany(ConferenceRegistration, { foreignKey: 'conferenceId' });

module.exports = ConferenceRegistration;
