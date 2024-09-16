const { google } = require('googleapis');
const path = require('path');

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '..', 'credentials.json'),
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

// Create client instance for auth
const getClient = async () => {
    const client = await auth.getClient();
    return client;
};

// Instance of Google Sheets API
const googleSheets = google.sheets({ version: "v4" });

module.exports = { googleSheets, getClient };
