const { supabase } = require('../config/supabase');
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
        sortOrder = 'desc'
      } = req.query;

      let query = supabase
        .from('companies')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (search) {
        query = query.or(`denomination.ilike.%${search}%,siren.ilike.%${search}%`);
      }

      if (department) {
        query = query.eq('department', department);
      }

      if (apeCode) {
        query = query.eq('ape_code', apeCode);
      }

      if (legalForm) {
        query = query.eq('legal_form', legalForm);
      }

      const allowedSortFields = ['denomination', 'siren', 'start_date', 'created_at', 'scraped_at'];
      if (allowedSortFields.includes(sortBy)) {
        query = query.order(sortBy, { ascending: sortOrder.toLowerCase() === 'asc' });
      }

      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      const { data: companies, error, count } = await query;

      if (error) {
        logger.error('Erreur Supabase lors de la récupération des entreprises:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des données'
        });
      }

      res.json({
        success: true,
        companies: companies || [],
        total: count || 0,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + (companies?.length || 0) < (count || 0)
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

      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Erreur Supabase:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la récupération des données'
        });
      }

      if (!company) {
        return res.status(404).json({
          success: false,
          error: 'Entreprise non trouvée'
        });
      }

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
      const userId = req.user.id || 'demo-user';

      if (!Array.isArray(companyIds) || companyIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Liste d\'IDs d\'entreprises requise'
        });
      }

      const { error, count } = await supabase
        .from('companies')
        .delete({ count: 'exact' })
        .in('id', companyIds)
        .eq('user_id', userId);

      if (error) {
        logger.error('Erreur Supabase lors de la suppression:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la suppression des données'
        });
      }

      res.json({
        success: true,
        message: `${count || 0} entreprise(s) supprimée(s)`
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

      let query = supabase
        .from('companies')
        .select('denomination, siren, start_date, representatives, legal_form, establishments, department, ape_code, address, postal_code, city, status')
        .eq('user_id', userId)
        .order('denomination');

      if (companyIds.length > 0) {
        query = query.in('id', companyIds);
      }

      const { data: rows, error } = await query;

      if (error) {
        logger.error('Erreur Supabase lors de l\'export:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de l\'export des données'
        });
      }

      if (!rows || rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Aucune entreprise à exporter'
        });
      }

      const csvData = rows.map(company => ({
        denomination: company.denomination,
        siren: company.siren,
        start_date: company.start_date || '',
        representatives: Array.isArray(company.representatives) ? company.representatives.join('; ') : '',
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

      const { count: total } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const { count: monthly } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('scraped_at', oneMonthAgo.toISOString());

      const { data: departmentRows } = await supabase
        .from('companies')
        .select('department')
        .eq('user_id', userId)
        .not('department', 'is', null);

      const departmentMap = {};
      (departmentRows || []).forEach(row => {
        if (row.department) {
          departmentMap[row.department] = (departmentMap[row.department] || 0) + 1;
        }
      });

      const byDepartment = Object.entries(departmentMap)
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const { data: apeRows } = await supabase
        .from('companies')
        .select('ape_code')
        .eq('user_id', userId)
        .not('ape_code', 'is', null);

      const apeMap = {};
      (apeRows || []).forEach(row => {
        if (row.ape_code) {
          apeMap[row.ape_code] = (apeMap[row.ape_code] || 0) + 1;
        }
      });

      const byApeCode = Object.entries(apeMap)
        .map(([ape_code, count]) => ({ ape_code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      res.json({
        success: true,
        stats: {
          total: total || 0,
          monthly: monthly || 0,
          byDepartment,
          byApeCode
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