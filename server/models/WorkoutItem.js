const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkoutItem = sequelize.define('WorkoutItem', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    frontendId: { // To map back to frontend IDs if needed
        type: DataTypes.STRING,
        allowNull: true
    },
    text: {
        type: DataTypes.STRING,
        allowNull: false
    },
    weight: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sets: {
        type: DataTypes.TEXT, // Changed to TEXT to store JSON string of sets
        allowNull: true
    },
    reps: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = WorkoutItem;
