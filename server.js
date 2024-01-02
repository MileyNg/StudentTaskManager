const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3001;

// Serve static files from the root folder
app.use(express.static(path.join(__dirname, 'public')));

// Express middleware to parse JSON requests
app.use(express.json());

// Configure the PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  database: 'Student Task Manager',
  user: 'postgres',
  password: 'EngData',
  port: 5432,
});

// Define a route to add a task
app.post('/api/tasks', async (req, res) => {
  try {
    const { description, deadline, completionstatus } = req.body;
    const result = await pool.query(
      'INSERT INTO tasks (description, deadline, completionstatus) VALUES ($1, $2, $3) RETURNING *',
      [description, deadline, completionstatus]
    );
    const addedTask = result.rows[0];
    console.log('Task added:', addedTask);
    res.json(addedTask);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Catch-all route for serving React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
