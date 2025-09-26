const express = require('express');
const { body, query } = require('express-validator');
const companiesController = require('../controllers/companiesController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const getCompaniesValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('sortBy').optional().isIn(['denomination', 'siren', 'start_date', 'created_at', 'scraped_at']),
  query('sortOrder').optional().isIn(['ASC', 'DESC'])
];

const deleteCompaniesValidation = [
  body('companyIds').isArray({ min: 1 }).withMessage('Liste d\'IDs requise'),
  body('companyIds.*').isUUID().withMessage('ID invalide')
];

// Routes protégées
router.get('/', authenticateToken, getCompaniesValidation, companiesController.getCompanies);
router.get('/stats', authenticateToken, companiesController.getStats);
router.get('/:id', authenticateToken, companiesController.getCompanyById);
router.delete('/', authenticateToken, deleteCompaniesValidation, companiesController.deleteCompanies);
router.post('/export/csv', authenticateToken, companiesController.exportToCsv);

module.exports = router;