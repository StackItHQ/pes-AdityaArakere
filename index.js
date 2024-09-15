const express = require('express');
const { syncSheetToDb } = require('./services/syncService');

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
    try {
        await syncSheetToDb();
        res.status(200).send('Sync completed successfully');
    } catch (error) {
        res.status(500).send('Error during sync: ' + error.message);
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
