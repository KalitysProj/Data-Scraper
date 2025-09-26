// Service pour la 1ère étape d'analyse - Découverte et Cartographie
import { supabase } from '../lib/supabase';
import { websiteService } from './websiteService';
import { whoisService } from './whoisService';
import { realAnalysisService } from './realAnalysisService';
import { technologyDetectionService } from './technologyDetectionService';

// Configuration de la 1ère étape
const FIRST_STEP_CONFIG = {
  TIMEOUTS: {
    DOMAIN_CHECK: 5000,
    WHOIS_LOOKUP: 10000,
    PAGE_SCRAPING: 15000,
    SITEMAP_DISCOVERY: 8000
  },
  LIMITS: {
    MAX_PAGES_DISCOVERY: 50,
    MAX_IMAGES_INVENTORY: 30,
    MAX_RESOURCES_CHECK: 20
  },
  PRIORITIES: {
    CRITICAL: ['domain_accessibility', 'whois_expiration', 'wordpress_detection'],
    HIGH: ['homepage_analysis', 'sitemap_discovery', 'basic_seo'],
    MEDIUM: ['resource_inventory', 'technology_detection', 'structure_analysis']
  }
} as const;

export interface FirstStepResult {
  websiteId: string;
  status: 'completed' | 'partial' | 'failed';
  steps: {
    domainValidation: StepResult;
    whoisAnalysis: StepResult;
    homepageAnalysis: StepResult;
    architectureDiscovery: StepResult;
    resourceInventory: StepResult;
  };
  summary: {
    isWordPress: boolean;
    isAccessible: boolean;
    domainExpiresIn: number; // jours
    pagesDiscovered: number;
    imagesFound: number;
    criticalIssues: string[];
    nextSteps: string[];
  };
  duration: number;
  analyzedAt: Date;
}

interface StepResult {
  name: string;
  status: 'completed' | 'failed' | 'skipped';
  duration: number;
  data?: any;
  error?: string;
  warnings: string[];
}

class FirstStepAnalysisService {
  async performFirstStepAnalysis(
    url: string, 
    userId: string,
    onProgress?: (step: string, progress: number, status: string) => void
  ): Promise<FirstStepResult> {
    console.log('🚀 Démarrage 1ère étape d\'analyse pour:', url);
    
    const startTime = Date.now();
    const result: FirstStepResult = {
      websiteId: '',
      status: 'failed',
      steps: {
        domainValidation: this.initStepResult('Validation du domaine'),
        whoisAnalysis: this.initStepResult('Analyse WHOIS'),
        homepageAnalysis: this.initStepResult('Analyse page d\'accueil'),
        architectureDiscovery: this.initStepResult('Découverte architecture'),
        resourceInventory: this.initStepResult('Inventaire ressources')
      },
      summary: {
        isWordPress: false,
        isAccessible: false,
        domainExpiresIn: 0,
        pagesDiscovered: 0,
        imagesFound: 0,
        criticalIssues: [],
        nextSteps: []
      },
      duration: 0,
      analyzedAt: new Date()
    };

    try {
      // Étape 1: Validation du domaine et accessibilité
      onProgress?.('domain_validation', 10, 'Validation du domaine...');
      result.steps.domainValidation = await this.validateDomain(url);
      
      if (result.steps.domainValidation.status === 'failed') {
        throw new Error('Domaine inaccessible');
      }

      // Étape 2: Analyse WHOIS
      onProgress?.('whois_analysis', 25, 'Analyse des informations de domaine...');
      result.steps.whoisAnalysis = await this.analyzeWhois(url);

      // Étape 3: Analyse de la page d'accueil
      onProgress?.('homepage_analysis', 45, 'Analyse de la page d\'accueil...');
      result.steps.homepageAnalysis = await this.analyzeHomepage(url);

      // Étape 4: Découverte de l'architecture
      onProgress?.('architecture_discovery', 70, 'Découverte de l\'architecture...');
      result.steps.architectureDiscovery = await this.discoverArchitecture(url);

      // Étape 5: Inventaire des ressources
      onProgress?.('resource_inventory', 90, 'Inventaire des ressources...');
      result.steps.resourceInventory = await this.inventoryResources(url, result.steps.homepageAnalysis.data);

      // Créer l'entrée website
      try {
        const website = await websiteService.discoverWebsite(url, userId);
        result.websiteId = website.id;
      } catch (error) {
        // En mode offline, créer un ID temporaire
        result.websiteId = `temp-${Date.now()}`;
        console.log('⚠️ Mode offline - ID temporaire créé');
      }

      // Générer le résumé
      result.summary = this.generateSummary(result.steps);
      result.status = this.determineOverallStatus(result.steps);
      result.duration = Date.now() - startTime;

      onProgress?.('completed', 100, 'Analyse terminée !');
      console.log('✅ 1ère étape terminée avec succès');
      
      return result;

    } catch (error) {
      console.error('❌ Erreur 1ère étape:', error);
      result.duration = Date.now() - startTime;
      result.summary.criticalIssues.push(error instanceof Error ? error.message : 'Erreur inconnue');
      throw error;
    }
  }

