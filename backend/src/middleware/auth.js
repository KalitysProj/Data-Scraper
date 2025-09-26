const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// Middleware d'authentification désactivé - pas d'auth requise
const authenticateToken = async (req, res, next) => {
  // Créer un utilisateur fictif pour les besoins du scraping
  req.user = {
    id: 'demo-user',
    email: 'demo@example.com',
    subscription_plan: 'pro'
  };
  next();
};

module.exports = { authenticateToken };