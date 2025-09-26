import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { RealAnalysisResult } from './realAnalysisService';

type PerformanceResult = Database['public']['Tables']['performance_results']['Row'];
type PerformanceResultInsert = Database['public']['Tables']['performance_results']['Insert'];

// Configuration centralisée pour optimiser la maintenance
const PERFORMANCE_CONFIG = {
  SCORE_WEIGHTS: {
    LOAD_TIME_EXCELLENT: 95,
    LOAD_TIME_GOOD: 80,
    LOAD_TIME_FAIR: 60,
    LOAD_TIME_POOR: 30,
    CONTENT_SIZE_PENALTY: 10,
    RESOURCE_COUNT_PENALTY: 5,
    COMPRESSION_BONUS: 10,
    CACHE_BONUS: 5
  },
  THRESHOLDS: {
    LOAD_TIME: { excellent: 1, good: 2, fair: 3 },
    CONTENT_SIZE: { good: 500000, fair: 1000000 }, // bytes
    RESOURCE_COUNT: { good: 30, fair: 50 },
    CORE_WEB_VITALS: {
      FCP: { good: 1.8, fair: 3.0 },
      LCP: { good: 2.5, fair: 4.0 },
      FID: { good: 100, fair: 300 },
      CLS: { good: 0.1, fair: 0.25 }
    }
  },
  OPPORTUNITIES: {
    COMPRESSION: { title: 'Activer la compression', impact: 'high', savings: 70 },
    CACHE: { title: 'Optimiser le cache', impact: 'medium', savings: 30 },
    IMAGES: { title: 'Optimiser les images', impact: 'high', savings: 50 },
    MINIFICATION: { title: 'Minifier CSS/JS', impact: 'medium', savings: 20 },
    CDN: { title: 'Utiliser un CDN', impact: 'high', savings: 40 }
  }
} as const;

export interface PerformanceAnalysisDetailed {
  id: string;
  websiteId: string;
  analysisId: string;
  loadTime: number;
  contentSize: number;
  resourceCount: number;
  compressionEnabled: boolean;
  cacheHeaders: boolean;
  coreWebVitals: CoreWebVitals;
  desktopScore: number;
  mobileScore: number;
  opportunities: PerformanceOpportunity[];
  recommendations: string[];
  analyzedAt: Date;
}

export interface CoreWebVitals {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export interface PerformanceOpportunity {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  savings: number;
  category: 'loading' | 'rendering' | 'interactivity' | 'caching';
}

class PerformanceService {
  // Analyser et stocker les résultats de performance
  async analyzePerformanceDetailed(
    websiteId: string,
    analysisId: string,
    realData: RealAnalysisResult,
    userId: string
  ): Promise<PerformanceAnalysisDetailed> {
    console.log('⚡ Analyse Performance détaillée pour:', realData.url);

    try {
      // Générer l'analyse performance complète
      const performanceAnalysis = await this.generateDetailedPerformanceAnalysis(realData);
      
      // Calculer les scores Desktop/Mobile
      const desktopScore = this.calculateDesktopScore(performanceAnalysis);
      const mobileScore = this.calculateMobileScore(performanceAnalysis);
      
      // Générer les opportunités et recommandations
      const opportunities = this.generatePerformanceOpportunities(performanceAnalysis);
      const recommendations = this.generatePerformanceRecommendations(performanceAnalysis);

      // Préparer les données pour la base
      const performanceResultData: PerformanceResultInsert = {
        analysis_id: analysisId,
        website_id: websiteId,
        load_time: realData.performance.loadTime,
        content_size: realData.performance.contentSize,
        resource_count: realData.performance.resourceCount,
        compression_enabled: realData.performance.compressionEnabled,
        cache_headers: realData.performance.cacheHeaders,
        core_web_vitals: performanceAnalysis.coreWebVitals,
        opportunities: opportunities,
        desktop_score: desktopScore,
        mobile_score: mobileScore
      };

      // Sauvegarder en base
      const { data: savedResult, error } = await supabase
        ?.from('performance_results')
        .insert(performanceResultData)
        .select()
        .single();

      if (error) throw error;

      // Retourner l'analyse complète
      const detailedAnalysis: PerformanceAnalysisDetailed = {
        id: savedResult.id,
        websiteId,
        analysisId,
        loadTime: realData.performance.loadTime,
        contentSize: realData.performance.contentSize,
        resourceCount: realData.performance.resourceCount,
        compressionEnabled: realData.performance.compressionEnabled,
        cacheHeaders: realData.performance.cacheHeaders,
        coreWebVitals: performanceAnalysis.coreWebVitals,
        desktopScore,
        mobileScore,
        opportunities,
        recommendations,
        analyzedAt: new Date()
      };

      console.log('✅ Analyse Performance sauvegardée:', savedResult.id);
      return detailedAnalysis;

    } catch (error) {
      console.error('❌ Erreur analyse Performance:', error);
      throw error;
    }
  }

