import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let sqliteDb = null;

// Use Postgres if DATABASE_URL is provided (Render production)
if (process.env.DATABASE_URL) {
  console.log('Connecting to PostgreSQL database...');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for secure Render/Supabase connection
    }
  });

  // Create tables in PostgreSQL (using SERIAL for primary keys)
  pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      username VARCHAR(255) PRIMARY KEY,
      password VARCHAR(255) NOT NULL
    );
  `).catch(err => console.error('Error creating users table:', err));

  pool.query(`
    CREATE TABLE IF NOT EXISTS history (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255),
      start_destination TEXT,
      end_destination TEXT,
      map_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `).catch(err => console.error('Error creating history table:', err));

} else {
  // Fallback to SQLite (Local development)
  const dbPath = path.join(__dirname, 'mentibymaps.db');
  console.log('Connecting to local SQLite database at:', dbPath);
  sqliteDb = new DatabaseSync(dbPath);

  // Create required tables in SQLite
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL
    );
  `);

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      start_destination TEXT,
      end_destination TEXT,
      map_type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Execute a SQL query on the database.
 * Seamlessly handles connection routing and query syntax compatibility.
 */
export const query = async (text, params) => {
  if (pool) {
    // PostgreSQL mode
    const res = await pool.query(text, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount
    };
  } else {
    // SQLite mode
    try {
      const translatedSql = text.replace(/\$\d+/g, '?');
      const stmt = sqliteDb.prepare(translatedSql);
      const rows = params && params.length > 0 ? stmt.all(...params) : stmt.all();
      
      return {
        rows: rows,
        rowCount: rows.length
      };
    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  }
};
