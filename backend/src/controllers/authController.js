const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email et mot de passe requis'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        logger.error('Erreur lors de l\'inscription:', error);
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email
          });

        if (insertError) {
          logger.error('Erreur lors de l\'insertion de l\'utilisateur:', insertError);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        user: {
          id: data.user?.id,
          email: data.user?.email
        }
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
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email et mot de passe requis'
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect'
        });
      }

      res.json({
        success: true,
        message: 'Connexion réussie',
        session: data.session,
        user: {
          id: data.user?.id,
          email: data.user?.email
        }
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
      const { error } = await supabase.auth.signOut();

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

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

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Erreur lors de la récupération du profil:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération du profil'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        user
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
      const userId = req.user.id;
      const { email } = req.body;

      const updates = {};

      if (email) {
        updates.email = email;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Aucune modification à apporter'
        });
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        logger.error('Erreur lors de la mise à jour du profil:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la mise à jour du profil'
        });
      }

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