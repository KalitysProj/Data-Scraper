#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🚀 Configuration de la base de données INPI Scraper...\n');

    // Étape 1: Connexion à MySQL (sans base de données)
    console.log('📡 Connexion à MySQL...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    console.log('✅ Connexion MySQL établie\n');

    // Étape 2: Créer la base de données
    console.log('📦 Création de la base de données...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'inpi_scraper'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Base de données '${process.env.DB_NAME || 'inpi_scraper'}' créée\n`);
    
    // Étape 3: Utiliser la base de données
    await connection.execute(`USE ${process.env.DB_NAME || 'inpi_scraper'}`);

    // Étape 4: Créer l'utilisateur dédié (si différent de root)
    if (process.env.DB_USER && process.env.DB_USER !== 'root') {
      console.log('👤 Création de l\'utilisateur dédié...');
      try {
        await connection.execute(`CREATE USER IF NOT EXISTS '${process.env.DB_USER}'@'localhost' IDENTIFIED BY '${process.env.DB_PASSWORD}'`);
        await connection.execute(`GRANT ALL PRIVILEGES ON ${process.env.DB_NAME}.* TO '${process.env.DB_USER}'@'localhost'`);
        await connection.execute('FLUSH PRIVILEGES');
        console.log(`✅ Utilisateur '${process.env.DB_USER}' créé et configuré\n`);
      } catch (error) {
        console.log(`⚠️  Utilisateur '${process.env.DB_USER}' existe déjà\n`);
      }
    }

    // Étape 5: Créer les tables
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
    console.log('✅ Table users créée');

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
    console.log('✅ Table companies créée');

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
    console.log('✅ Table scraping_jobs créée');

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
    console.log('✅ Table activity_logs créée\n');

    // Étape 6: Créer les index
    console.log('🔍 Création des index...');
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
    console.log('✅ Index créés\n');

    // Étape 7: Créer l'utilisateur de test
    console.log('👤 Création de l\'utilisateur de test...');
    const testUserId = uuidv4();
    const testPassword = await bcrypt.hash('test123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, subscription_plan, api_requests_limit)
      VALUES (?, 'test@example.com', ?, 'Test', 'User', 'pro', 10000)
    `, [testUserId, testPassword]);
    console.log('✅ Utilisateur de test créé\n');

    // Étape 8: Insérer quelques données de démonstration
    console.log('📊 Insertion de données de démonstration...');
    const demoCompanies = [
      {
        id: uuidv4(),
        denomination: 'TECH INNOVATION SARL',
        siren: '123456789',
        start_date: '2020-01-15',
        representatives: JSON.stringify(['Jean DUPONT', 'Marie MARTIN']),
        legal_form: 'SARL',
        establishments: 2,
        department: '69',
        ape_code: '6201Z',
        address: '123 Rue de la Tech',
        postal_code: '69000',
        city: 'Lyon',
        user_id: testUserId
      },
      {
        id: uuidv4(),
        denomination: 'AGRI SOLUTIONS SAS',
        siren: '987654321',
        start_date: '2019-06-10',
        representatives: JSON.stringify(['Pierre BERNARD']),
        legal_form: 'SAS',
        establishments: 1,
        department: '01',
        ape_code: '0121Z',
        address: '456 Avenue des Champs',
        postal_code: '01000',
        city: 'Bourg-en-Bresse',
        user_id: testUserId
      },
      {
        id: uuidv4(),
        denomination: 'COMMERCE PLUS EURL',
        siren: '456789123',
        start_date: '2021-03-20',
        representatives: JSON.stringify(['Sophie LEROY']),
        legal_form: 'EURL',
        establishments: 3,
        department: '75',
        ape_code: '4711B',
        address: '789 Boulevard du Commerce',
        postal_code: '75001',
        city: 'Paris',
        user_id: testUserId
      }
    ];

    for (const company of demoCompanies) {
      await connection.execute(`
        INSERT IGNORE INTO companies 
        (id, denomination, siren, start_date, representatives, legal_form, establishments, 
         department, ape_code, address, postal_code, city, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        company.id, company.denomination, company.siren, company.start_date,
        company.representatives, company.legal_form, company.establishments,
        company.department, company.ape_code, company.address,
        company.postal_code, company.city, company.user_id
      ]);
    }
    console.log('✅ Données de démonstration insérées\n');

    console.log('🎉 Configuration terminée avec succès !');
    console.log('📧 Utilisateur de test : test@example.com / test123');
    console.log('🌐 Vous pouvez maintenant démarrer le backend avec : npm run dev');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration :', error.message);
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