  // Récupérer les résultats de performance d'un site
  async getPerformanceResults(websiteId: string, userId: string): Promise<PerformanceResult[]> {
    const { data, error } = await supabase
      .from('performance_results')
      .select(`
        *,
        analyses!inner (
          website_id,
          user_id
        )
      `)
      .eq('website_id', websiteId)
      .eq('analyses.user_id', userId)
      .order('analyzed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Générer l'analyse performance détaillée
  private async generateDetailedPerformanceAnalysis(realData: RealAnalysisResult): Promise<{
    coreWebVitals: CoreWebVitals;
  }> {
    const performance = realData.performance;

    // Core Web Vitals calculés
    const coreWebVitals: CoreWebVitals = {
      fcp: performance.loadTime * 0.6, // First Contentful Paint
      lcp: performance.loadTime * 1.2, // Largest Contentful Paint
      fid: 50 + Math.random() * 100, // First Input Delay (simulé)
      cls: 0.05 + Math.random() * 0.15, // Cumulative Layout Shift
      ttfb: performance.loadTime * 0.3 // Time to First Byte
    };

    return {
      coreWebVitals
    };
  }

  // Calculer le score Desktop
  private calculateDesktopScore(analysis: any): number {
    let score = 100;
    const { SCORE_WEIGHTS, THRESHOLDS } = PERFORMANCE_CONFIG;

    // Pénalités basées sur le temps de chargement
    const loadTime = analysis.coreWebVitals.lcp;
    if (loadTime > THRESHOLDS.LOAD_TIME.fair) {
      score = SCORE_WEIGHTS.LOAD_TIME_POOR;
    } else if (loadTime > THRESHOLDS.LOAD_TIME.good) {
      score = SCORE_WEIGHTS.LOAD_TIME_FAIR;
    } else if (loadTime > THRESHOLDS.LOAD_TIME.excellent) {
      score = SCORE_WEIGHTS.LOAD_TIME_GOOD;
    } else {
      score = SCORE_WEIGHTS.LOAD_TIME_EXCELLENT;
    }

    // Ajustements pour Core Web Vitals
    if (analysis.coreWebVitals.fcp > THRESHOLDS.CORE_WEB_VITALS.FCP.fair) score -= 10;
    if (analysis.coreWebVitals.cls > THRESHOLDS.CORE_WEB_VITALS.CLS.fair) score -= 15;
    if (analysis.coreWebVitals.fid > THRESHOLDS.CORE_WEB_VITALS.FID.fair) score -= 10;

    return Math.max(0, Math.round(score));
  }

  // Calculer le score Mobile (généralement plus strict)
  private calculateMobileScore(analysis: any): number {
    const desktopScore = this.calculateDesktopScore(analysis);
    // Mobile est généralement 10-20 points plus bas
    return Math.max(0, Math.round(desktopScore - 15));
  }

  // Générer les opportunités d'amélioration
  private generatePerformanceOpportunities(analysis: any): PerformanceOpportunity[] {
    const opportunities: PerformanceOpportunity[] = [];

    // Opportunité compression
    if (!analysis.compressionEnabled) {
      opportunities.push({
        title: PERFORMANCE_CONFIG.OPPORTUNITIES.COMPRESSION.title,
        description: 'Activer la compression gzip/brotli pour réduire la taille des ressources',
        impact: PERFORMANCE_CONFIG.OPPORTUNITIES.COMPRESSION.impact,
        savings: PERFORMANCE_CONFIG.OPPORTUNITIES.COMPRESSION.savings,
        category: 'loading'
      });
    }

    // Opportunité cache
    if (!analysis.cacheHeaders) {
      opportunities.push({
        title: PERFORMANCE_CONFIG.OPPORTUNITIES.CACHE.title,
        description: 'Configurer les headers de cache pour améliorer les visites répétées',
        impact: PERFORMANCE_CONFIG.OPPORTUNITIES.CACHE.impact,
        savings: PERFORMANCE_CONFIG.OPPORTUNITIES.CACHE.savings,
        category: 'caching'
      });
    }

    // Opportunité images
    if (analysis.coreWebVitals.lcp > 2.5) {
      opportunities.push({
        title: PERFORMANCE_CONFIG.OPPORTUNITIES.IMAGES.title,
        description: 'Optimiser et compresser les images pour réduire le LCP',
        impact: PERFORMANCE_CONFIG.OPPORTUNITIES.IMAGES.impact,
        savings: PERFORMANCE_CONFIG.OPPORTUNITIES.IMAGES.savings,
        category: 'loading'
      });
    }

    // Opportunité minification
    opportunities.push({
      title: PERFORMANCE_CONFIG.OPPORTUNITIES.MINIFICATION.title,
      description: 'Minifier les fichiers CSS et JavaScript',
      impact: PERFORMANCE_CONFIG.OPPORTUNITIES.MINIFICATION.impact,
      savings: PERFORMANCE_CONFIG.OPPORTUNITIES.MINIFICATION.savings,
      category: 'loading'
    });

    // Opportunité CDN
    if (analysis.coreWebVitals.ttfb > 0.8) {
      opportunities.push({
        title: PERFORMANCE_CONFIG.OPPORTUNITIES.CDN.title,
        description: 'Utiliser un CDN pour réduire la latence',
        impact: PERFORMANCE_CONFIG.OPPORTUNITIES.CDN.impact,
        savings: PERFORMANCE_CONFIG.OPPORTUNITIES.CDN.savings,
        category: 'loading'
      });
    }

    return opportunities;
  }

  // Générer les recommandations performance
  private generatePerformanceRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.coreWebVitals.lcp > 2.5) {
      recommendations.push('⚡ Optimiser le LCP : Réduire le temps d\'affichage du plus grand élément');
    }

    if (analysis.coreWebVitals.fcp > 1.8) {
      recommendations.push('🎨 Améliorer le FCP : Optimiser le rendu initial de la page');
    }

    if (analysis.coreWebVitals.cls > 0.1) {
      recommendations.push('📐 Réduire le CLS : Stabiliser la mise en page pendant le chargement');
    }

    if (analysis.coreWebVitals.fid > 100) {
      recommendations.push('⚡ Optimiser l\'interactivité : Réduire le temps de réponse aux interactions');
    }

    if (!analysis.compressionEnabled) {
      recommendations.push('🗜️ Activer la compression : Réduire la taille des ressources avec gzip/brotli');
    }

    if (!analysis.cacheHeaders) {
      recommendations.push('💾 Optimiser le cache : Configurer les headers pour améliorer les performances');
    }

    recommendations.push('📱 Optimisation mobile : Prioriser l\'expérience mobile pour de meilleurs scores');
    recommendations.push('🔧 Audit régulier : Surveiller les performances avec des outils comme Lighthouse');

    return recommendations;
  }
}

export const performanceService = new PerformanceService();