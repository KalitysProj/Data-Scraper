import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Website = Database['public']['Tables']['websites']['Row'];
type WebsiteInsert = Database['public']['Tables']['websites']['Insert'];
type Analysis = Database['public']['Tables']['analyses']['Row'];
type AnalysisInsert = Database['public']['Tables']['analyses']['Insert'];
type AnalysisSession = Database['public']['Tables']['analysis_sessions']['Row'];
type AnalysisSessionInsert = Database['public']['Tables']['analysis_sessions']['Insert'];

// Configuration centralisée optimisée
const WEBSITE_CONFIG = {
  SCRAPING: {
    MAX_PAGES_DISCOVERY: 50,
    MAX_PAGES_FULL_SCRAPING: 100,
    MAX_PAGES_SITEMAP: 200,
    REQUEST_DELAY: 800,
    CONCURRENT_REQUESTS: 3
  },
  PROXY: {
    URLS: [
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/',
      'https://thingproxy.freeboard.io/fetch/',
      'https://api.codetabs.com/v1/proxy?quest='
    ] as const,
    TIMEOUT: {
      FAST: 6000,
      NORMAL: 8000,
      SLOW: 12000
    },
    MAX_RETRIES: 3
  },
  CACHE: {
    TTL: 10 * 60 * 1000, // 10 minutes
    MAX_SIZE: 30
  }
} as const;

export class WebsiteService {
  private cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private requestQueue = new Map<string, Promise<any>>();

  // Cache optimisé avec gestion intelligente
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < WEBSITE_CONFIG.CACHE.TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    if (this.cache.size >= WEBSITE_CONFIG.CACHE.MAX_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
    
    const size = JSON.stringify(data).length;
    this.cache.set(key, { data, timestamp: Date.now(), size });
  }

  // Découvrir et stocker un nouveau site avec déduplication
  async discoverWebsite(url: string, userId: string): Promise<Website> {
    console.log('🔍 Découverte du site:', url);
    
    // Si Supabase n'est pas configuré, retourner un objet temporaire
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - création d\'un site temporaire');
      const { hostname: domain } = new URL(url);
      
