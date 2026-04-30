// Import the express module to handle web server routing
const express = require('express');
const mysql = require('mysql2');
// Import cors to allow the frontend to make requests to the backend without cross-origin errors
const cors = require('cors');
// Import the built-in path module to safely join directory paths
const path = require('path');

// Initialize the express application instance
const app = express();
// Define the port the server will listen on
const port = process.env.PORT || 3000;

// Middleware configurations
app.use(cors());
// Apply the express.json middleware to automatically parse incoming JSON payloads
app.use(express.json());
// Serve static files from the 'public' directory - this allows us to access index.html, app.js, etc.
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection pool
const pool = mysql.createPool({
    //host: 'localhost',
    // The username used to authenticate
    //user: 'root',
    user: 'cs348-threat-intel-project',
    // The password for the user (empty for default local Homebrew installation)
    password: '',
    // The specific database name to connect to
    database: 'threat_intel',
    // tells App Engine to connect to Cloud SQL securely via a Unix socket
    socketPath: '/cloudsql/cs348-threat-intel-project:us-central1:threat-intel-db',
    // Wait for available connections if the pool is full
    waitForConnections: true,
    // Maximum number of connections in the pool
    connectionLimit: 10,
    // Maximum number of connection requests to queue (0 = no limit)
    queueLimit: 0
});

// Test the database connection
pool.getConnection((err, conn) => {
    // If there is an error connecting, log it to the console
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        // If successful, log a success message
        console.log('Successfully connected to MySQL database: threat_intel');
        // Release the connection back to the pool --> can be used by others
        conn.release();
    }
});

// API Routes

// GET route to fetch all Threat Actors from the database
app.get('/api/actors', (req, res) => {
    // SQL query to select everything from the ThreatActors table
    pool.query('SELECT * FROM ThreatActors', (err, results) => {
        // If the query fails, return a 500 Internal Server Error 
        if (err) return res.status(500).json({ error: err.message });
        // If successful, send the array of actor records back as JSON
        res.json(results);
    });
});


// GET Indicators of Compromise (optional filters)
app.get('/api/iocs', (req, res) => {
    // Base SQL query that joins IOCs with their corresponding Threat Actor's name
    let query = `
        SELECT i.*, a.name as actor_name 
        FROM IndicatorsOfCompromise i
        JOIN ThreatActors a ON i.actor_id = a.id
        WHERE 1=1
    `;
    // Array to hold the dynamic values for the WHERE clause
    const params = [];

    // Check if an actor_id filter was given in the query string
    if (req.query.actor_id) {
        // Append an AND clause to filter by actor_id
        query += ' AND i.actor_id = ?';
        // Add the actor_id to the parameters array
        params.push(req.query.actor_id);
    }
    // Check if a severity filter was provided
    if (req.query.severity) {
        // Append an AND clause to filter by severity
        query += ' AND i.severity = ?';
        // Add the severity to the parameters array
        params.push(req.query.severity);
    }
    // Check if an ioc_type filter was provided
    if (req.query.ioc_type) {
        // Append an AND clause to filter by ioc_type
        query += ' AND i.ioc_type = ?';
        // Add the ioc_type to the parameters array
        params.push(req.query.ioc_type);
    }

    // Sort results descending by ID
    query += ' ORDER BY i.id DESC';

    // Execute the final constructed query with the collected parameters
    pool.query(query, params, (err, results) => {
        // If there's an error, send a 500 status and the error message
        if (err) return res.status(500).json({ error: err.message });
        // If successful, send the array of IOC records back as JSON
        res.json(results);
    });
});

