const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { generalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const scrapingRoutes = require('./routes/scraping');
const companiesRoutes = require('./routes/companies');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting global
app.use(generalLimiter);

// Parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/companies', companiesRoutes);

// Route de test de la base de données
app.get('/api/test-db', async (req, res) => {
  try {
    const isConnected = await testConnection();
    res.json({
      success: isConnected,
      message: isConnected ? 'Connexion à la base de données réussie' : 'Échec de la connexion'
    });
  } catch (error) {
    logger.error('Erreur lors du test de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test de connexion'
    });
  }
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API INPI Scraper opérationnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Gestion globale des erreurs
app.use((error, req, res, next) => {
  logger.error('Erreur non gérée:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : error.message
  });
});

// Démarrage du serveur
async function startServer() {
  try {
    // Tester la connexion à la base de données
    const isDbConnected = await testConnection();
    if (!isDbConnected) {
      logger.error('Impossible de se connecter à la base de données');
      process.exit(1);
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
      logger.info(`📊 Dashboard: http://localhost:${PORT}/api/health`);
      logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});

startServer();