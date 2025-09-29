const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Créer le répertoire database s'il n'existe pas
const dbDir = path.dirname(process.env.DB_PATH || './database/inpi_scraper.db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './database/inpi_scraper.db';

// Créer la connexion SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à SQLite:', err.message);
  } else {
    console.log('✅ Connexion à SQLite réussie');
  }
});

// Fonction pour exécuter des requêtes avec promesses
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Test de connexion
async function testConnection() {
  try {
    await getQuery('SELECT 1 as test');
    console.log('✅ Test de connexion SQLite réussi');
    return true;
  } catch (error) {
    console.error('❌ Erreur de test de connexion SQLite:', error.message);
    return false;
  }
}

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery,
  testConnection
};