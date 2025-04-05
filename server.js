const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const path = require("path");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection setup
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",        
    password: process.env.DB_PASSWORD || "Snkumar30",  //Change Password 
    database: process.env.DB_NAME || "ayurveda", 
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Serve static HTML files
app.get("/index", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/service", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "services.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// User Registration Endpoint
app.post('/registerform', (req, res) => {
    const { username, password } = req.body;

    const userExistsQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(userExistsQuery, [username], (err, result) => {
        if (err) {
            console.error("Error checking user existence:", err);
            return res.status(500).json({ success: false, message: 'Error checking user' });
        }

        if (result.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).json({ success: false, message: 'Error hashing password' });
            }

            const query = 'INSERT INTO users (username, password1) VALUES (?, ?)';
            db.query(query, [username, hash], (err, result) => {
                if (err) {
                    console.error("Error registering user:", err);
                    return res.status(500).json({ success: false, message: 'Error registering user' });
                }

                res.status(201).json({ success: true, message: 'User registered successfully' });
            });
        });
    });
});

// User Login Endpoint
app.post('/loginform', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, result) => {
        if (err) return res.status(500).send({ success: false, message: 'Error logging in' });
        if (result.length === 0) return res.status(400).send({ success: false, message: 'User not found' });

        const user = result[0];

        bcrypt.compare(password, user.password1, (err, isMatch) => {
            if (err) return res.status(500).send({ success: false, message: 'Error checking password' });
            if (!isMatch) return res.status(400).send({ success: false, message: 'Invalid password' });

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
            res.status(200).send({ success: true, message: 'Login successful', token });
        });
    });
});

// API to handle form submission
app.post('/submit-consultation', (req, res) => {
    const { name, email, phone, consultation_type, message } = req.body;

    const query = `
        INSERT INTO consultations (name, email, phone, consultation_type, message)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [name, email, phone, consultation_type, message], (err, result) => {
        if (err) {
            console.error('Error saving consultation:', err);
            return res.status(500).json({ message: 'Database error occurred.' });
        }

        res.status(200).json({ message: 'Consultation booked successfully!' });
    });
});

// Start the server
app.listen(3001, () => {
    console.log("Server is running on http://localhost:3001");
});