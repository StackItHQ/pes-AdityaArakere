const db = require('../config/db');

// Function to create a new table based on column names, excluding the last column
const createTable = async (columns) => {
    // Exclude the last column (timestamp) from the table creation
    const columnsToCreate = columns.slice(0, -1); // Exclude the last column
    const columnDefinitions = columnsToCreate.map(col => `${col} VARCHAR(255)`).join(', ');
    const createTableQuery = `CREATE TABLE IF NOT EXISTS dynamic_table (${columnDefinitions})`;

    return new Promise((resolve, reject) => {
        db.query(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating table:', err);
                reject(err);
            } else {
                console.log('Table created or already exists.');
                resolve();
            }
        });
    });
};

// Function to check if the table exists
const tableExists = async () => {
    return new Promise((resolve, reject) => {
        db.query("SHOW TABLES LIKE 'dynamic_table'", (err, result) => {
            if (err) {
                console.error('Error checking table existence:', err);
                reject(err);
            } else {
                resolve(result.length > 0);
            }
        });
    });
};

module.exports = {
    createTable,
    tableExists
};
