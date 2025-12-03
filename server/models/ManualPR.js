const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ManualPR = sequelize.define('ManualPR', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    exercise: {
        type: DataTypes.STRING,
        allowNull: false
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    reps: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = ManualPR;