// POST route to add a new IOC to the database
app.post('/api/iocs', (req, res) => {
    // Extract the incoming data from the request body
    const { actor_id, ioc_value, ioc_type, severity, description } = req.body;

    // Validate the required fields
    if (!actor_id || !ioc_value || !ioc_type || !severity) {
        // If any required field is missing, return a 400 status code
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // SQL query to insert a new row into the IndicatorsOfCompromise table
    // prepared statements are used here to avoid SQL injection attacks
    // without them, an attacker could inject malicious SQL code into the database
    const query = 'INSERT INTO IndicatorsOfCompromise (actor_id, ioc_value, ioc_type, severity, description) VALUES (?, ?, ?, ?, ?)';
    // Execute the query, passing the values from the request
    // input array is safely sanitized before execution
    pool.query(query, [actor_id, ioc_value, ioc_type, severity, description], (err, result) => {
        // If there's a database error, return a 500 status
        if (err) return res.status(500).json({ error: err.message });
        // On success, return the ID of the newly inserted row and a success message
        res.json({ id: result.insertId, message: 'IOC added successfully' });
    });
});

// PUT route to update an existing IOC
app.put('/api/iocs/:id', (req, res) => {
    // Extract the ID from the URL parameters
    const { id } = req.params;
    // Extract the updated data from the request body
    const { actor_id, ioc_value, ioc_type, severity, description } = req.body;

    // SQL query to update the specific fields for the given row ID
    const query = `
        UPDATE IndicatorsOfCompromise 
        SET actor_id = ?, ioc_value = ?, ioc_type = ?, severity = ?, description = ?
        WHERE id = ?
    `;

    // Execute the query with the updated values and the ID at the end
    pool.query(query, [actor_id, ioc_value, ioc_type, severity, description, id], (err, result) => {
        // Handle database errors
        if (err) return res.status(500).json({ error: err.message });
        // If no rows were changed, it means the ID doesn't exist; return 404 Not Found
        if (result.affectedRows === 0) return res.status(404).json({ error: 'IOC not found' });
        // Acknowledge the successful update
        res.json({ message: 'IOC updated successfully' });
    });
});

// DELETE route to remove an existing IOC
app.delete('/api/iocs/:id', (req, res) => {
    // Extract the ID from the URL parameters
    const { id } = req.params;
    // Execute a SQL query to delete the row with the matching ID
    pool.query('DELETE FROM IndicatorsOfCompromise WHERE id = ?', [id], (err, result) => {
        // Handle database errors
        if (err) return res.status(500).json({ error: err.message });
        // If no rows were deleted, the ID wasn't found, return 404 Not Found
        if (result.affectedRows === 0) return res.status(404).json({ error: 'IOC not found' });
        // Acknowledge the successful deletion
        res.json({ message: 'IOC deleted successfully' });
    });
});

// Added Transaction & Isolation Level logic in this POST route
// This prevents the application from being vulnerable to dirty reads
// Two operations are performed: inserting a new Threat Actor into the ThreatActors table 
// and inserting a new IOC into the IndicatorsOfCompromise table
// executed as a single transaction to ensure atomicity
app.post('/api/actors-with-ioc', async (req, res) => {
    // Extract the incoming data from the JSON payload sent by the post request
    const { name, org_type, origin_country, ioc_value, ioc_type, severity, description } = req.body;

    // Since multiple steps are involved in the transaction, use getConnection
    // --> to ensure that all queries are executed on the same database connection
    pool.getConnection(async (err, connection) => {
        // If there is an error connecting, return a 500 Internal Server Error
        if (err) return res.status(500).json({ error: 'Database connection failed' });

        try {

            // Set the transaction isolation level to READ COMMITTED
            // --> ensures that this transaction only reads data that has been successfully committed
            // --> prevents "dirty reads" where one transaction reads uncommitted changes from another
            await connection.promise().query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED');


            // call beginTransaction on the connection to start the transaction
            // which means the following queries are part of a single atomic transaction
            await connection.promise().beginTransaction();

            // Insert the Threat Actor record into the database
            // SQL Injection protection via prepared statements
            const actorQuery = 'INSERT INTO ThreatActors (name, org_type, origin_country) VALUES (?, ?, ?)';
            // execute the query with the respective values from the request
            // input array is safely sanitized before execution
            const [actorResult] = await connection.promise().query(actorQuery, [name, org_type, origin_country]);
            // store the ID of the new actor
            const newActorId = actorResult.insertId;

            // Insert the related IOC record into the database
            // SQL Injection protection via prepared statements
            const iocQuery = 'INSERT INTO IndicatorsOfCompromise (actor_id, ioc_value, ioc_type, severity, description) VALUES (?, ?, ?, ?, ?)';
            // execute the query with the respective values from the request
            // input array is safely sanitized before execution
            await connection.promise().query(iocQuery, [newActorId, ioc_value, ioc_type, severity, description]);

            // Commit the transaction to the database after both queries succeed
            await connection.promise().commit();

            // Return a success message with the ID of the newly created actor
            res.json({ message: 'Transaction successful: Threat Actor and IOC added', actor_id: newActorId });
        } catch (error) {
            // If any error occurs in the steps above (ex. invalid data, database crash, etc.),
            // --> rollback the transaction which means none of the previous changes are saved
            // --> guarantees data consistency: won't have a Threat Actor that has no IOC, or vice versa
            await connection.promise().rollback();
            res.status(500).json({ error: 'Transaction failed and rolled back', details: error.message });
        } finally {
            // Release the connection so that it can be used by other operations
            connection.release();
        }
    });
});

// Start Express server
app.listen(port, () => {
    // Print a message to the console once the server is successfully running
    console.log(`Server is running at http://localhost:${port}`);
});