      return {
        id: `temp-${Date.now()}`,
        url,
        domain,
        title: 'Site en mode offline',
        meta_description: 'Analyse en mode offline sans base de données',
        discovered_at: new Date().toISOString(),
        last_scraped: null,
        page_count: 0,
        status: 'discovered',
        user_id: userId,
        scraping_data: null
      } as Website;
    }
    
    const cacheKey = `discover_${url}_${userId}`;
    
    // Vérifier si une découverte est déjà en cours
    const existingRequest = this.requestQueue.get(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }

    const discoveryPromise = this.performDiscovery(url, userId, cacheKey);
    this.requestQueue.set(cacheKey, discoveryPromise);

    try {
      return await discoveryPromise;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async performDiscovery(url: string, userId: string, cacheKey: string): Promise<Website> {
    try {
      const { hostname: domain } = new URL(url);
      
      // Vérifier le cache
      const cached = this.getCached<Website>(cacheKey);
      if (cached) {
        console.log('✅ Site trouvé en cache:', cached.id);
        return cached;
      }
      
      // Vérifier si le site existe déjà en base
      const { data: existing } = await supabase
        .from('websites')
        .select('*')
        .eq('url', url)
        .eq('user_id', userId)
        .single();
      
      if (existing) {
        console.log('✅ Site déjà découvert:', existing.id);
        this.setCache(cacheKey, existing);
        return existing;
      }
      
      // Scraper les informations de base
      const basicInfo = await this.scrapBasicInfo(url);
      
      // Créer l'entrée dans la base
      const websiteData: WebsiteInsert = {
        url,
        domain,
        title: basicInfo.title,
        meta_description: basicInfo.metaDescription,
        page_count: basicInfo.pageCount,
        status: 'discovered',
        user_id: userId,
        scraping_data: basicInfo.scrapingData
      };
      
      const { data, error } = await supabase
        .from('websites')
        .insert(websiteData)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('🎉 Site découvert et stocké:', data.id);
      this.setCache(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('❌ Erreur découverte site:', error);
      throw error;
    }
  }
  
  // Scraper complet optimisé avec gestion d'erreurs
  async scrapWebsite(websiteId: string, userId: string): Promise<Website> {
    console.log('🕷️ Scraping complet du site:', websiteId);
    
    try {
      // Vérifier que Supabase est configuré
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
      }
      
      // Récupérer le site
      const { data: website, error: fetchError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .eq('user_id', userId)
        .single();
      
      if (fetchError || !website) {
        throw new Error('Site non trouvé');
      }
      
      // Scraper toutes les pages avec limitation
      const scrapingResult = await this.performFullScraping(website.url);
      
      // Mettre à jour le site avec les données complètes
      const { data: updatedWebsite, error: updateError } = await supabase
        .from('websites')
        .update({
          page_count: scrapingResult.pages.length,
          status: 'scraped',
          last_scraped: new Date().toISOString(),
          scraping_data: scrapingResult
        })
        .eq('id', websiteId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      console.log('🎉 Scraping terminé:', updatedWebsite.page_count, 'pages');
      return updatedWebsite;
      
    } catch (error) {
      console.error('❌ Erreur scraping:', error);
      
      // Marquer comme erreur
      await supabase
        .from('websites')
        .update({ status: 'error' })
        .eq('id', websiteId);
      
      throw error;
    }
  }
  
  // Gestion optimisée des analyses
  async createAnalysis(websiteId: string, userId: string, analysisType: Database['public']['Enums']['analysis_type']): Promise<Analysis> {
    console.log('📊 Création analyse:', analysisType, 'pour site:', websiteId);
    
    // Si Supabase n'est pas configuré, créer une analyse temporaire
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - création d\'une analyse temporaire');
      return {
        id: `temp-analysis-${Date.now()}`,
        website_id: websiteId,
        user_id: userId,
        analysis_type: analysisType,
        status: 'pending',
        progress: 0,
        started_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        results: null,
        session_id: null
      } as Analysis;
    }
    
    const analysisData: AnalysisInsert = {
      website_id: websiteId,
      user_id: userId,
      analysis_type: analysisType,
      status: 'pending',
      progress: 0
    };
    
    const { data, error } = await supabase
      .from('analyses')
      .insert(analysisData)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Analyse créée:', data.id);
    return data;
  }
  
  // Mise à jour optimisée du progrès
  async updateAnalysisProgress(analysisId: string, progress: number, status?: Database['public']['Enums']['analysis_status']): Promise<void> {
    // Si Supabase n'est pas configuré, ignorer silencieusement
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - mise à jour du progrès ignorée');
      return;
    }
    
    const updateData: any = { progress };
    
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    
    const { error } = await supabase
      .from('analyses')
      .update(updateData)
      .eq('id', analysisId);
    
    if (error) throw error;
  }
  
  // Récupération optimisée avec pagination
  async getUserWebsites(userId: string, limit: number = 50): Promise<Website[]> {
    // Si Supabase n'est pas configuré, retourner des données d'exemple
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - retour de données d\'exemple');
      return [{
        id: 'temp-website-1',
        url: 'https://example-wordpress.com',
        domain: 'example-wordpress.com',
        title: 'Site WordPress Exemple',
        meta_description: 'Un site WordPress d\'exemple pour démonstration',
        discovered_at: new Date().toISOString(),
        last_scraped: null,
        page_count: 15,
        status: 'scraped',
        user_id: userId,
        scraping_data: null
      }];
    }
    
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('user_id', userId)
      .order('discovered_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }
  
  // Sessions d'analyse avec jointures optimisées
  async getUserAnalysisSessions(userId: string): Promise<AnalysisSession[]> {
    // Si Supabase n'est pas configuré, retourner des données d'exemple
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - retour de sessions d\'exemple');
      return [{
        id: 'temp-session-1',
        website_id: 'temp-website-1',
        user_id: userId,
        session_name: 'Analyse d\'exemple',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: 120,
        status: 'completed',
        modules_selected: ['seo', 'performance'],
        modules_completed: ['seo', 'performance'],
        overall_score: 85,
        summary: {},
        metadata: {},
        websites: {
          url: 'https://example-wordpress.com',
          domain: 'example-wordpress.com',
          title: 'Site WordPress Exemple'
        }
      }];
    }
    
    const { data, error } = await supabase
      .from('analysis_sessions')
      .select(`
        *,
        websites (
          url,
          domain,
          title
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return data || [];
  }
  
  // Gestion optimisée des sessions
  async createAnalysisSession(params: {
    websiteId: string;
    userId: string;
    sessionName: string;
    modulesSelected: string[];
  }): Promise<AnalysisSession> {
    console.log('📊 Création session d\'analyse:', params.sessionName);
    
    // Si Supabase n'est pas configuré, créer une session temporaire
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - création d\'une session temporaire');
      return {
        id: `temp-session-${Date.now()}`,
        website_id: params.websiteId,
        user_id: params.userId,
        session_name: params.sessionName,
        started_at: new Date().toISOString(),
        completed_at: null,
        duration_seconds: null,
        status: 'created',
        modules_selected: params.modulesSelected,
        modules_completed: [],
        overall_score: null,
        summary: {},
        metadata: {}
      } as AnalysisSession;
    }
    
    const sessionData: AnalysisSessionInsert = {
      website_id: params.websiteId,
      user_id: params.userId,
      session_name: params.sessionName,
      modules_selected: params.modulesSelected,
      status: 'created'
    };
    
    const { data, error } = await supabase
      .from('analysis_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Session créée:', data.id);
    return data;
  }
  
  async startAnalysisSession(sessionId: string): Promise<void> {
    // Si Supabase n'est pas configuré, ignorer silencieusement
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - démarrage de session ignoré');
      return;
    }
    
    const { error } = await supabase
      .from('analysis_sessions')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (error) throw error;
  }
  
  async updateSessionProgress(sessionId: string, completedModules: string[]): Promise<void> {
    // Si Supabase n'est pas configuré, ignorer silencieusement
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - mise à jour du progrès ignorée');
      return;
    }
    
    const { error } = await supabase
      .from('analysis_sessions')
      .update({ 
        modules_completed: completedModules
      })
      .eq('id', sessionId);
    
    if (error) throw error;
  }
  
  async completeAnalysisSession(sessionId: string, overallScore: number): Promise<void> {
    // Si Supabase n'est pas configuré, ignorer silencieusement
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - finalisation de session ignorée');
      return;
    }
    
    const { error } = await supabase
      .from('analysis_sessions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        overall_score: overallScore
      })
      .eq('id', sessionId);
    
    if (error) throw error;
  }
  
  async getWebsiteAnalysisSessions(websiteId: string, userId: string): Promise<AnalysisSession[]> {
    // Si Supabase n'est pas configuré, retourner des données d'exemple
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - retour de sessions d\'exemple');
      return [];
    }
    
    const { data, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('website_id', websiteId)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return data || [];
  }
  
  async getWebsiteAnalyses(websiteId: string, userId: string): Promise<Analysis[]> {
    // Si Supabase n'est pas configuré, retourner des données d'exemple
    if (!isSupabaseConfigured || !supabase) {
      console.log('ℹ️ Mode offline - retour d\'analyses d\'exemple');
      return [];
    }
    
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('website_id', websiteId)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  }
  
  // Scraping optimisé des informations de base
  private async scrapBasicInfo(url: string) {
    console.log('📄 Scraping informations de base:', url);
    
    try {
      const response = await this.fetchWithProxy(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(response, 'text/html');
      
      // Extraction optimisée en une passe
      const title = doc.querySelector('title')?.textContent?.trim() || '';
      const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
      
      // Découvrir les pages avec limitation
      const pages = await this.discoverPages(url, response);
      
      return {
        title,
        metaDescription,
        pageCount: pages.length,
        scrapingData: {
          pages: pages.slice(0, WEBSITE_CONFIG.SCRAPING.MAX_PAGES_DISCOVERY),
          discoveredAt: new Date().toISOString(),
          method: 'sitemap+crawling'
        }
      };
      
    } catch (error) {
      console.error('❌ Erreur scraping de base:', error);
      return {
        title: 'Erreur de scraping',
        metaDescription: '',
        pageCount: 0,
        scrapingData: {
          pages: [],
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }
      };
    }
  }
  
  // Scraping complet optimisé avec concurrence limitée
  private async performFullScraping(url: string) {
    console.log('🕷️ Scraping complet de:', url);
    
    try {
      const mainPageHtml = await this.fetchWithProxy(url);
      const pages = await this.discoverPages(url, mainPageHtml);
      
      // Scraper avec limitation et concurrence
      const scrapedPages = [];
      const pagesToScrap = pages.slice(0, WEBSITE_CONFIG.SCRAPING.MAX_PAGES_FULL_SCRAPING);
      
      // Traitement par chunks pour éviter la surcharge
      const chunks = this.chunkArray(pagesToScrap, WEBSITE_CONFIG.SCRAPING.CONCURRENT_REQUESTS);
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(pageUrl => this.scrapePage(pageUrl));
        const chunkResults = await Promise.allSettled(chunkPromises);
        
        chunkResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            scrapedPages.push(result.value);
          } else {
            scrapedPages.push({
              url: chunk[index],
              title: 'Erreur de scraping',
              error: result.reason?.message || 'Erreur inconnue'
            });
          }
        });
        
        // Pause entre les chunks
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          await this.delay(WEBSITE_CONFIG.SCRAPING.REQUEST_DELAY);
        }
      }
      
      return {
        pages: scrapedPages,
        totalPagesDiscovered: pages.length,
        totalPagesScraped: scrapedPages.length,
        scrapedAt: new Date().toISOString(),
        method: 'full-scraping'
      };
      
    } catch (error) {
      console.error('❌ Erreur scraping complet:', error);
      throw error;
    }
  }

  private async scrapePage(pageUrl: string): Promise<any> {
    try {
      const pageHtml = await this.fetchWithProxy(pageUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(pageHtml, 'text/html');
      
      return {
        url: pageUrl,
        title: doc.querySelector('title')?.textContent?.trim() || '',
        metaDescription: doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '',
        wordCount: this.countWords(doc.body?.textContent || ''),
        h1Tags: Array.from(doc.querySelectorAll('h1')).map(h1 => h1.textContent?.trim() || ''),
        h2Tags: Array.from(doc.querySelectorAll('h2')).map(h2 => h2.textContent?.trim() || ''),
        imageCount: doc.querySelectorAll('img').length,
        linkCount: doc.querySelectorAll('a[href]').length,
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Erreur scraping ${pageUrl}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
  
  // Découverte optimisée des pages
  private async discoverPages(baseUrl: string, mainPageHtml: string): Promise<string[]> {
    const pages = new Set<string>();
    pages.add(baseUrl);
    
    try {
      // Essayer le sitemap en premier (plus efficace)
      const sitemapPages = await this.fetchSitemap(baseUrl);
      sitemapPages.forEach(page => pages.add(page));
      
      // Si pas assez de pages, crawler les liens
      if (pages.size < 10) {
        const crawledPages = this.extractLinksFromHTML(mainPageHtml, baseUrl);
        crawledPages.forEach(page => pages.add(page));
      }
      
    } catch (error) {
      console.error('❌ Erreur découverte pages:', error);
    }
    
    return Array.from(pages).slice(0, WEBSITE_CONFIG.SCRAPING.MAX_PAGES_SITEMAP);
  }

  private extractLinksFromHTML(html: string, baseUrl: string): string[] {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = Array.from(doc.querySelectorAll('a[href]'));
      
      return links
        .map(link => {
          const href = link.getAttribute('href');
          if (!href) return null;
          
          try {
            const fullUrl = new URL(href, baseUrl).href;
            return fullUrl.startsWith(baseUrl) ? fullUrl : null;
          } catch {
            return null;
          }
        })
        .filter((link): link is string => link !== null)
        .slice(0, 50);
    } catch {
      return [];
    }
  }
  
  // Récupération optimisée du sitemap
  private async fetchSitemap(baseUrl: string): Promise<string[]> {
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/wp-sitemap.xml`
    ];
    
    for (const sitemapUrl of sitemapUrls) {
      try {
        const sitemapContent = await this.fetchWithProxy(sitemapUrl);
        const urls = this.parseSitemap(sitemapContent, baseUrl);
        
        if (urls.length > 0) {
          console.log('✅ Sitemap trouvé:', urls.length, 'pages');
          return urls;
        }
        
      } catch (error) {
        continue;
      }
    }
    
    return [];
  }

  private parseSitemap(sitemapContent: string, baseUrl: string): string[] {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sitemapContent, 'text/xml');
      
      const urlElements = doc.querySelectorAll('url > loc');
      const urls: string[] = [];
      
      urlElements.forEach(element => {
        const url = element.textContent?.trim();
        if (url && url.startsWith(baseUrl)) {
          urls.push(url);
        }
      });
      
      return urls;
    } catch {
      return [];
    }
  }
  
  // Fetch optimisé avec retry intelligent
  private async fetchWithProxy(url: string, retries = WEBSITE_CONFIG.PROXY.MAX_RETRIES): Promise<string> {
    const cacheKey = `fetch_${url}`;
    const cached = this.getCached<string>(cacheKey);
    if (cached) return cached;

    const errors: string[] = [];

    for (const proxy of WEBSITE_CONFIG.PROXY.URLS) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), WEBSITE_CONFIG.PROXY.TIMEOUT.NORMAL);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) continue;

        let text = await response.text();
        text = this.processProxyResponse(proxy, text);

        if (!this.isValidContent(text)) continue;

        this.setCache(cacheKey, text);
        return text;
        
      } catch (error) {
        errors.push(`${proxy}: ${error instanceof Error ? error.message : 'Erreur'}`);
        continue;
      }
    }

    if (retries > 0) {
      await this.delay(1000);
      return this.fetchWithProxy(url, retries - 1);
    }

    throw new Error(`Échec après ${WEBSITE_CONFIG.PROXY.MAX_RETRIES} tentatives`);
  }

  // Méthodes utilitaires optimisées
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

  private isValidContent(text: string): boolean {
    return text.length > 200 && 
           text.includes('<html') && 
           !text.includes('Access Denied') &&
           !text.includes('Blocked');
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const websiteService = new WebsiteService();