  // Étape 1: Validation du domaine
  private async validateDomain(url: string): Promise<StepResult> {
    const stepStart = Date.now();
    const step = this.initStepResult('Validation du domaine');
    
    console.log('🔍 Validation du domaine:', url);

    try {
      // Validation préliminaire de l'URL
      const urlObj = new URL(url);
      console.log('📋 Domaine à valider:', urlObj.hostname);
      
      // Utiliser le service d'analyse réelle pour vérifier l'accessibilité
      const accessibilityResult = await realAnalysisService.checkUrlAccessibility(url);
      console.log('📊 Résultat accessibilité:', accessibilityResult);
      
      step.data = {
        domain: urlObj.hostname,
        protocol: urlObj.protocol,
        statusCode: accessibilityResult.statusCode,
        isAccessible: accessibilityResult.ok,
        responseTime: Date.now() - stepStart,
        errorDetails: accessibilityResult.error
      };
      
      if (!accessibilityResult.ok) {
        if (accessibilityResult.statusCode > 0) {
          step.warnings.push(`Code de réponse HTTP: ${accessibilityResult.statusCode}`);
        }
        if (accessibilityResult.error) {
          step.warnings.push(accessibilityResult.error);
        }
        
        // Suggestions selon le type d'erreur
        if (accessibilityResult.error?.includes('firewall')) {
          step.warnings.push('💡 Solution: Contactez l\'hébergeur pour autoriser les analyses automatiques');
        } else if (accessibilityResult.error?.includes('hors ligne')) {
          step.warnings.push('💡 Solution: Vérifiez l\'état du serveur et la configuration DNS');
        } else if (accessibilityResult.error?.includes('certificat')) {
          step.warnings.push('💡 Solution: Renouvelez le certificat SSL ou contactez l\'hébergeur');
        }
      }

      step.status = accessibilityResult.ok ? 'completed' : 'failed';
      step.duration = Date.now() - stepStart;
      
      console.log(`✅ Validation terminée: ${step.status} en ${step.duration}ms`);
      
      return step;

    } catch (error) {
      console.error('❌ Erreur validation domaine:', error);
      step.status = 'failed';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid URL')) {
          step.error = 'URL invalide. Vérifiez le format (ex: https://monsite.com)';
        } else {
          step.error = error.message;
        }
      } else {
        step.error = 'Erreur de connectivité réseau';
      }
      
