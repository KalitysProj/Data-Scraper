const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getQuery, allQuery } = require('../config/database');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validation
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

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await getQuery(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Un utilisateur avec cet email existe déjà'
        });
      }

      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const userId = uuidv4();
      await runQuery(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, subscription_plan, api_requests_limit)
        VALUES (?, ?, ?, ?, ?, 'free', 1000)
      `, [userId, email, passwordHash, firstName || '', lastName || '']);

      // Générer le token JWT
      const token = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        token,
        user: {
          id: userId,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          subscriptionPlan: 'free'
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

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email et mot de passe requis'
        });
      }

      // Trouver l'utilisateur
      const user = await getQuery(
        'SELECT id, email, password_hash, first_name, last_name, subscription_plan FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect'
        });
      }


      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect'
        });
      }

      // Mettre à jour la dernière connexion
      await runQuery(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      // Générer le token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          subscriptionPlan: user.subscription_plan
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

  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await getQuery(`
        SELECT id, email, first_name, last_name, subscription_plan, 
               api_requests_used, api_requests_limit, created_at, last_login
        FROM users WHERE id = ?
      `, [userId]);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }


      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          subscriptionPlan: user.subscription_plan,
          apiRequestsUsed: user.api_requests_used,
          apiRequestsLimit: user.api_requests_limit,
          createdAt: user.created_at,
          lastLogin: user.last_login
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
      const userId = req.user.id;
      const { firstName, lastName, currentPassword, newPassword } = req.body;

      const updates = [];
      const params = [];

      if (firstName !== undefined) {
        updates.push('first_name = ?');
        params.push(firstName);
      }

      if (lastName !== undefined) {
        updates.push('last_name = ?');
        params.push(lastName);
      }

      // Changement de mot de passe
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            error: 'Mot de passe actuel requis'
          });
        }

        // Vérifier le mot de passe actuel
        const user = await getQuery(
          'SELECT password_hash FROM users WHERE id = ?',
          [userId]
        );

        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'Utilisateur non trouvé'
          });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
          return res.status(401).json({
            success: false,
            error: 'Mot de passe actuel incorrect'
          });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
          });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        updates.push('password_hash = ?');
        params.push(newPasswordHash);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Aucune modification à apporter'
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(userId);

      await runQuery(`
        UPDATE users SET ${updates.join(', ')} WHERE id = ?
      `, params);

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