import express from 'express';
import bodyParser from 'body-parser';
import { query } from './database.js';
import cors from 'cors';  // Correct import for ES Modules

const app = express();
const PORT = 3000;


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  next();
});

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Welcome to the login system!');
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const sqlQuery = 'SELECT * FROM users WHERE username = $1 AND password = $2';
    const result = await query(sqlQuery, [username, password]);

    if (result.rows.length == 1) {
      res.status(200).json({ message: 'Login successful', user: result.rows[0] });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});









app.post('/sign-up', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const checkUserQuery = 'SELECT * FROM users WHERE username = $1';
    const userExists = await query(checkUserQuery, [username]);

    if (userExists.rowCount > 0) {
      return res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
    }

    const insertUserQuery = 'INSERT INTO users (username, password) VALUES ($1, $2)';
    await query(insertUserQuery, [username, password]);

    res.status(201).json({ message: 'User successfully registered!' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/set-history', async (req, res) => {
  const { startDestination, endDestination, maptype, username } = req.body;

  try {
    const sqlQuery = `
      INSERT INTO history (start_destination, end_destination, map_type, username)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await query(sqlQuery, [startDestination, endDestination, maptype, username]);

    res.status(201).json({
      message: 'History record added successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error adding history record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/get-full-history', async (req, res) => {
  try {
    const sqlQuery = `
      SELECT username, created_at, start_destination, end_destination, map_type
      FROM history
      ORDER BY username, created_at;
    `;

    const result = await query(sqlQuery);
    
    const groupedData = result.rows.reduce((acc, row) => {
      const { username, created_at, start_destination, end_destination, map_type} = row;
      
      let user = acc.find((u) => u.userName === username);
      if (!user) {
        user = { userName: username, date: created_at, locations: [] };
        acc.push(user);
      }
      
      user.locations.push({ startLocation: start_destination, endLocation: end_destination, maptype:map_type});
      return acc;
    }, []);

    res.status(200).json({
      message: 'Grouped history retrieved successfully',
      data: groupedData,
    });
  } catch (error) {
    console.error('Error retrieving grouped history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/update-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Username, current password, and new password are required.' });
  }

  try {
    const checkQuery = 'SELECT * FROM users WHERE username = $1 AND password = $2';
    const userResult = await query(checkQuery, [username, currentPassword]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const updateQuery = 'UPDATE users SET password = $1 WHERE username = $2';
    await query(updateQuery, [newPassword, username]);

    res.status(200).json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/clear-history', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    const deleteQuery = 'DELETE FROM history WHERE username = $1';
    await query(deleteQuery, [username]);

    res.status(200).json({ message: 'History cleared successfully!' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
