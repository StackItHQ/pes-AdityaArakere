const mysql = require('mysql');

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

module.exports = db;