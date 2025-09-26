const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer les informations utilisateur
    const [users] = await pool.execute(
      'SELECT id, email, subscription_plan FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    req.user = users[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expiré'
      });
    }

    logger.error('Erreur d\'authentification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

module.exports = { authenticateToken };