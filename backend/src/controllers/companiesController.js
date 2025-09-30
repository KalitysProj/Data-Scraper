const { db } = require('../config/database');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class CompaniesController {
  async getCompanies(req, res) {
    try {
      const userId = req.user.id || 'demo-user';
      const {
        search = '',
        department = '',
        apeCode = '',
        legalForm = '',
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      let query = `SELECT * FROM companies WHERE user_id = ?`;
      const params = [userId];

      if (search) {
        query += ` AND (denomination LIKE ? OR siren LIKE ? OR representatives LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (department) {
        query += ` AND department = ?`;
        params.push(department);
      }

      if (apeCode) {
        query += ` AND ape_code = ?`;
        params.push(apeCode);
      }

      if (legalForm) {
        query += ` AND legal_form = ?`;
        params.push(legalForm);
      }

      const allowedSortFields = ['denomination', 'siren', 'start_date', 'created_at', 'scraped_at'];
      if (allowedSortFields.includes(sortBy)) {
        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
      }

      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const companies = db.prepare(query).all(...params);

      let countQuery = `SELECT COUNT(*) as total FROM companies WHERE user_id = ?`;
      const countParams = [userId];

      if (search) {
        countQuery += ` AND (denomination LIKE ? OR siren LIKE ? OR representatives LIKE ?)`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
      }

      if (department) {
        countQuery += ` AND department = ?`;
        countParams.push(department);
      }

      if (apeCode) {
        countQuery += ` AND ape_code = ?`;
        countParams.push(apeCode);
      }

      if (legalForm) {
        countQuery += ` AND legal_form = ?`;
        countParams.push(legalForm);
      }

      const { total } = db.prepare(countQuery).get(...countParams);

      const companiesWithParsedReps = companies.map(company => ({
        ...company,
        representatives: company.representatives ? JSON.parse(company.representatives) : []
      }));

      res.json({
        success: true,
        companies: companiesWithParsedReps,
        total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + companies.length < total
        }
      });

    } catch (error) {
      logger.error('Erreur lors de la récupération des entreprises:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async getCompanyById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id || 'demo-user';

      const company = db.prepare(`
        SELECT * FROM companies WHERE id = ? AND user_id = ?
      `).get(id, userId);

      if (!company) {
        return res.status(404).json({
          success: false,
          error: 'Entreprise non trouvée'
        });
      }

      const result = {
        ...company,
        representatives: company.representatives ? JSON.parse(company.representatives) : []
      };

      res.json({
        success: true,
        company: result
      });

    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'entreprise:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async deleteCompanies(req, res) {
    try {
      const { companyIds } = req.body;
      const userId = req.user.id || 'demo-user';

      if (!Array.isArray(companyIds) || companyIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Liste d\'IDs d\'entreprises requise'
        });
      }

      const placeholders = companyIds.map(() => '?').join(',');
      const stmt = db.prepare(`
        DELETE FROM companies WHERE id IN (${placeholders}) AND user_id = ?
      `);

      const result = stmt.run(...companyIds, userId);

      res.json({
        success: true,
        message: `${result.changes} entreprise(s) supprimée(s)`
      });

    } catch (error) {
      logger.error('Erreur lors de la suppression des entreprises:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async exportToCsv(req, res) {
    try {
      const { companyIds = [] } = req.body;
      const userId = req.user.id;

      let query = `
        SELECT denomination, siren, start_date, representatives, legal_form,
               establishments, department, ape_code, address, postal_code, city, status
        FROM companies WHERE user_id = ?
      `;

      const params = [userId];

      if (companyIds.length > 0) {
        const placeholders = companyIds.map(() => '?').join(',');
        query += ` AND id IN (${placeholders})`;
        params.push(...companyIds);
      }

      query += ` ORDER BY denomination`;

      const rows = db.prepare(query).all(...params);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Aucune entreprise à exporter'
        });
      }

      const csvData = rows.map(company => ({
        denomination: company.denomination,
        siren: company.siren,
        start_date: company.start_date || '',
        representatives: company.representatives ? JSON.parse(company.representatives).join('; ') : '',
        legal_form: company.legal_form || '',
        establishments: company.establishments || 1,
        department: company.department || '',
        ape_code: company.ape_code || '',
        address: company.address || '',
        postal_code: company.postal_code || '',
        city: company.city || '',
        status: company.status || 'active'
      }));

      const fileName = `inpi_export_${Date.now()}.csv`;
      const filePath = path.join(__dirname, '../../temp', fileName);

      await fs.mkdir(path.dirname(filePath), { recursive: true });

      const csvWriter = createCsvWriter({
        path: filePath,
        header: [
          { id: 'denomination', title: 'Dénomination' },
          { id: 'siren', title: 'SIREN' },
          { id: 'start_date', title: 'Début d\'activité' },
          { id: 'representatives', title: 'Représentants' },
          { id: 'legal_form', title: 'Forme juridique' },
          { id: 'establishments', title: 'Établissements' },
          { id: 'department', title: 'Département' },
          { id: 'ape_code', title: 'Code APE' },
          { id: 'address', title: 'Adresse' },
          { id: 'postal_code', title: 'Code postal' },
          { id: 'city', title: 'Ville' },
          { id: 'status', title: 'Statut' }
        ],
        encoding: 'utf8'
      });

      await csvWriter.writeRecords(csvData);

      res.download(filePath, `inpi_export_${new Date().toISOString().split('T')[0]}.csv`, async (err) => {
        if (err) {
          logger.error('Erreur lors du téléchargement:', err);
        }

        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          logger.error('Erreur lors de la suppression du fichier temporaire:', unlinkError);
        }
      });

    } catch (error) {
      logger.error('Erreur lors de l\'export CSV:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  async getStats(req, res) {
    try {
      const userId = req.user.id || 'demo-user';

      const { total } = db.prepare(
        'SELECT COUNT(*) as total FROM companies WHERE user_id = ?'
      ).get(userId);

      const { monthly } = db.prepare(`
        SELECT COUNT(*) as monthly FROM companies
        WHERE user_id = ? AND scraped_at >= datetime('now', '-1 month')
      `).get(userId);

      const departmentRows = db.prepare(`
        SELECT department, COUNT(*) as count
        FROM companies
        WHERE user_id = ? AND department IS NOT NULL
        GROUP BY department
        ORDER BY count DESC
        LIMIT 10
      `).all(userId);

      const apeRows = db.prepare(`
        SELECT ape_code, COUNT(*) as count
        FROM companies
        WHERE user_id = ? AND ape_code IS NOT NULL
        GROUP BY ape_code
        ORDER BY count DESC
        LIMIT 10
      `).all(userId);

      res.json({
        success: true,
        stats: {
          total: total || 0,
          monthly: monthly || 0,
          byDepartment: departmentRows,
          byApeCode: apeRows
        }
      });

    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }
}

module.exports = new CompaniesController();