const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // Connexion sans spécifier la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('📦 Création de la base de données...');
    
    // Créer la base de données si elle n'existe pas
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'inpi_scraper'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Utiliser la base de données
    await connection.execute(`USE ${process.env.DB_NAME || 'inpi_scraper'}`);

    console.log('📋 Création des tables...');

    // Table des utilisateurs
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        subscription_plan ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
        api_requests_used INT DEFAULT 0,
        api_requests_limit INT DEFAULT 1000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )
    `);

    // Table des entreprises
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(36) PRIMARY KEY,
        denomination VARCHAR(500) NOT NULL,
        siren VARCHAR(9) UNIQUE NOT NULL,
        start_date DATE,
        representatives JSON,
        legal_form VARCHAR(100),
        establishments INT DEFAULT 1,
        department VARCHAR(3),
        ape_code VARCHAR(10),
        address TEXT,
        postal_code VARCHAR(10),
        city VARCHAR(200),
        status ENUM('active', 'inactive', 'radiated') DEFAULT 'active',
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        user_id VARCHAR(36),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Table des tâches de scraping
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS scraping_jobs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        ape_code VARCHAR(10) NOT NULL,
        department VARCHAR(3) NOT NULL,
        siege_only BOOLEAN DEFAULT TRUE,
        status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
        progress INT DEFAULT 0,
        results_found INT DEFAULT 0,
        results_processed INT DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Table des logs
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        action VARCHAR(100) NOT NULL,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('🔍 Création des index...');

    // Index pour les performances
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_companies_siren ON companies(siren)',
      'CREATE INDEX IF NOT EXISTS idx_companies_department ON companies(department)',
      'CREATE INDEX IF NOT EXISTS idx_companies_ape_code ON companies(ape_code)',
      'CREATE INDEX IF NOT EXISTS idx_companies_denomination ON companies(denomination)',
      'CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_companies_scraped_at ON companies(scraped_at)',
      'CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user_id ON scraping_jobs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)'
    ];

    for (const indexQuery of indexes) {
      await connection.execute(indexQuery);
    }

    console.log('👤 Création de l\'utilisateur de test...');

    // Créer un utilisateur de test
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    
    const testUserId = uuidv4();
    const testPassword = await bcrypt.hash('test123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, subscription_plan, api_requests_limit)
      VALUES (?, 'test@example.com', ?, 'Test', 'User', 'pro', 10000)
    `, [testUserId, testPassword]);

    console.log('✅ Base de données configurée avec succès !');
    console.log('📧 Utilisateur de test créé : test@example.com / test123');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { setupDatabase };