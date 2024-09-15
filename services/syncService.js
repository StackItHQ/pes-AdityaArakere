const { google } = require('googleapis');
const { getClient } = require('../config/googleSheets');
const { getLastSyncTimestamp, setLastSyncTimestamp } = require('./timestampService');
const { createTable, tableExists, getColumnNames, alterTable } = require('./tableService');
const db = require('../config/db');

const googleSheets = google.sheets({ version: "v4" });

// Function to parse date strings into Date objects
const parseDate = (dateString) => {
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

// Function to get the number of columns in the sheet
const getColumnCount = async (client, spreadsheetId) => {
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!1:1', // Fetch the first row to get headers
        auth: client
    });

    const headers = response.data.values[0];
    return headers ? headers.length : 0;
};

// Function to sync Google Sheet to DB
const syncSheetToDb = async () => {
    try {
        const client = await getClient();
        const spreadsheetId = "1P6kgofltfShrdu6UaoL6wtuoE5CybZMQU37qXcLvC74";

        // Get the number of columns
        const columnCount = await getColumnCount(client, spreadsheetId);
        const range = `Sheet1!A:${String.fromCharCode(65 + columnCount - 1)}`; // Construct range dynamically

        // Read rows from spreadsheet
        const response = await googleSheets.spreadsheets.values.get({
            spreadsheetId,
            range,
            auth: client,
        });

        const rows = response.data.values;
        const lastSyncTimestamp = getLastSyncTimestamp();

        console.log('Last Sync Timestamp:', lastSyncTimestamp);
        console.log('Fetched Rows:', rows);

        if (rows.length) {
            // Assuming the first row contains headers
            const headers = rows[0];
            const newRows = rows.slice(1);

            // Check if the table exists; if not, create it
            const tableExistsFlag = await tableExists();
            if (!tableExistsFlag) {
                await createTable(headers);
            } else {
                // Update table schema based on new headers
                const existingColumns = await getColumnNames();
                const newColumns = headers.slice(0, -1);
                console.log('Existing Columns:', existingColumns);
                console.log('New Columns:', newColumns);
                await alterTable(existingColumns, newColumns);
            }

            const newData = newRows.map(row => {
                let rowData = {};
                headers.forEach((header, index) => {
                    if (index < headers.length - 1) { // All columns except the last one
                        rowData[header] = row[index] || ''; // Handle missing values
                    }
                });
                // Explicitly handle the last column as 'timestamp'
                if (row.length > 0) {
                    rowData['timestamp'] = parseDate(row[headers.length - 1]); // Convert last column to timestamp
                }
                return rowData;
            });

            // Filter new/updated rows based on timestamp
            const rowsToInsertOrUpdate = newData.filter(row => {
                const timestamp = row['timestamp'];
                return timestamp && timestamp > lastSyncTimestamp;
            });

            console.log('Rows to insert or update:', rowsToInsertOrUpdate);

            const idsInSheet = newData.map(row => row['Id']);

            // Handle inserts and updates
            for (const newRow of rowsToInsertOrUpdate) {
                const existingRow = await new Promise((resolve, reject) => {
                    db.query('SELECT * FROM dynamic_table WHERE Id = ?', [newRow['Id']], (err, result) => {
                        if (err) {
                            console.error('Error fetching data from DB:', err);
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });

                if (existingRow.length) {
                    // Update the row if data has changed
                    const updateData = { ...newRow };
                    delete updateData['timestamp']; // Remove timestamp from update data
                    await new Promise((resolve, reject) => {
                        const updateQuery = 'UPDATE dynamic_table SET ? WHERE Id = ?';
                        db.query(updateQuery, [updateData, newRow['Id']], (err) => {
                            if (err) {
                                console.error('Error updating data:', err);
                                reject(err);
                            } else {
                                console.log(`Updated ${newRow['Id']} in the database.`);
                                resolve();
                            }
                        });
                    });
                } else {
                    // Insert new row if no matching row found
                    const insertData = { ...newRow };
                    delete insertData['timestamp']; // Remove timestamp from insert data
                    await new Promise((resolve, reject) => {
                        const insertQuery = 'INSERT INTO dynamic_table SET ?';
                        db.query(insertQuery, insertData, (err) => {
                            if (err) {
                                console.error('Error inserting data:', err);
                                reject(err);
                            } else {
                                console.log(`Inserted ${newRow['Id']} into the database.`);
                                resolve();
                            }
                        });
                    });
                }
            }

            // Handle deletions (rows that exist in DB but not in the Google Sheet)
            const dbRows = await new Promise((resolve, reject) => {
                db.query('SELECT Id FROM dynamic_table', (dbErr, result) => {
                    if (dbErr) {
                        console.error('Error fetching data from DB:', dbErr);
                        reject(dbErr);
                    } else {
                        resolve(result);
                    }
                });
            });

            const dbIds = dbRows.map(row => row.Id);
            for (const dbId of dbIds) {
                if (!idsInSheet.includes(dbId)) {
                    await new Promise((resolve, reject) => {
                        const deleteQuery = 'DELETE FROM dynamic_table WHERE Id = ?';
                        db.query(deleteQuery, [dbId], (err) => {
                            if (err) {
                                console.error('Error deleting data:', err);
                                reject(err);
                            } else {
                                console.log(`Deleted ${dbId} from the database.`);
                                resolve();
                            }
                        });
                    });
                }
            }

            // Update last sync timestamp
            setLastSyncTimestamp();
        } else {
            console.log('No data found in the sheet');
        }
    } catch (error) {
        console.error('Error reading from Google Sheets:', error);
        throw new Error('Error reading from Google Sheets');
    }
};

module.exports = {
    syncSheetToDb
};
