const fs = require('fs');
const moment = require('moment');

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

module.exports = { getLastSyncTimestamp, setLastSyncTimestamp, parseDate };
