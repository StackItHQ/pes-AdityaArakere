const db = require('../config/db');

const dropTrigger = (triggerName) => {
    return new Promise((resolve, reject) => {
        db.query(`DROP TRIGGER IF EXISTS ${triggerName}`, (err) => {
            if (err) {
                console.error(`Error dropping trigger ${triggerName}:`, err);
                reject(err);
            } else {
                console.log(`Trigger ${triggerName} dropped.`);
                resolve();
            }
        });
    });
};

const disableTriggers = async () => {
    try {
        await dropTrigger('sync_insert');
        await dropTrigger('sync_update');
        await dropTrigger('sync_delete');
    } catch (err) {
        console.error('Error dropping triggers:', err);
    }
};

const createTrigger = (triggerSQL) => {
    return new Promise((resolve, reject) => {
        db.query(triggerSQL, (err) => {
            if (err) {
                console.error('Error creating trigger:', err);
                reject(err);
            } else {
                console.log('Trigger created.');
                resolve();
            }
        });
    });
};

const enableTriggers = async () => {
    try {
        const insertTriggerSQL = `
            CREATE TRIGGER sync_insert
            AFTER INSERT ON dynamic_table
            FOR EACH ROW
            BEGIN
                INSERT INTO sync_changes (row_id, operation) VALUES (NEW.Id, 'INSERT');
            END;
        `;
        const updateTriggerSQL = `
            CREATE TRIGGER sync_update
            AFTER UPDATE ON dynamic_table
            FOR EACH ROW
            BEGIN
                INSERT INTO sync_changes (row_id, operation) VALUES (NEW.Id, 'UPDATE');
            END;
        `;
        const deleteTriggerSQL = `
            CREATE TRIGGER sync_delete
            AFTER DELETE ON dynamic_table
            FOR EACH ROW
            BEGIN
                INSERT INTO sync_changes (row_id, operation) VALUES (OLD.Id, 'DELETE');
            END;
        `;

        await createTrigger(insertTriggerSQL);
        await createTrigger(updateTriggerSQL);
        await createTrigger(deleteTriggerSQL);
    } catch (err) {
        console.error('Error recreating triggers:', err);
    }
};

// Function to create a new table based on column names
const createTable = async (columns) => {
    // const columnsToCreate = columns.slice(0, -1); // Exclude the last column
    console.log('Columns to create:', columns);
    const columnDefinitions = columns.map(col => `${col} VARCHAR(255)`).join(', ');
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

// Function to get existing column names
const getColumnNames = async () => {
    return new Promise((resolve, reject) => {
        db.query("SHOW COLUMNS FROM dynamic_table", (err, result) => {
            if (err) {
                console.error('Error fetching column names:', err);
                reject(err);
            } else {
                const columns = result.map(row => row.Field);
                resolve(columns);
            }
        });
    });
};

// Function to alter the table based on new columns
const alterTable = async (existingColumns, newColumns) => {
    const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col));
    const columnsToRemove = existingColumns.filter(col => !newColumns.includes(col));

    // Add new columns
    for (const col of columnsToAdd) {
        const addColumnQuery = `ALTER TABLE dynamic_table ADD COLUMN ${col} VARCHAR(255)`;
        await new Promise((resolve, reject) => {
            db.query(addColumnQuery, (err) => {
                if (err) {
                    console.error(`Error adding column ${col}:`, err);
                    reject(err);
                } else {
                    console.log(`Added column ${col} to the table.`);
                    resolve();
                }
            });
        });
    }

    // Remove obsolete columns
    for (const col of columnsToRemove) {
        const dropColumnQuery = `ALTER TABLE dynamic_table DROP COLUMN ${col}`;
        await new Promise((resolve, reject) => {
            db.query(dropColumnQuery, (err) => {
                if (err) {
                    console.error(`Error removing column ${col}:`, err);
                    reject(err);
                } else {
                    console.log(`Removed column ${col} from the table.`);
                    resolve();
                }
            });
        });
    }
};

module.exports = {
    createTable,
    tableExists,
    getColumnNames,
    alterTable,
    disableTriggers,
    enableTriggers
};
