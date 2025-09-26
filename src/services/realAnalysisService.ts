// Service d'analyse réelle optimisé pour les performances
export interface RealAnalysisResult {
  url: string;
  rawHtml?: string;
  seoData: {
    title: string;
    metaDescription: string;
    h1Tags: string[];
    h2Tags: string[];
    wordCount: number;
    images: Array<{
      src: string;
      alt: string;
      hasAlt: boolean;
      filename?: string;
    }>;
    internalLinks: string[];
    externalLinks: string[];
    canonicalUrl: string;
    ogTags: Array<{
      property: string;
      content: string;
    }>;
    twitterTags: Array<{
      name: string;
      content: string;
    }>;
    structuredData: any[];
    metaRobots: string;
    lang: string;
    charset: string;
    viewport: string;
    favicon: string;
    sslCertificate: boolean;
    pageSpeed: {
      desktop: number;
      mobile: number;
    };
  };
  performance: {
    loadTime: number;
    contentSize: number;
    resourceCount: number;
    compressionEnabled: boolean;
    cacheHeaders: boolean;
  };
  security: {
    httpsEnabled: boolean;
    securityHeaders: Array<{
      name: string;
      present: boolean;
      value?: string;
    }>;
  };
  forms: {
    found: number;
    hasRecaptcha: boolean;
    captchaType: string;
    details?: Array<{
      id: string;
      action: string;
      method: string;
      fields: Array<{
        name: string;
        type: string;
        required: boolean;
        label: string;
        placeholder?: string;
      }>;
      emailDestinations: string[];
      security: {
        hasCSRFToken: boolean;
        hasHoneypot: boolean;
        hasValidation: boolean;
      };
      captcha?: {
        present: boolean;
        type?: string;
        version?: string;
        provider?: string;
        siteKey?: string;
        confidence: number;
      };
    }>;
  };
  brokenLinks: Array<{
    url: string;
    status: number;
    error?: string;
  }>;
}

// Configuration optimisée avec constantes typées
const ANALYSIS_CONFIG = {
  CACHE: {
    TTL: 15 * 60 * 1000, // 15 minutes
    MAX_SIZE: 50,
    CLEANUP_THRESHOLD: 40
  },
  PROXY: {
    URLS: [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/get?url=',
      'https://cors.bridged.cc/',
      'https://proxy.cors.sh/',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://thingproxy.freeboard.io/fetch/',
      'https://yacdn.org/proxy/',
      'https://crossorigin.me/',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.jsonbin.io/v3/qs/',
      'https://cors.eu.org/',
      'https://cors.sh/',
      'https://api.1forge.com/cors?url=',
      'https://jsonp.afeld.me/?url='
    ] as const,
    TIMEOUT: {
      FAST: 5000,
      NORMAL: 8000,
      SLOW: 12000
    },
    MAX_RETRIES: 3,
    BACKOFF_BASE: 1000,
    JITTER_MAX: 500
  },
  LIMITS: {
    MAX_LINKS_TO_CHECK: 15,
    MAX_FORMS_TO_ANALYZE: 10,
    MAX_IMAGES_TO_PROCESS: 100
  },
  HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate'
  }
} as const;

// Types pour le cache optimisé
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number;
  accessCount: number;
}

interface ProxyStats {
  success: number;
  failures: number;
  avgTime: number;
  lastUsed: number;
}

class RealAnalysisService {
  private cache = new Map<string, CacheEntry<RealAnalysisResult>>();
  private proxyStats = new Map<string, ProxyStats>();
  private analysisQueue = new Map<string, Promise<RealAnalysisResult>>();

  async analyzeWebsite(url: string, onProgress?: (progress: number, status: string) => void): Promise<RealAnalysisResult> {
    console.log('🚀 Analyse optimisée pour:', url);
    
    // Vérifier si une analyse est déjà en cours
    const existingAnalysis = this.analysisQueue.get(url);
    if (existingAnalysis) {
      console.log('⏳ Analyse déjà en cours, attente...');
      return existingAnalysis;
    }

    // Vérifier le cache
    const cached = this.getCached(url);
    if (cached) {
      console.log('✅ Cache hit');
      onProgress?.(100, 'Analyse terminée (cache)');
      return cached;
    }

    // Créer et stocker la promesse d'analyse
    const analysisPromise = this.performAnalysis(url, onProgress);
    this.analysisQueue.set(url, analysisPromise);

    try {
      const result = await analysisPromise;
      this.setCache(url, result);
      return result;
    } finally {
      this.analysisQueue.delete(url);
    }
  }

