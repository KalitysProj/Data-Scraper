const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
    try {
      res.status(501).json({
        success: false,
        error: 'Authentification non implémentée - utilisez le mode démonstration'
      });
    } catch (error) {
      logger.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async login(req, res) {
    try {
      res.status(501).json({
        success: false,
        error: 'Authentification non implémentée - utilisez le mode démonstration'
      });
    } catch (error) {
      logger.error('Erreur lors de la connexion:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async logout(req, res) {
    try {
      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      res.json({
        success: true,
        user: {
          id: userId,
          email: 'demo@example.com'
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      res.json({
        success: true,
        message: 'Profil mis à jour avec succès'
      });
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new AuthController();