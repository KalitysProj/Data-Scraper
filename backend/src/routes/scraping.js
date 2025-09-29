const express = require('express');
const { body } = require('express-validator');
const scrapingController = require('../controllers/scrapingController');
const { optionalAuth } = require('../middleware/auth');
const { scrapingLimiter, userApiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation middleware
const scrapingValidation = [
  body('apeCode').matches(/^\d{4}[A-Z]$/).withMessage('Code APE invalide (format: 0000A)'),
  body('department').isLength({ min: 2, max: 3 }).withMessage('Département invalide'),
  body('siegeOnly').optional().isBoolean()
];

// Routes protégées
router.post('/start', 
  optionalAuth, 
  scrapingLimiter, 
  userApiLimiter, 
  scrapingValidation, 
  scrapingController.startScraping
);

router.get('/status/:jobId', optionalAuth, scrapingController.getScrapingStatus);
router.get('/jobs', optionalAuth, scrapingController.getUserScrapingJobs);
router.post('/stop/:jobId', optionalAuth, scrapingController.stopScraping);

module.exports = router;