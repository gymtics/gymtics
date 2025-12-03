const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeightLog = sequelize.define('WeightLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
        type: DataTypes.STRING, // YYYY-MM-DD
        allowNull: false
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

module.exports = WeightLog;
