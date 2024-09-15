const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { google } = require('googleapis');
const fs = require('fs');
const moment = require('moment');

const app = express();
app.use(bodyParser.json());

// Set up the connection to the database
const db = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "aditya11",
    database: "superjoin",
});

// Connect to the database
db.connect(err => {
    if (err) throw err;
    console.log('Connected to the database.');
});

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

// Create client instance for auth
const getClient = async () => {
    const client = await auth.getClient();
    return client;
};

// Instance of Google Sheets API
const googleSheets = google.sheets({ version: "v4" });

// Path to store the last processed timestamp
const timestampFile = 'last_sync_timestamp.txt';

// Read last sync timestamp from a file
const getLastSyncTimestamp = () => {
    try {
        return new Date(fs.readFileSync(timestampFile, 'utf8'));
    } catch {
        return new Date(0); // Return epoch if no timestamp file exists
    }
};

// Write current timestamp to a file
const setLastSyncTimestamp = () => {
    fs.writeFileSync(timestampFile, new Date().toISOString());
};

// Parse date string into a Date object
const parseDate = (dateString) => {
    const parsedDate = moment(dateString, [moment.ISO_8601, 'M/D/YYYY', 'M/DD/YYYY', 'MM/DD/YYYY'], true).toDate();
    if (isNaN(parsedDate.getTime())) {
        console.warn(`Invalid date format: ${dateString}`);
        return null;
    }
    return parsedDate;
};

app.get("/", async (req, res) => {
    try {
        const client = await getClient();
        const spreadsheetId = "1P6kgofltfShrdu6UaoL6wtuoE5CybZMQU37qXcLvC74";
        const range = "Sheet1!A:D"; // Adjust the range based on your needs

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

            // Fetch existing rows from the database
            db.query('SELECT unique_id, name, task FROM people', (dbErr, dbRows) => {
                if (dbErr) {
                    console.error('Error fetching data from DB:', dbErr);
                    res.status(500).send('Error fetching data from DB');
                    return;
                }

                const dbData = dbRows.map(row => ({
                    unique_id: row.unique_id,
                    name: row.name,
                    task: row.task
                }));

                const newData = newRows.map(row => ({
                    unique_id: row[0], // Assuming unique_id in column A
                    name: row[1],     // Assuming name in column B
                    task: row[2],     // Assuming task in column C
                    timestamp: parseDate(row[3]) // Assuming timestamp in column D
                }));

                // Filter new/updated rows based on timestamp
                const rowsToInsertOrUpdate = newData.filter(row => row.timestamp > lastSyncTimestamp);
                const idsInSheet = newData.map(row => row.unique_id);

                // Handle inserts and updates
                rowsToInsertOrUpdate.forEach(newRow => {
                    const existingRow = dbData.find(dbRow => dbRow.unique_id === newRow.unique_id);

                    if (existingRow) {
                        // Update the row if data has changed
                        if (existingRow.name !== newRow.name || existingRow.task !== newRow.task) {
                            const updateQuery = 'UPDATE people SET name = ?, task = ? WHERE unique_id = ?';
                            db.query(updateQuery, [newRow.name, newRow.task, newRow.unique_id], (err) => {
                                if (err) console.error('Error updating data:', err);
                                else console.log(`Updated ${newRow.unique_id} in the database.`);
                            });
                        }
                    } else {
                        // Insert new row if no matching row found
                        if(!newRow.unique_id == ""){
                          const insertQuery = 'INSERT INTO people (unique_id, name, task) VALUES (?, ?, ?)';
                          db.query(insertQuery, [newRow.unique_id, newRow.name, newRow.task], (err) => {
                              if (err) console.error('Error inserting data:', err);
                              else console.log(`Inserted ${newRow.unique_id} into the database.`);
                          });
                        }
                    }
                });

                // Handle deletions (rows that exist in DB but not in the Google Sheet)
                dbData.forEach(dbRow => {
                    if (!idsInSheet.includes(dbRow.unique_id)) {
                        const deleteQuery = 'DELETE FROM people WHERE unique_id = ?';
                        db.query(deleteQuery, [dbRow.unique_id], (err) => {
                            if (err) console.error('Error deleting data:', err);
                            else console.log(`Deleted ${dbRow.unique_id} from the database.`);
                        });
                    }
                });

                // Update last sync timestamp
                setLastSyncTimestamp();
                res.status(200).send('Sync completed successfully');
            });
        } else {
            res.status(404).send('No data found in the sheet');
        }
    } catch (error) {
        console.error('Error reading from Google Sheets:', error);
        res.status(500).send('Error reading from Google Sheets');
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
