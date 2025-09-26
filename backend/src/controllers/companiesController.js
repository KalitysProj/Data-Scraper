const { pool } = require('../config/database');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class CompaniesController {
  async getCompanies(req, res) {
    try {
      const userId = req.user.id;
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

      let query = `
        SELECT id, denomination, siren, start_date, representatives, legal_form, 
               establishments, department, ape_code, address, postal_code, city, 
               status, scraped_at, created_at
        FROM companies 
        WHERE user_id = ?
      `;
      
      const params = [userId];

      // Filtres
      if (search) {
        query += ` AND (denomination LIKE ? OR siren LIKE ? OR JSON_SEARCH(representatives, 'one', ?) IS NOT NULL)`;
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

      // Tri
      const allowedSortFields = ['denomination', 'siren', 'start_date', 'created_at', 'scraped_at'];
      const allowedSortOrders = ['ASC', 'DESC'];
      
      if (allowedSortFields.includes(sortBy) && allowedSortOrders.includes(sortOrder.toUpperCase())) {
        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
      }

      // Pagination
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.execute(query, params);

      // Compter le total
      let countQuery = `SELECT COUNT(*) as total FROM companies WHERE user_id = ?`;
      const countParams = [userId];

      if (search) {
        countQuery += ` AND (denomination LIKE ? OR siren LIKE ? OR JSON_SEARCH(representatives, 'one', ?) IS NOT NULL)`;
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

      const [countRows] = await pool.execute(countQuery, countParams);

      // Parser les représentants JSON
      const companies = rows.map(company => ({
        ...company,
        representatives: JSON.parse(company.representatives || '[]')
      }));

      res.json({
        success: true,
        companies,
        total: countRows[0].total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + companies.length < countRows[0].total
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
      const userId = req.user.id;

      const [rows] = await pool.execute(`
        SELECT * FROM companies 
        WHERE id = ? AND user_id = ?
      `, [id, userId]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Entreprise non trouvée'
        });
      }

      const company = {
        ...rows[0],
        representatives: JSON.parse(rows[0].representatives || '[]')
      };

      res.json({
        success: true,
        company
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
      const userId = req.user.id;

      if (!Array.isArray(companyIds) || companyIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Liste d\'IDs d\'entreprises requise'
        });
      }

      const placeholders = companyIds.map(() => '?').join(',');
      const [result] = await pool.execute(`
        DELETE FROM companies 
        WHERE id IN (${placeholders}) AND user_id = ?
      `, [...companyIds, userId]);

      res.json({
        success: true,
        message: `${result.affectedRows} entreprise(s) supprimée(s)`
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
        FROM companies 
        WHERE user_id = ?
      `;
      
      const params = [userId];

      if (companyIds.length > 0) {
        const placeholders = companyIds.map(() => '?').join(',');
        query += ` AND id IN (${placeholders})`;
        params.push(...companyIds);
      }

      query += ` ORDER BY denomination`;

      const [rows] = await pool.execute(query, params);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Aucune entreprise à exporter'
        });
      }

      // Préparer les données pour le CSV
      const csvData = rows.map(company => ({
        denomination: company.denomination,
        siren: company.siren,
        start_date: company.start_date ? company.start_date.toISOString().split('T')[0] : '',
        representatives: JSON.parse(company.representatives || '[]').join('; '),
        legal_form: company.legal_form || '',
        establishments: company.establishments || 1,
        department: company.department || '',
        ape_code: company.ape_code || '',
        address: company.address || '',
        postal_code: company.postal_code || '',
        city: company.city || '',
        status: company.status || 'active'
      }));

      // Créer le fichier CSV temporaire
      const fileName = `inpi_export_${Date.now()}.csv`;
      const filePath = path.join(__dirname, '../../temp', fileName);

      // Créer le dossier temp s'il n'existe pas
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

      // Envoyer le fichier
      res.download(filePath, `inpi_export_${new Date().toISOString().split('T')[0]}.csv`, async (err) => {
        if (err) {
          logger.error('Erreur lors du téléchargement:', err);
        }
        
        // Supprimer le fichier temporaire
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
      const userId = req.user.id;

      const [totalRows] = await pool.execute(
        'SELECT COUNT(*) as total FROM companies WHERE user_id = ?',
        [userId]
      );

      const [monthlyRows] = await pool.execute(`
        SELECT COUNT(*) as monthly FROM companies 
        WHERE user_id = ? AND scraped_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
      `, [userId]);

      const [departmentRows] = await pool.execute(`
        SELECT department, COUNT(*) as count 
        FROM companies 
        WHERE user_id = ? 
        GROUP BY department 
        ORDER BY count DESC 
        LIMIT 10
      `, [userId]);

      const [apeRows] = await pool.execute(`
        SELECT ape_code, COUNT(*) as count 
        FROM companies 
        WHERE user_id = ? 
        GROUP BY ape_code 
        ORDER BY count DESC 
        LIMIT 10
      `, [userId]);

      res.json({
        success: true,
        stats: {
          total: totalRows[0].total,
          monthly: monthlyRows[0].monthly,
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