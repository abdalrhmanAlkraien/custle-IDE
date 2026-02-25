import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use in-memory DB during tests, file-backed otherwise
const DB_PATH = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(process.cwd(), 'data', 'custle.db');

// Ensure data directory exists for file-backed mode
if (DB_PATH !== ':memory:') {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db: Database.Database = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS github_credentials (
    id           INTEGER PRIMARY KEY DEFAULT 1,
    token        TEXT NOT NULL,
    username     TEXT NOT NULL,
    avatar_url   TEXT,
    name         TEXT,
    connected_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS github_repos (
    id           INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    full_name    TEXT NOT NULL UNIQUE,
    description  TEXT,
    private      INTEGER NOT NULL DEFAULT 0,
    clone_url    TEXT NOT NULL,
    ssh_url      TEXT NOT NULL,
    html_url     TEXT NOT NULL,
    language     TEXT,
    updated_at   TEXT NOT NULL,
    stargazers   INTEGER DEFAULT 0,
    fork         INTEGER DEFAULT 0
  );
`);

export default db;
