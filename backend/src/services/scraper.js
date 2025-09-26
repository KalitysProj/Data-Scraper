const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class INPIScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isRunning = false;
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      this.page = await this.browser.newPage();
      
      // Configuration de la page
      await this.page.setUserAgent(process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      // Bloquer les ressources inutiles pour accélérer
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (resourceType === 'stylesheet' || resourceType === 'image' || resourceType === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });

      logger.info('Scraper initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du scraper:', error);
      throw error;
    }
  }

  async buildSearchUrl(apeCode, department, siegeOnly = true) {
    const searchParams = {
      checkboxes: {
        status: {
          order: 0,
          searchField: ["is_rad"],
          values: [
            { value: "false", checked: true },
            { value: "true", checked: false }
          ]
        }
      },
      texts: {
        ape: {
          order: 7,
          searchField: [
            "formality.content.personnePhysique.etablissementPrincipal.activites.codeApe",
            "formality.content.personneMorale.etablissementPrincipal.activites.codeApe"
          ],
          checkedSearchField: [],
          value: apeCode
        }
      },
      multipleSelects: {
        state: {
          order: 11,
          searchField: [
            "formality.content.personneMorale.etablissementPrincipal.adresse.codePostalShort",
            "formality.content.personnePhysique.etablissementPrincipal.adresse.codePostalShort"
          ],
          value: [{
            value: department,
            label: `${department} - Département`,
            parents: [],
            isFolded: false,
            isLastChild: true
          }]
        }
      },
      dates: {}
    };

    if (siegeOnly) {
      searchParams.checkboxes.siege = {
        order: 1,
        searchField: ["is_siege"],
        values: [
          { value: "true", checked: true },
          { value: "false", checked: false }
        ]
      };
    }

    const encodedParams = encodeURIComponent(JSON.stringify(searchParams));
    return `https://data.inpi.fr/recherche_avancee/entreprises?advancedSearch=${encodedParams}`;
  }

  async scrapeCompanies(apeCode, department, siegeOnly = true, onProgress = null) {
    if (this.isRunning) {
      throw new Error('Le scraper est déjà en cours d\'exécution');
    }

    this.isRunning = true;
    const companies = [];
    let currentPage = 1;
    let totalResults = 0;

    try {
      if (!this.browser) {
        await this.initialize();
      }

      const searchUrl = await this.buildSearchUrl(apeCode, department, siegeOnly);
      logger.info(`Début du scraping pour APE: ${apeCode}, Département: ${department}`);

      // Aller à la page de recherche
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Attendre que les résultats se chargent
      await this.page.waitForSelector('.search-results, .no-results', { timeout: 10000 });

      // Vérifier s'il y a des résultats
      const noResults = await this.page.$('.no-results');
      if (noResults) {
        logger.info('Aucun résultat trouvé');
        return { companies: [], totalResults: 0 };
      }

      // Obtenir le nombre total de résultats
      try {
        const totalElement = await this.page.$('.results-count');
        if (totalElement) {
          const totalText = await this.page.evaluate(el => el.textContent, totalElement);
          totalResults = parseInt(totalText.match(/\d+/)?.[0] || '0');
        }
      } catch (error) {
        logger.warn('Impossible de récupérer le nombre total de résultats');
      }

      if (onProgress) {
        onProgress({
          status: `${totalResults} entreprises trouvées, extraction en cours...`,
          progress: 10,
          foundResults: totalResults,
          processedResults: 0
        });
      }

      // Scraper toutes les pages
      while (true) {
        logger.info(`Scraping de la page ${currentPage}`);

        // Extraire les données de la page courante
        const pageCompanies = await this.extractCompaniesFromPage();
        companies.push(...pageCompanies);

        if (onProgress) {
          const progress = Math.min(90, (companies.length / Math.max(totalResults, companies.length)) * 80 + 10);
          onProgress({
            status: `Extraction en cours... Page ${currentPage}`,
            progress: Math.round(progress),
            foundResults: totalResults,
            processedResults: companies.length
          });
        }

        // Vérifier s'il y a une page suivante
        const nextButton = await this.page.$('.pagination .next:not(.disabled)');
        if (!nextButton) {
          break;
        }

        // Aller à la page suivante
        await nextButton.click();
        await this.page.waitForSelector('.search-results', { timeout: 10000 });
        await this.delay(parseInt(process.env.SCRAPING_DELAY) || 2000);
        
        currentPage++;
      }

      logger.info(`Scraping terminé: ${companies.length} entreprises extraites`);
      
      return {
        companies: companies.map(company => ({
          ...company,
          id: uuidv4(),
          apeCode,
          department,
          scrapedAt: new Date().toISOString()
        })),
        totalResults: companies.length
      };

    } catch (error) {
      logger.error('Erreur lors du scraping:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async extractCompaniesFromPage() {
    return await this.page.evaluate(() => {
      const companies = [];
      const companyElements = document.querySelectorAll('.company-result, .result-item');

      companyElements.forEach(element => {
        try {
          const company = {
            denomination: '',
            siren: '',
            startDate: '',
            representatives: [],
            legalForm: '',
            establishments: 1,
            address: '',
            postalCode: '',
            city: '',
            status: 'active'
          };

          // Dénomination
          const denominationEl = element.querySelector('.company-name, .denomination, h3, .title');
          if (denominationEl) {
            company.denomination = denominationEl.textContent.trim();
          }

          // SIREN
          const sirenEl = element.querySelector('.siren, [data-siren]');
          if (sirenEl) {
            const sirenText = sirenEl.textContent || sirenEl.getAttribute('data-siren') || '';
            const sirenMatch = sirenText.match(/\d{9}/);
            if (sirenMatch) {
              company.siren = sirenMatch[0];
            }
          }

          // Date de début d'activité
          const dateEl = element.querySelector('.start-date, .creation-date, .date');
          if (dateEl) {
            const dateText = dateEl.textContent.trim();
            const dateMatch = dateText.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
              company.startDate = dateMatch[0];
            }
          }

          // Représentants
          const representantsEl = element.querySelectorAll('.representative, .dirigeant, .representant');
          representantsEl.forEach(rep => {
            const name = rep.textContent.trim();
            if (name && !company.representatives.includes(name)) {
              company.representatives.push(name);
            }
          });

          // Forme juridique
          const legalFormEl = element.querySelector('.legal-form, .forme-juridique');
          if (legalFormEl) {
            company.legalForm = legalFormEl.textContent.trim();
          }

          // Adresse
          const addressEl = element.querySelector('.address, .adresse');
          if (addressEl) {
            company.address = addressEl.textContent.trim();
          }

          // Code postal et ville
          const locationEl = element.querySelector('.location, .ville');
          if (locationEl) {
            const locationText = locationEl.textContent.trim();
            const postalMatch = locationText.match(/(\d{5})/);
            if (postalMatch) {
              company.postalCode = postalMatch[0];
              company.city = locationText.replace(postalMatch[0], '').trim();
            }
          }

          // Nombre d'établissements
          const establishmentsEl = element.querySelector('.establishments, .etablissements');
          if (establishmentsEl) {
            const establishmentsText = establishmentsEl.textContent.trim();
            const establishmentsMatch = establishmentsText.match(/\d+/);
            if (establishmentsMatch) {
              company.establishments = parseInt(establishmentsMatch[0]);
            }
          }

          // Ajouter seulement si on a au moins la dénomination et le SIREN
          if (company.denomination && company.siren) {
            companies.push(company);
          }
        } catch (error) {
          console.warn('Erreur lors de l\'extraction d\'une entreprise:', error);
        }
      });

      return companies;
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    this.isRunning = false;
  }
}

module.exports = INPIScraper;