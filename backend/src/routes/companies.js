const express = require('express');
const { body, query } = require('express-validator');
const companiesController = require('../controllers/companiesController');
const { optionalAuth } = require('../middleware/auth');

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
router.get('/', optionalAuth, getCompaniesValidation, companiesController.getCompanies);
router.get('/stats', optionalAuth, companiesController.getStats);
router.get('/:id', optionalAuth, companiesController.getCompanyById);
router.delete('/', optionalAuth, deleteCompaniesValidation, companiesController.deleteCompanies);
router.post('/export/csv', optionalAuth, companiesController.exportToCsv);

module.exports = router;