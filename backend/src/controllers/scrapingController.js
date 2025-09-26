const { pool } = require('../config/database');
const INPIScraper = require('../services/scraper');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class ScrapingController {
  constructor() {
    this.activeScraping = new Map(); // jobId -> scraper instance
  }

  async startScraping(req, res) {
    try {
      const { apeCode, department, siegeOnly = true } = req.body;
      const userId = req.user.id;

      // Validation
      if (!apeCode || !department) {
        return res.status(400).json({
          success: false,
          error: 'Code APE et département requis'
        });
      }

      // Vérifier les limites de l'utilisateur
      const [userRows] = await pool.execute(
        'SELECT api_requests_used, api_requests_limit FROM users WHERE id = ?',
        [userId]
      );

      if (userRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      const user = userRows[0];
      if (user.api_requests_used >= user.api_requests_limit) {
        return res.status(429).json({
          success: false,
          error: 'Limite de requêtes atteinte'
        });
      }

      // Créer une tâche de scraping
      const jobId = uuidv4();
      await pool.execute(`
        INSERT INTO scraping_jobs (id, user_id, ape_code, department, siege_only, status, started_at)
        VALUES (?, ?, ?, ?, ?, 'running', NOW())
      `, [jobId, userId, apeCode, department, siegeOnly]);

      // Démarrer le scraping en arrière-plan
      this.performScraping(jobId, userId, apeCode, department, siegeOnly);

      res.json({
        success: true,
        message: 'Scraping démarré',
        jobId
      });

    } catch (error) {
      logger.error('Erreur lors du démarrage du scraping:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async performScraping(jobId, userId, apeCode, department, siegeOnly) {
    const scraper = new INPIScraper();
    this.activeScraping.set(jobId, scraper);

    try {
      await scraper.initialize();

      const onProgress = async (progressData) => {
        await pool.execute(`
          UPDATE scraping_jobs 
          SET progress = ?, results_found = ?, results_processed = ?
          WHERE id = ?
        `, [progressData.progress, progressData.foundResults, progressData.processedResults, jobId]);
      };

      const result = await scraper.scrapeCompanies(apeCode, department, siegeOnly, onProgress);

      // Sauvegarder les entreprises en base
      if (result.companies.length > 0) {
        const values = result.companies.map(company => [
          company.id,
          company.denomination,
          company.siren,
          company.startDate || null,
          JSON.stringify(company.representatives),
          company.legalForm,
          company.establishments,
          department,
          apeCode,
          company.address,
          company.postalCode,
          company.city,
          company.status,
          userId
        ]);

        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        
        await pool.execute(`
          INSERT IGNORE INTO companies 
          (id, denomination, siren, start_date, representatives, legal_form, establishments, 
           department, ape_code, address, postal_code, city, status, user_id)
          VALUES ${placeholders}
        `, values.flat());
      }

      // Mettre à jour le statut de la tâche
      await pool.execute(`
        UPDATE scraping_jobs 
        SET status = 'completed', progress = 100, results_found = ?, results_processed = ?, completed_at = NOW()
        WHERE id = ?
      `, [result.totalResults, result.companies.length, jobId]);

      // Incrémenter le compteur de requêtes utilisateur
      await pool.execute(
        'UPDATE users SET api_requests_used = api_requests_used + 1 WHERE id = ?',
        [userId]
      );

      logger.info(`Scraping terminé pour le job ${jobId}: ${result.companies.length} entreprises`);

    } catch (error) {
      logger.error(`Erreur lors du scraping ${jobId}:`, error);
      
      await pool.execute(`
        UPDATE scraping_jobs 
        SET status = 'failed', error_message = ?, completed_at = NOW()
        WHERE id = ?
      `, [error.message, jobId]);
    } finally {
      await scraper.close();
      this.activeScraping.delete(jobId);
    }
  }

  async getScrapingStatus(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const [rows] = await pool.execute(`
        SELECT * FROM scraping_jobs 
        WHERE id = ? AND user_id = ?
      `, [jobId, userId]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tâche non trouvée'
        });
      }

      res.json({
        success: true,
        job: rows[0]
      });

    } catch (error) {
      logger.error('Erreur lors de la récupération du statut:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async getUserScrapingJobs(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, offset = 0 } = req.query;

      const [rows] = await pool.execute(`
        SELECT * FROM scraping_jobs 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, parseInt(limit), parseInt(offset)]);

      res.json({
        success: true,
        jobs: rows
      });

    } catch (error) {
      logger.error('Erreur lors de la récupération des tâches:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async stopScraping(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      // Vérifier que la tâche appartient à l'utilisateur
      const [rows] = await pool.execute(`
        SELECT status FROM scraping_jobs 
        WHERE id = ? AND user_id = ?
      `, [jobId, userId]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tâche non trouvée'
        });
      }

      if (rows[0].status !== 'running') {
        return res.status(400).json({
          success: false,
          error: 'La tâche n\'est pas en cours d\'exécution'
        });
      }

      // Arrêter le scraper s'il est actif
      const scraper = this.activeScraping.get(jobId);
      if (scraper) {
        await scraper.close();
        this.activeScraping.delete(jobId);
      }

      // Mettre à jour le statut
      await pool.execute(`
        UPDATE scraping_jobs 
        SET status = 'failed', error_message = 'Arrêté par l\'utilisateur', completed_at = NOW()
        WHERE id = ?
      `, [jobId]);

      res.json({
        success: true,
        message: 'Scraping arrêté'
      });

    } catch (error) {
      logger.error('Erreur lors de l\'arrêt du scraping:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new ScrapingController();