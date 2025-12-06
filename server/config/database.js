const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : null;

if (databaseUrl) {
    console.log(`[Database] Using DATABASE_URL: ${databaseUrl.substring(0, 15)}...`);
    if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
        console.error('[Database] ERROR: DATABASE_URL must start with postgres:// or postgresql://');
        console.error('[Database] Received:', databaseUrl);
        // Fallback or exit? Better to exit if they intended to use PG.
        // But for now let's let Sequelize try, but at least we logged it.
    }
} else {
    console.log('[Database] No DATABASE_URL found, using SQLite.');
}

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Required for some cloud providers like Heroku/Render
            }
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    })
    : new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DB_PATH || './database.sqlite', // Local database file or custom path
        logging: false
    });

module.exports = sequelize;