      step.duration = Date.now() - stepStart;
      return step;
    }
  }

  // Étape 2: Analyse WHOIS
  private async analyzeWhois(url: string): Promise<StepResult> {
    const stepStart = Date.now();
    const step = this.initStepResult('Analyse WHOIS');

    try {
      const domain = new URL(url).hostname;
      
      // Utiliser le service WHOIS
      const whoisData = await whoisService.analyzeWhoisDetailed(domain, 'temp-website-id', 'temp-user-id');
      
      step.data = {
        registrar: whoisData.registrar,
        expirationDate: whoisData.expirationDate,
        daysUntilExpiration: whoisData.daysUntilExpiration,
        isPrivacyProtected: whoisData.privacyProtection,
        securityScore: whoisData.securityScore
      };

      // Vérifications critiques
      if (whoisData.daysUntilExpiration < 30) {
        step.warnings.push(`Domaine expire dans ${whoisData.daysUntilExpiration} jours !`);
      }

      if (whoisData.securityScore < 70) {
        step.warnings.push('Configuration de sécurité du domaine à améliorer');
      }

      step.status = 'completed';
      step.duration = Date.now() - stepStart;
      
      return step;

    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Erreur analyse WHOIS';
      step.duration = Date.now() - stepStart;
      return step;
    }
  }

  // Étape 3: Analyse de la page d'accueil
  private async analyzeHomepage(url: string): Promise<StepResult> {
    const stepStart = Date.now();
    const step = this.initStepResult('Analyse page d\'accueil');

    try {
      // Utiliser le service d'analyse réelle
      const realData = await realAnalysisService.analyzeWebsite(url);
      
      step.data = {
        title: realData.seoData.title,
        metaDescription: realData.seoData.metaDescription,
        wordCount: realData.seoData.wordCount,
        isWordPress: this.detectWordPress(realData),
        technologies: this.detectTechnologies(realData),
        loadTime: realData.performance.loadTime,
        httpsEnabled: realData.security.httpsEnabled,
        basicSeoScore: this.calculateBasicSeoScore(realData.seoData)
      };

      // Vérifications importantes
      if (!step.data.isWordPress) {
        step.warnings.push('Site ne semble pas être sous WordPress');
      }

      if (!step.data.httpsEnabled) {
        step.warnings.push('HTTPS non activé - problème de sécurité');
      }

      if (step.data.loadTime > 3) {
        step.warnings.push(`Temps de chargement lent: ${step.data.loadTime}s`);
      }

      step.status = 'completed';
      step.duration = Date.now() - stepStart;
      
      return step;

    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Erreur analyse page d\'accueil';
      step.duration = Date.now() - stepStart;
      return step;
    }
  }

  // Étape 4: Découverte de l'architecture
  private async discoverArchitecture(url: string): Promise<StepResult> {
    const stepStart = Date.now();
    const step = this.initStepResult('Découverte architecture');

    try {
      const pages = await this.discoverPagesOptimized(url);
      const sitemapExists = await this.checkSitemap(url);
      const robotsExists = await this.checkRobotsTxt(url);
      
      step.data = {
        pagesDiscovered: pages.length,
        pages: pages.slice(0, 20), // Limiter pour l'affichage
        hasSitemap: sitemapExists,
        hasRobotsTxt: robotsExists,
        urlStructure: this.analyzeUrlStructure(pages)
      };

      if (!sitemapExists) {
        step.warnings.push('Sitemap XML non trouvé');
      }

      if (!robotsExists) {
        step.warnings.push('Fichier robots.txt non trouvé');
      }

      step.status = 'completed';
      step.duration = Date.now() - stepStart;
      
      return step;

    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Erreur découverte architecture';
      step.duration = Date.now() - stepStart;
      return step;
    }
  }

  // Étape 5: Inventaire des ressources
  private async inventoryResources(url: string, homepageData: any): Promise<StepResult> {
    const stepStart = Date.now();
    const step = this.initStepResult('Inventaire ressources');

    try {
      const realData = await realAnalysisService.analyzeWebsite(url);
      
      step.data = {
        images: {
          total: realData.seoData.images.length,
          withAlt: realData.seoData.images.filter(img => img.hasAlt).length,
          withoutAlt: realData.seoData.images.filter(img => !img.hasAlt).length,
          list: realData.seoData.images.slice(0, FIRST_STEP_CONFIG.LIMITS.MAX_IMAGES_INVENTORY)
        },
        links: {
          internal: realData.seoData.internalLinks.length,
          external: realData.seoData.externalLinks.length,
          broken: realData.brokenLinks.length
        },
        forms: {
          found: realData.forms.found,
          hasCaptcha: realData.forms.hasRecaptcha
        },
        performance: {
          contentSize: realData.performance.contentSize,
          resourceCount: realData.performance.resourceCount,
          compressionEnabled: realData.performance.compressionEnabled
        }
      };

      // Vérifications
      if (step.data.images.withoutAlt > 0) {
        step.warnings.push(`${step.data.images.withoutAlt} images sans attribut alt`);
      }

      if (step.data.links.broken > 0) {
        step.warnings.push(`${step.data.links.broken} liens cassés détectés`);
      }

      step.status = 'completed';
      step.duration = Date.now() - stepStart;
      
      return step;

    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Erreur inventaire ressources';
      step.duration = Date.now() - stepStart;
      return step;
    }
  }

  // Méthodes utilitaires
  private initStepResult(name: string): StepResult {
    return {
      name,
      status: 'completed',
      duration: 0,
      warnings: []
    };
  }

  private detectWordPress(realData: any): boolean {
    // Utiliser le service de détection avancé
    const wpDetection = technologyDetectionService.detectWordPress(realData.rawHtml || '', realData.url);
    return wpDetection.isWordPress;
  }

  private detectTechnologies(realData: any): string[] {
    // Utiliser le service de détection avancé
    const detectedTechs = technologyDetectionService.detectAllTechnologies(realData.rawHtml || '', realData.url);
    return detectedTechs.map(tech => {
      if (tech.version) {
        return `${tech.name} ${tech.version}`;
      }
      return tech.name;
    });
  }

  private calculateBasicSeoScore(seoData: any): number {
    let score = 100;
    
    if (!seoData.title) score -= 20;
    if (!seoData.metaDescription) score -= 15;
    if (seoData.h1Tags.length !== 1) score -= 15;
    if (seoData.wordCount < 300) score -= 10;
    
    return Math.max(0, score);
  }

  private async discoverPages(url: string): Promise<string[]> {
    try {
      // Logique de découverte des pages
      // Utiliser sitemap, puis crawling si nécessaire
      return []; // Implémentation simplifiée
    } catch {
      return [];
    }
  }

  // Découverte optimisée des pages avec multiple stratégies
  private async discoverPagesOptimized(url: string): Promise<string[]> {
    const pages = new Set<string>();
    pages.add(url); // Ajouter la page d'accueil
    
    try {
      console.log('🔍 Découverte optimisée des pages pour:', url);
      
      // Stratégie 1: Sitemap XML (plus efficace)
      const sitemapPages = await this.fetchSitemapPages(url);
      if (sitemapPages.length > 0) {
        console.log(`✅ Sitemap trouvé: ${sitemapPages.length} pages`);
        sitemapPages.forEach(page => pages.add(page));
      }
      
      // Stratégie 2: Crawling de la page d'accueil si pas assez de pages
      if (pages.size < 10) {
        console.log('🕷️ Crawling de la page d\'accueil...');
        const crawledPages = await this.crawlHomepage(url);
        crawledPages.forEach(page => pages.add(page));
      }
      
      // Stratégie 3: Pages WordPress communes
      const wpPages = this.generateWordPressPages(url);
      wpPages.forEach(page => pages.add(page));
      
      const result = Array.from(pages).slice(0, FIRST_STEP_CONFIG.LIMITS.MAX_PAGES_DISCOVERY);
      console.log(`📊 Total pages découvertes: ${result.length}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur découverte pages:', error);
      return [url]; // Au minimum la page d'accueil
    }
  }

  // Récupération optimisée du sitemap
  private async fetchSitemapPages(baseUrl: string): Promise<string[]> {
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/wp-sitemap.xml`,
      `${baseUrl}/sitemap-index.xml`,
      `${baseUrl}/post-sitemap.xml`,
      `${baseUrl}/page-sitemap.xml`
    ];
    
    for (const sitemapUrl of sitemapUrls) {
      try {
        console.log('🗺️ Vérification sitemap via proxy:', sitemapUrl);
        const accessResult = await realAnalysisService.checkUrlAccessibility(sitemapUrl);
        
        if (accessResult.ok) {
          // Récupérer le contenu du sitemap via proxy
          const sitemapResult = await realAnalysisService.fetchWithOptimizedProxy(sitemapUrl);
          if (sitemapResult.success && sitemapResult.content) {
            console.log('✅ Sitemap trouvé et récupéré:', sitemapUrl);
            return this.parseSitemapContent(sitemapResult.content, baseUrl);
          }
        }
      } catch (error) {
        console.log('❌ Erreur sitemap:', sitemapUrl, error);
        continue; // Essayer le sitemap suivant
      }
    }
    
    console.log('⚠️ Aucun sitemap trouvé');
    return [];
  }

  // Parser optimisé du sitemap
  private parseSitemapContent(sitemapContent: string, baseUrl: string): string[] {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sitemapContent, 'text/xml');
      
      // Vérifier les erreurs de parsing
      const parseError = doc.querySelector('parsererror');
      if (parseError) return [];
      
      const urls: string[] = [];
      
      // Extraire les URLs
      const urlElements = doc.querySelectorAll('url > loc, sitemap > loc');
      urlElements.forEach(element => {
        const url = element.textContent?.trim();
        if (url && url.startsWith(baseUrl)) {
          urls.push(url);
        }
      });
      
      return urls.slice(0, 50); // Limiter pour les performances
      
    } catch (error) {
      console.error('Erreur parsing sitemap:', error);
      return [];
    }
  }

  // Crawling optimisé de la page d'accueil
  private async crawlHomepage(url: string): Promise<string[]> {
    try {
      console.log('🕷️ Crawling homepage via proxy:', url);
      const result = await realAnalysisService.analyzeWebsite(url);
      const html = result.rawHtml || '';
      
      if (!html) {
        console.log('⚠️ Pas de HTML récupéré pour le crawling');
        return [];
      }
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const links = Array.from(doc.querySelectorAll('a[href]'));
      const pages: string[] = [];
      
      for (const link of links) {
        const href = link.getAttribute('href');
        if (!href) continue;
        
        try {
          const fullUrl = new URL(href, url).href;
          if (fullUrl.startsWith(url) && !pages.includes(fullUrl)) {
            pages.push(fullUrl);
          }
        } catch {
          // URL invalide, ignorer
        }
      }
      
      return pages.slice(0, 30); // Limiter pour les performances
      
    } catch (error) {
      console.error('Erreur crawling homepage:', error);
      return [];
    }
  }

  // Génération des pages WordPress communes
  private generateWordPressPages(baseUrl: string): string[] {
    const commonPages = [
      '/about',
      '/contact',
      '/services',
      '/blog',
      '/news',
      '/portfolio',
      '/team',
      '/privacy-policy',
      '/terms',
      '/sitemap'
    ];
    
    return commonPages.map(page => `${baseUrl}${page}`);
  }
  private async checkSitemap(url: string): Promise<boolean> {
    try {
      const sitemapUrl = `${url}/sitemap.xml`;
      const result = await realAnalysisService.checkUrlAccessibility(sitemapUrl);
      return result.ok;
    } catch {
      return false;
    }
  }

  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const robotsUrl = `${url}/robots.txt`;
      const result = await realAnalysisService.checkUrlAccessibility(robotsUrl);
      return result.ok;
    } catch {
      return false;
    }
  }

  private analyzeUrlStructure(pages: string[]): any {
    return {
      hasCleanUrls: pages.some(page => !page.includes('?')),
      averageDepth: pages.reduce((sum, page) => sum + (page.split('/').length - 3), 0) / pages.length,
      hasCategories: pages.some(page => page.includes('/category/')),
      hasTags: pages.some(page => page.includes('/tag/'))
    };
  }

  private generateSummary(steps: any): any {
    return {
      isWordPress: steps.homepageAnalysis.data?.isWordPress || false,
      isAccessible: steps.domainValidation.status === 'completed',
      domainExpiresIn: steps.whoisAnalysis.data?.daysUntilExpiration || 0,
      pagesDiscovered: steps.architectureDiscovery.data?.pagesDiscovered || 0,
      imagesFound: steps.resourceInventory.data?.images?.total || 0,
      criticalIssues: this.extractCriticalIssues(steps),
      nextSteps: this.generateNextSteps(steps)
    };
  }

  private extractCriticalIssues(steps: any): string[] {
    const issues: string[] = [];
    
    Object.values(steps).forEach((step: any) => {
      if (step.warnings) {
        issues.push(...step.warnings);
      }
    });
    
    return issues;
  }

  private generateNextSteps(steps: any): string[] {
    const nextSteps: string[] = [];
    
    if (steps.homepageAnalysis.data?.isWordPress) {
      nextSteps.push('Analyse SEO approfondie');
      nextSteps.push('Test de performance');
      nextSteps.push('Audit de sécurité');
    }
    
    if (steps.resourceInventory.data?.forms?.found > 0) {
      nextSteps.push('Analyse des formulaires');
    }
    
    return nextSteps;
  }

  private determineOverallStatus(steps: any): 'completed' | 'partial' | 'failed' {
    const stepStatuses = Object.values(steps).map((step: any) => step.status);
    
    if (stepStatuses.every(status => status === 'completed')) {
      return 'completed';
    } else if (stepStatuses.some(status => status === 'completed')) {
      return 'partial';
    } else {
      return 'failed';
    }
  }
}

export const firstStepAnalysisService = new FirstStepAnalysisService();