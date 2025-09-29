#!/usr/bin/env node

const { runQuery, getQuery, testConnection } = require('./src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🚀 Configuration de la base de données SQLite INPI Scraper...\n');

    // Test de connexion
    console.log('📡 Test de connexion...');
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Impossible de se connecter à SQLite');
    }
    console.log('✅ Connexion SQLite établie\n');

    // Créer les tables
    console.log('📋 Création des tables...');

    // Table des utilisateurs
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        subscription_plan TEXT DEFAULT 'free' CHECK(subscription_plan IN ('free', 'pro', 'enterprise')),
        api_requests_used INTEGER DEFAULT 0,
        api_requests_limit INTEGER DEFAULT 1000,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);
    console.log('✅ Table users créée');

    // Table des entreprises
    await runQuery(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        denomination TEXT NOT NULL,
        siren TEXT UNIQUE NOT NULL,
        start_date DATE,
        representatives TEXT,
        legal_form TEXT,
        establishments INTEGER DEFAULT 1,
        department TEXT,
        ape_code TEXT,
        address TEXT,
        postal_code TEXT,
        city TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'radiated')),
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table companies créée');

    // Table des tâches de scraping
    await runQuery(`
      CREATE TABLE IF NOT EXISTS scraping_jobs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        ape_code TEXT NOT NULL,
        department TEXT NOT NULL,
        siege_only BOOLEAN DEFAULT 1,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
        progress INTEGER DEFAULT 0,
        results_found INTEGER DEFAULT 0,
        results_processed INTEGER DEFAULT 0,
        error_message TEXT,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table scraping_jobs créée');

    // Table des logs
    await runQuery(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Table activity_logs créée\n');

    // Créer les index
    console.log('🔍 Création des index...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_companies_siren ON companies(siren)',
      'CREATE INDEX IF NOT EXISTS idx_companies_department ON companies(department)',
      'CREATE INDEX IF NOT EXISTS idx_companies_ape_code ON companies(ape_code)',
      'CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user_id ON scraping_jobs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)'
    ];

    for (const indexQuery of indexes) {
      await runQuery(indexQuery);
    }
    console.log('✅ Index créés\n');

    // Créer l'utilisateur de test
    console.log('👤 Création de l\'utilisateur de test...');
    const testUserId = uuidv4();
    const testPassword = await bcrypt.hash('test123', 10);
    
    await runQuery(`
      INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, subscription_plan, api_requests_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [testUserId, 'test@example.com', testPassword, 'Test', 'User', 'pro', 10000]);
    console.log('✅ Utilisateur de test créé\n');

    // Insérer des données de démonstration
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
      },
      {
        id: uuidv4(),
        denomination: 'DIGITAL SERVICES SA',
        siren: '789123456',
        start_date: '2022-09-12',
        representatives: JSON.stringify(['Marc DUBOIS', 'Claire MOREAU']),
        legal_form: 'SA',
        establishments: 4,
        department: '13',
        ape_code: '6202A',
        address: '321 Avenue de la Mer',
        postal_code: '13000',
        city: 'Marseille',
        user_id: testUserId
      },
      {
        id: uuidv4(),
        denomination: 'CONSTRUCTION MODERNE SARL',
        siren: '321654987',
        start_date: '2018-03-05',
        representatives: JSON.stringify(['Paul ROUSSEAU']),
        legal_form: 'SARL',
        establishments: 2,
        department: '69',
        ape_code: '4120A',
        address: '654 Rue du Bâtiment',
        postal_code: '69100',
        city: 'Villeurbanne',
        user_id: testUserId
      }
    ];

    for (const company of demoCompanies) {
      await runQuery(`
        INSERT OR IGNORE INTO companies 
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
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('\n✅ Setup terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur lors du setup:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };