const rateLimit = require('express-rate-limit');
const { pool } = require('../config/database');

// Rate limiter général
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter pour les connexions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion par IP
  message: {
    success: false,
    error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes'
  },
  skipSuccessfulRequests: true
});

// Rate limiter pour le scraping (plus restrictif)
const scrapingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 scraping par heure par IP
  message: {
    success: false,
    error: 'Limite de scraping atteinte, veuillez réessayer dans 1 heure'
  }
});

// Middleware personnalisé pour vérifier les limites utilisateur
const userApiLimiter = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const [users] = await pool.execute(
      'SELECT api_requests_used, api_requests_limit FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];
    if (user.api_requests_used >= user.api_requests_limit) {
      return res.status(429).json({
        success: false,
        error: 'Limite d\'API atteinte pour votre abonnement'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur dans userApiLimiter:', error);
    next();
  }
};

module.exports = {
  generalLimiter,
  authLimiter,
  scrapingLimiter,
  userApiLimiter
};