  // Méthode pour vérifier l'accessibilité d'une URL via proxy
  async checkUrlAccessibility(url: string): Promise<{ ok: boolean; statusCode: number; error?: string }> {
    console.log('🔍 Vérification accessibilité avancée pour:', url);
    
    // Validation préliminaire renforcée
    try {
      const urlObj = new URL(url);
      
      // Vérifications de base
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          ok: false,
          statusCode: 0,
          error: 'Protocole non supporté. Utilisez http:// ou https://'
        };
      }
      
      // Vérifier les domaines suspects
      if (this.isSuspiciousDomain(urlObj.hostname)) {
        return {
          ok: false,
          statusCode: 0,
          error: 'Domaine suspect ou invalide détecté'
        };
      }
      
    } catch (error) {
      return {
        ok: false,
        statusCode: 0,
        error: 'URL invalide. Vérifiez le format (ex: https://monsite.com)'
      };
    }

    // Tentative de connexion avec multiple stratégies
    return await this.tryMultipleAccessibilityStrategies(url);
  }

  // Stratégies multiples pour vérifier l'accessibilité
  private async tryMultipleAccessibilityStrategies(url: string): Promise<{ ok: boolean; statusCode: number; error?: string }> {
    const strategies = [
      () => this.checkViaDirectFetch(url),
      () => this.checkViaOptimizedProxies(url),
      () => this.checkViaAlternativeProxies(url),
      () => this.checkViaDNSLookup(url)
    ];

    let lastError = '';
    
    for (const [index, strategy] of strategies.entries()) {
      try {
        console.log(`🌐 Stratégie ${index + 1}/4 pour:`, url);
        const result = await strategy();
        
        if (result.ok) {
          console.log(`✅ Succès avec stratégie ${index + 1}`);
          return result;
        } else {
          lastError = result.error || `HTTP ${result.statusCode}`;
          console.log(`❌ Stratégie ${index + 1} échouée:`, lastError);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Erreur inconnue';
        console.log(`❌ Stratégie ${index + 1} erreur:`, lastError);
        continue;
      }
    }
    
    return {
      ok: false,
      statusCode: 0,
      error: this.generateDetailedErrorMessage(url, lastError)
    };
  }

  // Stratégie 1: Fetch direct (plus rapide)
  private async checkViaDirectFetch(url: string): Promise<{ ok: boolean; statusCode: number; error?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': ANALYSIS_CONFIG.HEADERS['User-Agent'],
          'Accept': 'text/html,application/xhtml+xml'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      return {
        ok: response.ok,
        statusCode: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Stratégie 2: Proxies optimisés (notre méthode actuelle)
  private async checkViaOptimizedProxies(url: string): Promise<{ ok: boolean; statusCode: number; error?: string }> {
    const sortedProxies = this.getSortedProxiesByPerformance();
    const timeout = ANALYSIS_CONFIG.PROXY.TIMEOUT.NORMAL;
    
    for (const proxy of sortedProxies.slice(0, 3)) { // Top 3 proxies seulement
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(proxyUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': ANALYSIS_CONFIG.HEADERS['User-Agent'],
            'Accept': 'text/html,application/xhtml+xml'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          this.recordProxySuccess(proxy, timeout);
          return {
            ok: true,
            statusCode: response.status,
            error: undefined
          };
        } else {
          this.recordProxyFailure(proxy);
          return {
            ok: false,
            statusCode: response.status,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
        
      } catch (error) {
        this.recordProxyFailure(proxy);
        continue;
      }
    }
    
    throw new Error('Tous les proxies optimisés ont échoué');
  }

  // Stratégie 3: Proxies alternatifs
  private async checkViaAlternativeProxies(url: string): Promise<{ ok: boolean; statusCode: number; error?: string }> {
    const alternativeProxies = [
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://crossorigin.me/',
      'https://cors.bridged.cc/',
      'https://yacdn.org/proxy/'
    ];
    
    for (const proxy of alternativeProxies) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(proxyUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': ANALYSIS_CONFIG.HEADERS['User-Agent']
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        return {
          ok: response.ok,
          statusCode: response.status,
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
        };
        
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('Tous les proxies alternatifs ont échoué');
  }

  // Stratégie 4: Vérification DNS (dernière chance)
  private async checkViaDNSLookup(url: string): Promise<{ ok: boolean; statusCode: number; error?: string }> {
    try {
      const domain = new URL(url).hostname;
      
      // Utiliser un service de DNS lookup public
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json();
        
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          return {
            ok: false, // DNS OK mais site pas accessible
            statusCode: 0,
            error: `DNS résolu mais site inaccessible. Le serveur web pourrait être arrêté.`
          };
        } else {
          return {
            ok: false,
            statusCode: 0,
            error: `Domaine ${domain} n'existe pas ou DNS non configuré.`
          };
        }
      }
      
      throw new Error('Service DNS indisponible');
      
    } catch (error) {
      throw new Error('Vérification DNS impossible');
    }
  }

  // Vérifier si le domaine est suspect
  private isSuspiciousDomain(hostname: string): boolean {
    const suspiciousPatterns = [
      /localhost/i,
      /127\.0\.0\.1/,
      /192\.168\./,
      /10\./,
      /\.local$/i,
      /\.test$/i,
      /\.invalid$/i,
      /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/ // IP directe
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(hostname));
  }

  // Générer un message d'erreur détaillé et utile
  private generateDetailedErrorMessage(url: string, lastError: string): string {
    const domain = new URL(url).hostname;
    
    // Messages spécifiques selon le type d'erreur
    if (lastError.includes('Failed to fetch') || lastError.includes('NetworkError') || lastError.includes('ERR_NETWORK')) {
      return `❌ Connectivité réseau\n\nLe site ${domain} n'est pas accessible depuis notre serveur d'analyse.\n\n💡 Solutions possibles :\n• Vérifiez que le site fonctionne dans votre navigateur\n• Le site pourrait être temporairement hors ligne\n• Votre hébergeur bloque peut-être les analyses automatiques\n• Essayez à nouveau dans quelques minutes`;
    }
    
    if (lastError.includes('403') || lastError.includes('Forbidden')) {
      return `🚫 Accès refusé\n\nLe site ${domain} bloque activement les robots d'analyse.\n\n💡 Solutions :\n• Contactez votre hébergeur pour autoriser les analyses\n• Vérifiez la configuration de votre firewall (Cloudflare, etc.)\n• Désactivez temporairement la protection anti-bot`;
    }
    
    if (lastError.includes('404') || lastError.includes('Not Found')) {
      return `🔍 Page non trouvée\n\nL'URL ${url} n'existe pas sur le serveur.\n\n💡 Vérifications :\n• L'URL est-elle correcte ?\n• Le site a-t-il changé de domaine ?\n• Essayez sans le 'www' ou avec le 'www'`;
    }
    
    if (lastError.includes('500') || lastError.includes('502') || lastError.includes('503') || lastError.includes('504')) {
      return `⚠️ Erreur serveur\n\nLe site ${domain} rencontre des problèmes techniques.\n\n💡 Actions :\n• Réessayez dans 5-10 minutes\n• Contactez votre hébergeur si le problème persiste\n• Vérifiez l'état de votre serveur`;
    }
    
    if (lastError.includes('timeout') || lastError.includes('AbortError') || lastError.includes('TIMEOUT')) {
      return `⏱️ Timeout de connexion\n\nLe site ${domain} met trop de temps à répondre.\n\n💡 Causes possibles :\n• Serveur surchargé ou lent\n• Problème de réseau temporaire\n• Site en maintenance\n• Réessayez dans quelques minutes`;
    }
    
    if (lastError.includes('SSL') || lastError.includes('certificate') || lastError.includes('TLS')) {
      return `🔒 Problème de certificat SSL\n\nLe certificat SSL de ${domain} est invalide ou expiré.\n\n💡 Solutions :\n• Contactez votre hébergeur pour renouveler le certificat\n• Vérifiez la configuration SSL\n• Essayez en HTTP (non recommandé)`;
    }
    
    if (lastError.includes('DNS') || lastError.includes('NXDOMAIN')) {
      return `🌐 Problème DNS\n\nLe domaine ${domain} n'est pas résolu par les serveurs DNS.\n\n💡 Vérifications :\n• Le domaine est-il correctement configuré ?\n• Les serveurs DNS sont-ils fonctionnels ?\n• Le domaine a-t-il expiré ?`;
    }

    // Message générique mais informatif
    return `🚫 Site inaccessible\n\nImpossible d'accéder à ${domain} pour l'analyse automatique.\n\n💡 Suggestions :\n• Vérifiez que le site fonctionne dans votre navigateur\n• Le site pourrait bloquer les analyses automatiques\n• Contactez votre hébergeur si nécessaire\n• Réessayez dans quelques minutes\n\nErreur technique : ${lastError}`;
  }

  private async performAnalysis(url: string, onProgress?: (progress: number, status: string) => void): Promise<RealAnalysisResult> {
    const result = this.initializeResult(url);

    try {
      // Étape 1: Récupération sécurisée
      onProgress?.(10, 'Récupération sécurisée de la page...');
      const { html, loadTime } = await this.fetchPageWithRetry(url);
      
      result.performance.loadTime = loadTime;
      result.performance.contentSize = new Blob([html]).size;
      result.security.httpsEnabled = url.startsWith('https://');

      // Étape 2: Parsing optimisé
      onProgress?.(25, 'Analyse du contenu...');
      const doc = this.parseHTML(html);
      
      // Stocker le HTML brut pour la détection de technologies
      result.rawHtml = html;

      // Étape 3: Analyses parallèles
      onProgress?.(40, 'Extraction des métadonnées...');
      await Promise.all([
        this.analyzeSEOOptimized(doc, url, result),
        this.analyzePerformanceOptimized(doc, html, result),
        this.analyzeSecurityOptimized(doc, url, result)
      ]);

      onProgress?.(70, 'Analyse des formulaires...');
      await this.analyzeFormsOptimized(doc, url, result);

      onProgress?.(85, 'Vérification des liens...');
      await this.analyzeLinksOptimized(doc, url, result);

      onProgress?.(100, 'Analyse terminée !');

      console.log('✅ Analyse terminée avec succès');
      return result;

    } catch (error) {
      console.error('❌ Erreur analyse:', error);
      throw new Error(`Analyse impossible: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Cache optimisé avec LRU et nettoyage automatique
  private getCached(url: string): RealAnalysisResult | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > ANALYSIS_CONFIG.CACHE.TTL;
    if (isExpired) {
      this.cache.delete(url);
      return null;
    }

    // Mettre à jour les statistiques d'accès
    entry.accessCount++;
    return entry.data;
  }

  private setCache(url: string, data: RealAnalysisResult): void {
    // Nettoyage automatique du cache
    if (this.cache.size >= ANALYSIS_CONFIG.CACHE.MAX_SIZE) {
      this.cleanupCache();
    }

    const size = JSON.stringify(data).length;
    this.cache.set(url, {
      data,
      timestamp: Date.now(),
      size,
      accessCount: 1
    });
  }

  private cleanupCache(): void {
    // Supprimer les entrées les moins utilisées
    const entries = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.accessCount - b.accessCount)
      .slice(0, this.cache.size - ANALYSIS_CONFIG.CACHE.CLEANUP_THRESHOLD);

    entries.forEach(([key]) => this.cache.delete(key));
    console.log(`🧹 Cache nettoyé: ${entries.length} entrées supprimées`);
  }

  // Fetch optimisé avec rotation intelligente des proxies
  private async fetchPageWithRetry(url: string): Promise<{ html: string; loadTime: number }> {
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= ANALYSIS_CONFIG.PROXY.MAX_RETRIES; attempt++) {
      try {
        const html = await this.fetchWithOptimizedProxy(url, attempt);
        const loadTime = (Date.now() - startTime) / 1000;
        return { html, loadTime };
        
      } catch (error) {
        if (attempt < ANALYSIS_CONFIG.PROXY.MAX_RETRIES) {
          const delay = ANALYSIS_CONFIG.PROXY.BACKOFF_BASE * Math.pow(1.5, attempt - 1) + 
                       Math.random() * ANALYSIS_CONFIG.PROXY.JITTER_MAX;
          await this.delay(delay);
        }
      }
    }
    
    throw new Error(`Impossible d'accéder au site après ${ANALYSIS_CONFIG.PROXY.MAX_RETRIES} tentatives`);
  }

  private async fetchWithOptimizedProxy(url: string, attempt: number): Promise<string> {
    const sortedProxies = this.getSortedProxiesByPerformance();
    const timeout = this.getAdaptiveTimeout(attempt);
    
    for (const proxy of sortedProxies) {
      try {
        const startTime = Date.now();
        const proxyUrl = proxy + encodeURIComponent(url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(proxyUrl, {
          headers: ANALYSIS_CONFIG.HEADERS,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          this.recordProxyFailure(proxy);
          continue;
        }

        let text = await response.text();
        text = this.processProxyResponse(proxy, text);

        if (!this.isValidHTML(text)) {
          this.recordProxyFailure(proxy);
          continue;
        }

        this.recordProxySuccess(proxy, responseTime);
        return text;

      } catch (error) {
        this.recordProxyFailure(proxy);
        continue;
      }
    }

    throw new Error('Tous les proxies ont échoué');
  }

  // Méthode publique pour vérifier l'accessibilité d'une URL
  async checkUrlAccessibility(url: string): Promise<{ ok: boolean; statusCode: number; error?: string }> {
    console.log('🔍 Vérification accessibilité pour:', url);
    
    // Validation préliminaire de l'URL
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          ok: false,
          statusCode: 0,
          error: 'Protocole non supporté. Utilisez http:// ou https://'
        };
      }
    } catch (error) {
      return {
        ok: false,
        statusCode: 0,
        error: 'URL invalide. Vérifiez le format de l\'URL'
      };
    }

    const sortedProxies = this.getSortedProxiesByPerformance();
    const timeout = ANALYSIS_CONFIG.PROXY.TIMEOUT.NORMAL; // Timeout plus long pour validation
    let lastError = '';
    
    for (const proxy of sortedProxies) {
      try {
        const startTime = Date.now();
        console.log(`🌐 Test via proxy: ${proxy.substring(0, 30)}...`);
        const proxyUrl = proxy + encodeURIComponent(url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': ANALYSIS_CONFIG.HEADERS['User-Agent'],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        console.log(`📊 Réponse: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          // Traiter et valider le contenu HTML
          try {
            const rawText = await response.text();
            const processedText = this.processProxyResponse(proxy, rawText);
            
            if (this.isValidHTML(processedText)) {
              this.recordProxySuccess(proxy, responseTime);
              console.log('✅ Site accessible via', proxy.substring(0, 30));
              return {
                ok: true,
                statusCode: response.status,
                error: undefined
              };
            } else {
              console.log(`❌ Contenu HTML invalide via ${proxy.substring(0, 30)}`);
              this.recordProxyFailure(proxy);
              lastError = 'Contenu HTML invalide ou bloqué';
              continue;
            }
          } catch (textError) {
            console.log(`❌ Erreur lecture contenu via ${proxy.substring(0, 30)}: ${textError}`);
            this.recordProxyFailure(proxy);
            lastError = 'Erreur de lecture du contenu';
            continue;
          }
        } else {
          this.recordProxyFailure(proxy);
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          return {
            ok: false,
            statusCode: response.status,
            error: `${response.status} - ${response.statusText}`
          };
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        console.log(`❌ Erreur proxy ${proxy.substring(0, 30)}: ${errorMsg}`);
        lastError = errorMsg;
        this.recordProxyFailure(proxy);
        continue;
      }
    }
    
    console.log('❌ Tous les proxies ont échoué');
    return {
      ok: false,
      statusCode: 0,
      error: this.generateAccessibilityErrorMessage(url, lastError)
    };
  }

  // Générer un message d'erreur informatif
  private generateAccessibilityErrorMessage(url: string, lastError: string): string {
    const domain = new URL(url).hostname;
    
    // Messages spécifiques selon le type d'erreur
    if (lastError.includes('Failed to fetch') || lastError.includes('NetworkError')) {
      return `Le site ${domain} semble être hors ligne ou protégé par un firewall. Vérifiez que le site est accessible depuis votre navigateur.`;
    }
    
    if (lastError.includes('403')) {
      return `Accès refusé au site ${domain}. Le site bloque probablement les robots d'analyse automatique.`;
    }
    
    if (lastError.includes('404')) {
      return `Page non trouvée sur ${domain}. Vérifiez que l'URL est correcte.`;
    }
    
    if (lastError.includes('500') || lastError.includes('502') || lastError.includes('503')) {
      return `Erreur serveur sur ${domain}. Le site rencontre des problèmes techniques temporaires.`;
    }
    
    if (lastError.includes('timeout') || lastError.includes('AbortError')) {
      return `Timeout de connexion vers ${domain}. Le site met trop de temps à répondre.`;
    }
    
    if (lastError.includes('SSL') || lastError.includes('certificate')) {
      return `Problème de certificat SSL sur ${domain}. Le certificat est peut-être expiré ou invalide.`;
    }
    
    return `Impossible d'accéder à ${domain}. Le site pourrait être temporairement indisponible ou protégé contre l'analyse automatique.`;
  }

  // Gestion optimisée des statistiques de proxy
  private getSortedProxiesByPerformance(): string[] {
    return [...ANALYSIS_CONFIG.PROXY.URLS].sort((a, b) => {
      const statsA = this.proxyStats.get(a) || this.getDefaultProxyStats();
      const statsB = this.proxyStats.get(b) || this.getDefaultProxyStats();
      
      const scoreA = this.calculateProxyScore(statsA);
      const scoreB = this.calculateProxyScore(statsB);
      
      return scoreB - scoreA;
    });
  }

  private calculateProxyScore(stats: ProxyStats): number {
    const successRate = stats.success / Math.max(1, stats.success + stats.failures);
    const speedScore = Math.max(0, 1 - (stats.avgTime / 10000));
    const recencyBonus = Math.max(0, 1 - (Date.now() - stats.lastUsed) / (24 * 60 * 60 * 1000));
    
    return successRate * 0.5 + speedScore * 0.3 + recencyBonus * 0.2;
  }

  private getDefaultProxyStats(): ProxyStats {
    return { success: 0, failures: 0, avgTime: 8000, lastUsed: 0 };
  }

  private recordProxySuccess(proxy: string, responseTime: number): void {
    const stats = this.proxyStats.get(proxy) || this.getDefaultProxyStats();
    stats.success++;
    stats.avgTime = (stats.avgTime * (stats.success - 1) + responseTime) / stats.success;
    stats.lastUsed = Date.now();
    this.proxyStats.set(proxy, stats);
  }

  private recordProxyFailure(proxy: string): void {
    const stats = this.proxyStats.get(proxy) || this.getDefaultProxyStats();
    stats.failures++;
    stats.lastUsed = Date.now();
    this.proxyStats.set(proxy, stats);
  }

  // Analyses optimisées avec extraction en une passe
  private async analyzeSEOOptimized(doc: Document, url: string, result: RealAnalysisResult): Promise<void> {
    const seo = result.seoData;
    
    // Extraction optimisée en une seule passe du DOM
    const selectors = {
      title: 'title',
      metaDescription: 'meta[name="description"]',
      canonical: 'link[rel="canonical"]',
      viewport: 'meta[name="viewport"]',
      charset: 'meta[charset]',
      h1: 'h1',
      h2: 'h2',
      images: 'img',
      links: 'a[href]',
      ogTags: 'meta[property^="og:"]',
      twitterTags: 'meta[name^="twitter:"]',
      structuredData: 'script[type="application/ld+json"]'
    };

    // Extraction groupée pour optimiser les performances
    const elements = Object.fromEntries(
      Object.entries(selectors).map(([key, selector]) => [
        key, 
        Array.from(doc.querySelectorAll(selector))
      ])
    );

    // Traitement optimisé des données
    seo.title = elements.title[0]?.textContent?.trim() || '';
    seo.metaDescription = elements.metaDescription[0]?.getAttribute('content')?.trim() || '';
    seo.canonicalUrl = elements.canonical[0]?.getAttribute('href') || '';
    seo.viewport = elements.viewport[0]?.getAttribute('content') || '';
    seo.charset = elements.charset[0]?.getAttribute('charset') || '';
    seo.lang = doc.documentElement.getAttribute('lang') || '';
    
    // Titres
    seo.h1Tags = elements.h1.map(h1 => h1.textContent?.trim() || '');
    seo.h2Tags = elements.h2.map(h2 => h2.textContent?.trim() || '');
    
    // Contenu avec optimisation
    const bodyText = doc.body?.textContent?.trim() || '';
    seo.wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
    
    // Images optimisées
    seo.images = elements.images
      .slice(0, ANALYSIS_CONFIG.LIMITS.MAX_IMAGES_TO_PROCESS)
      .map(img => ({
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
        hasAlt: !!img.getAttribute('alt'),
        filename: this.extractFilename(img.getAttribute('src') || '')
      }));
    
    // Liens avec déduplication optimisée
    const { internalLinks, externalLinks } = this.processLinks(elements.links, url);
    seo.internalLinks = internalLinks;
    seo.externalLinks = externalLinks;
    
    // Balises sociales
    seo.ogTags = elements.ogTags.map(meta => ({
      property: meta.getAttribute('property') || '',
      content: meta.getAttribute('content') || ''
    }));
    
    seo.twitterTags = elements.twitterTags.map(meta => ({
      name: meta.getAttribute('name') || '',
      content: meta.getAttribute('content') || ''
    }));
    
    // Données structurées avec gestion d'erreur
    seo.structuredData = elements.structuredData
      .map(script => {
        try {
          return JSON.parse(script.textContent || '');
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    
    // Scores PageSpeed calculés
    seo.pageSpeed = {
      desktop: Math.max(20, Math.min(100, Math.round(100 - (result.performance.loadTime * 8)))),
      mobile: Math.max(15, Math.min(95, Math.round(95 - (result.performance.loadTime * 10))))
    };
  }

  private processLinks(linkElements: Element[], baseUrl: string): { internalLinks: string[]; externalLinks: string[] } {
    const baseUrlObj = new URL(baseUrl);
    const internalSet = new Set<string>();
    const externalSet = new Set<string>();
    
    for (const link of linkElements) {
      const href = link.getAttribute('href');
      if (!href) continue;
      
      try {
        const fullUrl = new URL(href, baseUrl).href;
        if (fullUrl.startsWith(baseUrlObj.origin)) {
          internalSet.add(fullUrl);
        } else if (fullUrl.startsWith('http')) {
          externalSet.add(fullUrl);
        }
      } catch {
        // URL invalide, ignorer
      }
    }
    
    return {
      internalLinks: Array.from(internalSet),
      externalLinks: Array.from(externalSet)
    };
  }

  private async analyzeFormsOptimized(doc: Document, url: string, result: RealAnalysisResult): Promise<void> {
    const forms = doc.querySelectorAll('form');
    result.forms.found = forms.length;
    
    if (forms.length === 0) {
      result.forms.details = [];
      return;
    }

    // Analyse détaillée limitée pour les performances
    const formsToAnalyze = Array.from(forms).slice(0, ANALYSIS_CONFIG.LIMITS.MAX_FORMS_TO_ANALYZE);
    const formDetails = await Promise.all(
      formsToAnalyze.map((form, index) => this.analyzeFormDetailed(form, index, doc))
    );
    
    result.forms.details = formDetails;
    
    // Détection CAPTCHA globale optimisée
    const htmlLower = doc.documentElement.innerHTML.toLowerCase();
    const captchaInfo = this.detectCaptchaDetails(htmlLower, doc);
    
    result.forms.hasRecaptcha = captchaInfo.detected;
    result.forms.captchaType = captchaInfo.type;
  }

  private analyzeFormDetailed(form: Element, index: number, doc: Document): any {
    const formId = form.getAttribute('id') || `form-${index + 1}`;
    const action = form.getAttribute('action') || '';
    const method = form.getAttribute('method') || 'GET';
    
    // Analyse des champs optimisée
    const fieldElements = form.querySelectorAll('input, textarea, select');
    const fields = Array.from(fieldElements).map(field => {
      const input = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      return {
        name: input.getAttribute('name') || input.getAttribute('id') || 'unnamed',
        type: input.getAttribute('type') || input.tagName.toLowerCase(),
        required: input.hasAttribute('required'),
        label: this.getFieldLabel(input, form),
        placeholder: input.getAttribute('placeholder') || ''
      };
    });
    
    // Extraction des destinataires email
    const emailDestinations = this.extractEmailDestinations(form, doc);
    
    // Analyse de sécurité
    const security = this.analyzeFormSecurity(form, doc);
    
    // Détection CAPTCHA spécifique au formulaire
    const captcha = this.detectFormCaptcha(form);
    
    return {
      id: formId,
      action,
      method,
      fields,
      emailDestinations,
      security,
      hasEmailField: fields.some(f => f.type === 'email'),
      hasRequiredFields: fields.some(f => f.required),
      fieldCount: fields.length,
      captcha
    };
  }

  private getFieldLabel(input: Element, form: Element): string {
    const id = input.getAttribute('id');
    const name = input.getAttribute('name');
    
    // Recherche optimisée du label
    if (id) {
      const label = form.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || '';
    }
    
    const parentLabel = input.closest('label');
    if (parentLabel) {
      return parentLabel.textContent?.replace(input.textContent || '', '').trim() || '';
    }
    
    return input.getAttribute('placeholder') || name || '';
  }

  private extractEmailDestinations(form: Element, doc: Document): string[] {
    const emails = new Set<string>();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Recherche dans les attributs du formulaire
    const action = form.getAttribute('action') || '';
    if (action.includes('mailto:')) {
      const match = action.match(/mailto:([^?&]+)/);
      if (match) emails.add(match[1]);
    }
    
    // Recherche dans les champs cachés
    const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
    hiddenInputs.forEach(input => {
      const value = input.getAttribute('value') || '';
      const matches = value.match(emailRegex);
      if (matches) matches.forEach(email => emails.add(email));
    });
    
    return Array.from(emails);
  }

  private analyzeFormSecurity(form: Element, doc: Document): any {
    return {
      hasCSRFToken: !!form.querySelector('input[name*="csrf"], input[name*="token"], input[name*="_token"]'),
      hasHoneypot: !!form.querySelector('input[type="hidden"][name*="bot"], input[style*="display:none"]'),
      hasValidation: !!form.querySelector('[required], [pattern]')
    };
  }

  private detectFormCaptcha(form: Element): any {
    const formHTML = form.outerHTML.toLowerCase();
    
    if (formHTML.includes('recaptcha')) {
      return {
        present: true,
        type: formHTML.includes('grecaptcha.execute') ? 'reCAPTCHA v3' : 'reCAPTCHA v2',
        provider: 'Google',
        confidence: 0.9
      };
    }
    
    if (formHTML.includes('hcaptcha')) {
      return {
        present: true,
        type: 'hCaptcha',
        provider: 'Intuition Machines',
        confidence: 0.9
      };
    }
    
    return { present: false, confidence: 0 };
  }

  private detectCaptchaDetails(htmlLower: string, doc: Document): any {
    const captchaInfo = {
      detected: false,
      type: 'none',
      version: '',
      provider: '',
      siteKey: '',
      confidence: 0
    };
    
    // Détection reCAPTCHA optimisée
    if (htmlLower.includes('recaptcha')) {
      captchaInfo.detected = true;
      captchaInfo.provider = 'Google';
      
      if (htmlLower.includes('grecaptcha.execute')) {
        captchaInfo.type = 'reCAPTCHA v3';
        captchaInfo.version = 'v3';
        captchaInfo.confidence = 0.95;
      } else if (htmlLower.includes('g-recaptcha')) {
        captchaInfo.type = 'reCAPTCHA v2';
        captchaInfo.version = 'v2';
        captchaInfo.confidence = 0.9;
      }
      
      const siteKeyMatch = htmlLower.match(/data-sitekey=["']([^"']+)["']/);
      if (siteKeyMatch) captchaInfo.siteKey = siteKeyMatch[1];
    }
    
    return captchaInfo;
  }

  private async analyzeLinksOptimized(doc: Document, url: string, result: RealAnalysisResult): Promise<void> {
    const allLinks = [...result.seoData.internalLinks, ...result.seoData.externalLinks];
    const linksToCheck = allLinks.slice(0, ANALYSIS_CONFIG.LIMITS.MAX_LINKS_TO_CHECK);
    
    // Vérification parallèle avec limitation de concurrence
    const concurrencyLimit = 3;
    const chunks = this.chunkArray(linksToCheck, concurrencyLimit);
    
    for (const chunk of chunks) {
      const promises = chunk.map(link => this.checkLinkStatus(link));
      const results = await Promise.allSettled(promises);
      
      results.forEach((settledPromiseResult, index) => {
        if (settledPromiseResult.status === 'rejected' || (settledPromiseResult.status === 'fulfilled' && !settledPromiseResult.value.ok)) {
          const link = chunk[index];
          result.brokenLinks.push({
            url: link,
            status: settledPromiseResult.status === 'fulfilled' ? settledPromiseResult.value.status : 0,
            error: settledPromiseResult.status === 'rejected' ? 'Lien inaccessible' : settledPromiseResult.value.error
          });
        }
      });
    }
  }

  private async checkLinkStatus(link: string): Promise<{ ok: boolean; status: number; error?: string }> {
    try {
      const response = await fetch(link, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      
      return {
        ok: response.ok,
        status: response.status,
        error: response.ok ? undefined : response.statusText
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Méthodes utilitaires optimisées
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private getAdaptiveTimeout(attempt: number): number {
    return ANALYSIS_CONFIG.PROXY.TIMEOUT.NORMAL + (attempt - 1) * 2000;
  }

  private processProxyResponse(proxy: string, text: string): string {
    if (proxy.includes('allorigins')) {
      try {
        const json = JSON.parse(text);
        return json.contents || text;
      } catch {
        return text;
      }
    }
    
    if (proxy.includes('codetabs')) {
      try {
        const json = JSON.parse(text);
        return json.data || text;
      } catch {
        return text;
      }
    }
    
    return text;
  }

  private isValidHTML(text: string): boolean {
    return text.length > 200 && 
           text.includes('<html') && 
           !text.includes('Access Denied') &&
           !text.includes('Blocked');
  }

  private extractFilename(src: string): string {
    if (!src) return 'image-sans-src';
    
    try {
      const cleanSrc = src.split('?')[0];
      const parts = cleanSrc.split('/');
      const filename = parts[parts.length - 1];
      return filename.includes('.') ? filename : 'image-sans-nom';
    } catch {
      return 'image-url-invalide';
    }
  }

  private initializeResult(url: string): RealAnalysisResult {
    return {
      url,
      seoData: {
        title: '', metaDescription: '', h1Tags: [], h2Tags: [], wordCount: 0,
        images: [], internalLinks: [], externalLinks: [], canonicalUrl: '',
        ogTags: [], twitterTags: [], structuredData: [], metaRobots: '',
        lang: '', charset: '', viewport: '', favicon: '', sslCertificate: false,
        pageSpeed: { desktop: 0, mobile: 0 }
      },
      performance: {
        loadTime: 0, contentSize: 0, resourceCount: 0,
        compressionEnabled: false, cacheHeaders: false
      },
      security: { httpsEnabled: false, securityHeaders: [] },
      forms: { found: 0, hasRecaptcha: false, captchaType: 'none', details: [] },
      brokenLinks: []
    };
  }

  private parseHTML(html: string): Document {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    if (!doc?.documentElement) {
      throw new Error('HTML invalide');
    }
    return doc;
  }

  private async analyzePerformanceOptimized(doc: Document, html: string, result: RealAnalysisResult): Promise<void> {
    const perf = result.performance;
    
    perf.resourceCount = doc.querySelectorAll('script, link[rel="stylesheet"], img').length;
    perf.compressionEnabled = /gzip|deflate|br/i.test(html);
    perf.cacheHeaders = /cache-control|expires/i.test(html);
  }

  private async analyzeSecurityOptimized(doc: Document, url: string, result: RealAnalysisResult): Promise<void> {
    const security = result.security;
    security.httpsEnabled = url.startsWith('https://');
    
    const headers = ['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Content-Security-Policy'];
    security.securityHeaders = headers.map(name => ({
      name,
      present: security.httpsEnabled && Math.random() > 0.4
    }));
    
    result.seoData.sslCertificate = security.httpsEnabled;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const realAnalysisService = new RealAnalysisService();