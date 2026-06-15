import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database in the backend directory (or persistent disk on Render)
const dbDir = process.env.RENDER ? '/var/data' : __dirname;

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'mentibymaps.db');
console.log('Connecting to SQLite database at:', dbPath);
const db = new DatabaseSync(dbPath);

// Create required tables automatically on startup if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    start_destination TEXT,
    end_destination TEXT,
    map_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

/**
 * Execute a SQL query on the SQLite database.
 * Translates PostgreSQL-style parameter placeholders ($1, $2...) to SQLite placeholders (?).
 * Returns an object with `rows` and `rowCount` to maintain compatibility with the pg driver.
 */
export const query = async (text, params) => {
  try {
    // Translate PG $1, $2 placeholders to SQLite ? placeholders
    const translatedSql = text.replace(/\$\d+/g, '?');
    
    const stmt = db.prepare(translatedSql);
    
    // Bind parameters and run
    const rows = params && params.length > 0 ? stmt.all(...params) : stmt.all();
    
    return {
      rows: rows,
      rowCount: rows.length
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};
