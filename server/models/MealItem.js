const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MealItem = sequelize.define('MealItem', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    frontendId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING, // Pre-workout, Post-workout, etc.
        allowNull: false
    },
    text: {
        type: DataTypes.STRING,
        allowNull: false
    },
    quantity: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    calories: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = MealItem;
