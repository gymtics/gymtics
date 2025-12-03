const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GymLog = sequelize.define('GymLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
        type: DataTypes.STRING, // YYYY-MM-DD
        allowNull: false
    },
    gymVisited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = GymLog;
