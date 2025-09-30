const { supabase } = require('../config/supabase');
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

      const { error: insertError } = await supabase
        .from('scraping_jobs')
        .insert({
          id: jobId,
          user_id: userId,
          ape_code: apeCode,
          department: department,
          siege_only: siegeOnly,
          status: 'running',
          started_at: new Date().toISOString()
        });

      if (insertError) {
        logger.error('Erreur lors de la création de la tâche:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la création de la tâche'
        });
      }

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
        await supabase
          .from('scraping_jobs')
          .update({
            progress: progressData.progress,
            found_results: progressData.foundResults,
            processed_results: progressData.processedResults
          })
          .eq('id', jobId);
      };

      const result = await scraper.scrapeCompanies(apeCode, department, siegeOnly, onProgress);

      if (result.companies.length > 0) {
        const companies = result.companies.map(company => ({
          id: uuidv4(),
          user_id: userId,
          denomination: company.denomination,
          siren: company.siren,
          start_date: company.startDate || null,
          representatives: company.representatives || [],
          legal_form: company.legalForm,
          establishments: company.establishments,
          department: department,
          ape_code: apeCode,
          address: company.address,
          postal_code: company.postalCode,
          city: company.city,
          status: company.status || 'active',
          scraped_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('companies')
          .upsert(companies, { onConflict: 'user_id,siren' });

        if (insertError) {
          logger.error('Erreur lors de l\'insertion des entreprises:', insertError);
        }
      }

      await supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          progress: 100,
          found_results: result.totalResults,
          processed_results: result.companies.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      logger.info(`Scraping terminé pour le job ${jobId}: ${result.companies.length} entreprises`);

    } catch (error) {
      logger.error(`Erreur lors du scraping ${jobId}:`, error);

      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } finally {
      await scraper.close();
      this.activeScraping.delete(jobId);
    }
  }

  async getScrapingStatus(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const { data: job, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Erreur Supabase:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération du statut'
        });
      }

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

      const { data: jobs, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (error) {
        logger.error('Erreur Supabase:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des tâches'
        });
      }

      res.json({
        success: true,
        jobs: jobs || []
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

      const { data: job, error } = await supabase
        .from('scraping_jobs')
        .select('status')
        .eq('id', jobId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Erreur Supabase:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération de la tâche'
        });
      }

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

      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          error_message: 'Arrêté par l\'utilisateur',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

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