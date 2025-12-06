const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Setup Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

// Define User Model (Simplified)
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

async function listUsers() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const users = await User.findAll();
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`ID: ${u.id} | Username: '${u.username}' | Email: '${u.email}' | Password: '${u.password}'`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

listUsers();
