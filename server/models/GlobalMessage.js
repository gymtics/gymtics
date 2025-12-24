const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const GlobalMessage = sequelize.define('GlobalMessage', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        avatar: {
            type: DataTypes.TEXT, // Store avatar URL or base64
            allowNull: true
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    return GlobalMessage;
};
