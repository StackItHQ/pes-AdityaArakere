const db = require('../config/db');
const { googleSheets, getClient } = require('../config/googleSheets');
const { disableTriggers, enableTriggers } = require('./tableService');

// Function to get changes from the sync_changes table
const getSyncChanges = async () => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM sync_changes', (err, result) => {
            if (err) {
                console.error('Error fetching sync changes:', err);
                reject(err);
            } else {
                console.log('Fetched sync changes:', result);
                resolve(result);
            }
        });
    });
};

// Function to delete processed changes from sync_changes table
const deleteProcessedChange = async (changeId) => {
    return new Promise((resolve, reject) => {
        db.query('DELETE FROM sync_changes WHERE id = ?', [changeId], (err) => {
            if (err) {
                console.error('Error deleting sync change:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// Function to fetch full row data by row_id from dynamic_table
const getRowDataById = async (row_id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM dynamic_table WHERE Id = ?', [row_id], (err, result) => {
            if (err) {
                console.error('Error fetching row data:', err);
                reject(err);
            } else {
                resolve(result[0]); // Assuming only one row is returned
            }
        });
    });
};

// Function to update Google Sheets based on DB changes
const updateSheet = async (spreadsheetId, changes) => {
    await disableTriggers();
    const client = await getClient();
    const sheetName = 'Sheet1';

    for (const change of changes) {
        const { id, operation, row_id } = change; // Using 'operation' to match the table schema

        if (operation === 'INSERT') {
            // Fetch the full row data from DB
            const rowData = await getRowDataById(row_id);

            // Extract values dynamically from rowData and ensure it is a 2D array
            const values = Object.values(rowData);
            const formattedValues = [values];
            
            // Insert a new row into Google Sheets
            await googleSheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetName}!A:A`, // Append data to the end of the sheet
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: formattedValues, // Use the correctly formatted values
                },
                auth: client,
            });
            console.log(`Inserted row with ID ${row_id} into Google Sheets.`);

        } else if (operation === 'UPDATE') {
            // Fetch the full row data from DB for the updated row
            const rowData = await getRowDataById(row_id);

            // Ensure rowData values are in a 2D array format
            const values = Object.values(rowData);
            const formattedValues = [values];

            // Update existing row in Google Sheets
            await googleSheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A${row_id + 1}`, // Assuming row_id maps to the row number in the sheet
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: formattedValues, // Use the correctly formatted values
                },
                auth: client,
            });
            console.log(`Updated row with ID ${row_id} in Google Sheets.`);

        } else if (operation === 'DELETE') {
            // Handle DELETE operation
            console.log(`Row with ID ${row_id} should be deleted in Google Sheets.`);
            
            // Workaround for row deletion: Fetch sheet values, find the row, and delete it manually
            const sheetData = await googleSheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName}!A:Z`, // Assuming A:Z range to get all columns
                auth: client,
            });
            
            const rows = sheetData.data.values || [];
            const rowIndex = rows.findIndex(row => row[0] == row_id); // Find the row index by ID

            if (rowIndex > -1) {
                // Delete row by clearing it (or mark it as deleted in some other way)
                await googleSheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!A${rowIndex + 1}:Z${rowIndex + 1}`, // Clear the row from the sheet
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']], // Clear all cells in the row
                    },
                    auth: client,
                });
                console.log(`Deleted row with ID ${row_id} in Google Sheets.`);
            }
        }

        // After processing, delete the change from sync_changes table
        await deleteProcessedChange(id);
    }
    await enableTriggers();
};

// Main sync function to be periodically invoked
const syncDbChangesToSheet = async () => {
    try {
        
        const changes = await getSyncChanges();
        // console.log(changes);
        if (changes.length > 0) {
            const spreadsheetId = "1P6kgofltfShrdu6UaoL6wtuoE5CybZMQU37qXcLvC74"; // Add your Google Sheets ID here
            await updateSheet(spreadsheetId, changes);
        } else {
            console.log('No new changes to sync.');
        }
        
    } catch (error) {
        console.error('Error syncing DB changes to Google Sheets:', error);
    }
};

module.exports = { syncDbChangesToSheet };
