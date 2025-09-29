const jwt = require('jsonwebtoken');
const { getQuery } = require('../config/database');
const logger = require('../utils/logger');

// Middleware d'authentification avec token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Si pas de token, créer un utilisateur demo pour les tests
    if (!token) {
      req.user = {
        id: 'demo-user',
        email: 'demo@example.com',
        subscription_plan: 'pro'
      };
      return next();
    }

    // Vérifier le token JWT
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Token invalide'
        });
      }

      try {
        // Récupérer les informations utilisateur depuis la base
        const user = await getQuery(
          'SELECT id, email, subscription_plan FROM users WHERE id = ?',
          [decoded.userId]
        );

        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'Utilisateur non trouvé'
          });
        }

        req.user = user;
        next();
      } catch (dbError) {
        logger.error('Erreur lors de la vérification utilisateur:', dbError);
        res.status(500).json({
          success: false,
          error: 'Erreur interne du serveur'
        });
      }
    });
  } catch (error) {
    logger.error('Erreur dans authenticateToken:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// Middleware optionnel - permet l'accès sans token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = {
        id: 'demo-user',
        email: 'demo@example.com',
        subscription_plan: 'pro'
      };
      return next();
    }

    // Si token présent, le vérifier
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        req.user = {
          id: 'demo-user',
          email: 'demo@example.com',
          subscription_plan: 'pro'
        };
        return next();
      }

      try {
        const user = await getQuery(
          'SELECT id, email, subscription_plan FROM users WHERE id = ?',
          [decoded.userId]
        );

        if (!user) {
          req.user = {
            id: 'demo-user',
            email: 'demo@example.com',
            subscription_plan: 'pro'
          };
        } else {
          req.user = user;
        }

        next();
      } catch (dbError) {
        req.user = {
          id: 'demo-user',
          email: 'demo@example.com',
          subscription_plan: 'pro'
        };
        next();
      }
    });
  } catch (error) {
    req.user = {
      id: 'demo-user',
      email: 'demo@example.com',
      subscription_plan: 'pro'
    };
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };