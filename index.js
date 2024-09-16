const express = require('express');
const { syncSheetToDb } = require('./services/syncService');
const { syncDbChangesToSheet } = require('./services/dbChangeListener');

const app = express();
app.use(express.json());

// Sync DB changes to Google Sheets every 10 seconds
setInterval(syncDbChangesToSheet, 8000); // Check for DB changes every 10 seconds

// Sync Google Sheets to DB every 10 seconds
setInterval(syncSheetToDb, 8000); // Check for changes in Google Sheets every 10 seconds

app.get("/", (req, res) => {
    res.status(200).send('Periodic synchronization in progress.');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
