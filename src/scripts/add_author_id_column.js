const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

(async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        // The table name is 'AbstractSubmissions' (pluralized by default)
        console.log('Attempting to add author_id column to AbstractSubmissions table...');

        await queryInterface.addColumn('AbstractSubmissions', 'author_id', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        });

        console.log('Successfully added author_id column to AbstractSubmissions table.');
    } catch (error) {
        console.error('Error adding column:', error.message);
    } finally {
        // Force close usage to allow script to exit
        if (sequelize) {
            await sequelize.close();
        }
    }
})();
