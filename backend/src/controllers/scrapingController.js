const { db } = require('../config/database');
const INPIScraper = require('../services/scraper');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class ScrapingController {
  constructor() {
    this.activeScraping = new Map();
  }

  async startScraping(req, res) {
    try {
      const { apeCode, department, siegeOnly = true } = req.body;
      const userId = req.user.id || 'demo-user';

      if (!apeCode || !department) {
        return res.status(400).json({
          success: false,
          error: 'Code APE et département requis'
        });
      }

      const jobId = uuidv4();

      const stmt = db.prepare(`
        INSERT INTO scraping_jobs (id, user_id, ape_code, department, siege_only, status, started_at)
        VALUES (?, ?, ?, ?, ?, 'running', datetime('now'))
      `);

      stmt.run(jobId, userId, apeCode, department, siegeOnly ? 1 : 0);

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
        const stmt = db.prepare(`
          UPDATE scraping_jobs
          SET progress = ?, found_results = ?, processed_results = ?
          WHERE id = ?
        `);
        stmt.run(progressData.progress, progressData.foundResults, progressData.processedResults, jobId);
      };

      const result = await scraper.scrapeCompanies(apeCode, department, siegeOnly, onProgress);

      if (result.companies.length > 0) {
        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO companies
          (id, user_id, denomination, siren, start_date, representatives, legal_form,
           establishments, department, ape_code, address, postal_code, city, status, scraped_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        const insertMany = db.transaction((companies) => {
          for (const company of companies) {
            insertStmt.run(
              uuidv4(),
              userId,
              company.denomination,
              company.siren,
              company.startDate || null,
              JSON.stringify(company.representatives || []),
              company.legalForm,
              company.establishments,
              department,
              apeCode,
              company.address,
              company.postalCode,
              company.city,
              company.status || 'active'
            );
          }
        });

        insertMany(result.companies);
      }

      const updateStmt = db.prepare(`
        UPDATE scraping_jobs
        SET status = 'completed', progress = 100, found_results = ?,
            processed_results = ?, completed_at = datetime('now')
        WHERE id = ?
      `);

      updateStmt.run(result.totalResults, result.companies.length, jobId);

      logger.info(`Scraping terminé pour le job ${jobId}: ${result.companies.length} entreprises`);

    } catch (error) {
      logger.error(`Erreur lors du scraping ${jobId}:`, error);

      const updateStmt = db.prepare(`
        UPDATE scraping_jobs
        SET status = 'failed', error_message = ?, completed_at = datetime('now')
        WHERE id = ?
      `);

      updateStmt.run(error.message, jobId);
    } finally {
      await scraper.close();
      this.activeScraping.delete(jobId);
    }
  }

  async getScrapingStatus(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const job = db.prepare(`
        SELECT * FROM scraping_jobs WHERE id = ? AND user_id = ?
      `).get(jobId, userId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Tâche non trouvée'
        });
      }

      res.json({
        success: true,
        job
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

      const jobs = db.prepare(`
        SELECT * FROM scraping_jobs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).all(userId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        jobs
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

      const job = db.prepare(`
        SELECT status FROM scraping_jobs WHERE id = ? AND user_id = ?
      `).get(jobId, userId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Tâche non trouvée'
        });
      }

      if (job.status !== 'running') {
        return res.status(400).json({
          success: false,
          error: 'La tâche n\'est pas en cours d\'exécution'
        });
      }

      const scraper = this.activeScraping.get(jobId);
      if (scraper) {
        await scraper.close();
        this.activeScraping.delete(jobId);
      }

      const stmt = db.prepare(`
        UPDATE scraping_jobs
        SET status = 'failed', error_message = 'Arrêté par l\'utilisateur',
            completed_at = datetime('now')
        WHERE id = ?
      `);

      stmt.run(jobId);

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