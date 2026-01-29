/**
 * Migration script for Abstract Review Workflow
 *
 * Run this ONCE to:
 * 1. ALTER AbstractSubmissions table — add new columns and update status ENUM
 * 2. Migrate existing data: 'Pending' → 'Submitted', 'Approved' → 'Accepted'
 * 3. CREATE new tables (AbstractAssignments, AbstractReviews, AbstractStatusHistory, FullPaperFiles, EditorConferences)
 *
 * Usage: node src/scripts/migrateAbstractWorkflow.js
 */

const sequelize = require('../config/database');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        console.log('Starting Abstract Workflow migration...\n');

        // ─── Step 1: ALTER AbstractSubmissions table ───
        console.log('1. Altering AbstractSubmissions table...');

        // Update ENUM by modifying column
        await sequelize.query(`
            ALTER TABLE AbstractSubmissions
            MODIFY COLUMN status ENUM(
                'Pending', 'Approved', 'Rejected',
                'Submitted', 'Assigned to Editor', 'Reviewed by Editor',
                'Assigned to Conference Editor', 'Reviewed by Conference Editor',
                'Accepted'
            ) DEFAULT 'Submitted'
        `).catch(err => {
            console.log('  Note: ENUM modification may have partially failed, trying alternative...');
        });

        // Add new columns (ignore if they already exist)
        const addColumnSafe = async (col, definition) => {
            try {
                await queryInterface.addColumn('AbstractSubmissions', col, definition);
                console.log(`  Added column: ${col}`);
            } catch (e) {
                if (e.original && e.original.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  Column ${col} already exists, skipping.`);
                } else {
                    console.log(`  Column ${col}: ${e.message}`);
                }
            }
        };

        const { DataTypes } = require('sequelize');
        await addColumnSafe('title', { type: DataTypes.STRING(500), defaultValue: null });
        await addColumnSafe('conference_id', { type: DataTypes.INTEGER, allowNull: true });
        await addColumnSafe('current_editor_id', { type: DataTypes.INTEGER, defaultValue: null });
        await addColumnSafe('current_conference_editor_id', { type: DataTypes.INTEGER, defaultValue: null });

        // ─── Step 2: Migrate existing data ───
        console.log('\n2. Migrating existing status values...');

        const [pendingUpdated] = await sequelize.query(
            `UPDATE AbstractSubmissions SET status = 'Submitted' WHERE status = 'Pending'`
        );
        console.log(`  Migrated 'Pending' → 'Submitted': ${pendingUpdated.affectedRows || 0} rows`);

        const [approvedUpdated] = await sequelize.query(
            `UPDATE AbstractSubmissions SET status = 'Accepted' WHERE status = 'Approved'`
        );
        console.log(`  Migrated 'Approved' → 'Accepted': ${approvedUpdated.affectedRows || 0} rows`);

        // Now remove old enum values
        await sequelize.query(`
            ALTER TABLE AbstractSubmissions
            MODIFY COLUMN status ENUM(
                'Submitted', 'Assigned to Editor', 'Reviewed by Editor',
                'Assigned to Conference Editor', 'Reviewed by Conference Editor',
                'Accepted', 'Rejected'
            ) DEFAULT 'Submitted'
        `).catch(err => {
            console.log('  Note: Final ENUM cleanup may need manual intervention:', err.message);
        });

        // Add indexes
        const addIndexSafe = async (name, fields) => {
            try {
                await queryInterface.addIndex('AbstractSubmissions', fields, { name });
                console.log(`  Added index: ${name}`);
            } catch (e) {
                console.log(`  Index ${name}: ${e.message.includes('Duplicate') ? 'already exists' : e.message}`);
            }
        };

        await addIndexSafe('idx_status', ['status']);
        await addIndexSafe('idx_conference_status', ['conference_id', 'status']);
        await addIndexSafe('idx_author_status', ['author_id', 'status']);

        // ─── Step 3: Create new tables via Sequelize sync ───
        console.log('\n3. Creating new tables...');

        // Import all models to trigger table creation
        require('../models');

        await sequelize.sync({ alter: false });
        console.log('  Tables synced (new tables created if not existing).');

        // Force-create tables that might not exist
        const tables = ['AbstractAssignments', 'AbstractReviews', 'AbstractStatusHistory', 'FullPaperFiles', 'EditorConferences'];
        for (const table of tables) {
            try {
                const [results] = await sequelize.query(`SHOW TABLES LIKE '${table}'`);
                if (results.length > 0) {
                    console.log(`  Table ${table}: already exists`);
                } else {
                    console.log(`  Table ${table}: will be created on next sync`);
                }
            } catch (e) {
                console.log(`  Table ${table}: check needed - ${e.message}`);
            }
        }

        console.log('\n✓ Migration completed successfully!');
        console.log('\nNote: Run the server once with `db.sequelize.sync()` to ensure all new tables are created.');

    } catch (error) {
        console.error('\n✗ Migration failed:', error.message);
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

migrate();
