/**
 * Migration script to add is_active column to editor_applications table
 * Run this script once: node src/migrations/add_is_active_to_editor_applications.js
 */

const sequelize = require('../config/database');

async function migrate() {
    try {
        console.log('Starting migration: Adding is_active column to editor_applications...');

        // Check if column already exists
        const [results] = await sequelize.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'editor_applications'
            AND COLUMN_NAME = 'is_active'
        `);

        if (results.length > 0) {
            console.log('Column is_active already exists. Skipping migration.');
            process.exit(0);
        }

        // Add the is_active column
        await sequelize.query(`
            ALTER TABLE editor_applications
            ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
            COMMENT 'Whether the editor is currently active or inactive'
        `);

        console.log('Migration successful: is_active column added to editor_applications table');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
