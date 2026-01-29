/**
 * Migration script to add firstName and lastName columns to Admins table
 * Run this script once: node src/migrations/add_names_to_admins.js
 */

const sequelize = require('../config/database');

async function migrate() {
    try {
        console.log('Starting migration: Adding firstName and lastName columns to Admins...');

        // Check if firstName column already exists
        const [firstNameResults] = await sequelize.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Admins'
            AND COLUMN_NAME = 'firstName'
        `);

        if (firstNameResults.length > 0) {
            console.log('Column firstName already exists. Skipping migration.');
            process.exit(0);
        }

        // Add the firstName column
        await sequelize.query(`
            ALTER TABLE Admins
            ADD COLUMN firstName VARCHAR(255) NULL
        `);

        // Add the lastName column
        await sequelize.query(`
            ALTER TABLE Admins
            ADD COLUMN lastName VARCHAR(255) NULL
        `);

        console.log('Migration successful: firstName and lastName columns added to Admins table');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
