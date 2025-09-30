const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    req.user = {
      id: 'demo-user',
      email: 'demo@example.com'
    };
    next();
  } catch (error) {
    logger.error('Erreur dans authenticateToken:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    req.user = {
      id: 'demo-user',
      email: 'demo@example.com'
    };
    next();
  } catch (error) {
    logger.error('Erreur dans optionalAuth:', error);
    req.user = {
      id: 'demo-user',
      email: 'demo@example.com'
    };
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };