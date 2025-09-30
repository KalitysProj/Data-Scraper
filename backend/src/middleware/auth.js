const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = {
        id: 'demo-user',
        email: 'demo@example.com'
      };
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      logger.error('Erreur lors de la récupération des données utilisateur:', userError);
    }

    req.user = {
      id: user.id,
      email: user.email,
      ...userData
    };
    req.supabaseToken = token;

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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = {
        id: 'demo-user',
        email: 'demo@example.com'
      };
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      req.user = {
        id: 'demo-user',
        email: 'demo@example.com'
      };
      return next();
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      logger.error('Erreur lors de la récupération des données utilisateur:', userError);
    }

    req.user = {
      id: user.id,
      email: user.email,
      ...userData
    };
    req.supabaseToken = token;

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