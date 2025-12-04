const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OTP = sequelize.define('OTP', {
    identifier: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expires: {
        type: DataTypes.DATE, // Use DATE for timestamp comparison
        allowNull: false
    }
});

module.exports = OTP;
