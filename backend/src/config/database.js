const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la connexion MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inpi_scraper',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Créer le pool de connexions MySQL
const pool = mysql.createPool(dbConfig);

// Fonction pour exécuter des requêtes avec promesses
async function runQuery(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return {
      lastID: result.insertId,
      changes: result.affectedRows
    };
  } catch (error) {
    throw error;
  }
}

async function getQuery(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } catch (error) {
    throw error;
  }
}

async function allQuery(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Test de connexion
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Connexion à MySQL réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  runQuery,
  getQuery,
  allQuery,
  testConnection
};