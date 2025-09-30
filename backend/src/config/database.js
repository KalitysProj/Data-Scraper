const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = path.join(__dirname, '../../database/inpi_scraper.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      denomination TEXT NOT NULL,
      siren TEXT NOT NULL,
      start_date DATE,
      representatives TEXT,
      legal_form TEXT,
      establishments INTEGER DEFAULT 1,
      address TEXT,
      postal_code TEXT,
      city TEXT,
      department TEXT,
      ape_code TEXT,
      status TEXT DEFAULT 'active',
      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, siren)
    );

    CREATE TABLE IF NOT EXISTS scraping_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      ape_code TEXT,
      department TEXT,
      siege_only INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      found_results INTEGER DEFAULT 0,
      processed_results INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
    CREATE INDEX IF NOT EXISTS idx_companies_siren ON companies(siren);
    CREATE INDEX IF NOT EXISTS idx_companies_department ON companies(department);
    CREATE INDEX IF NOT EXISTS idx_companies_ape_code ON companies(ape_code);
    CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user_id ON scraping_jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
  `);
}

function testConnection() {
  try {
    const result = db.prepare('SELECT 1 as test').get();
    console.log('✅ Connexion SQLite réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion SQLite:', error.message);
    return false;
  }
}

initDatabase();

module.exports = { db, testConnection };