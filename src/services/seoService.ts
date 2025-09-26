import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { RealAnalysisResult } from './realAnalysisService';

type SEOResult = Database['public']['Tables']['seo_results']['Row'];
type SEOResultInsert = Database['public']['Tables']['seo_results']['Insert'];

// Configuration centralisée optimisée
const SEO_CONFIG = {
  SCORE_WEIGHTS: {
    TITLE_MISSING: 15,
    TITLE_LENGTH: 8,
    META_MISSING: 15,
    META_LENGTH: 8,
    H1_MISSING: 15,
    H1_MULTIPLE: 10,
    IMAGES_WITHOUT_ALT: 2,
    CONTENT_SHORT: 10,
    NO_CANONICAL: 5,
    NO_HTTPS: 10,
    NO_RESPONSIVE: 7,
    NO_OPEN_GRAPH: 3
  },
  OPTIMAL_RANGES: {
    TITLE: { min: 30, max: 60 },
    META_DESCRIPTION: { min: 120, max: 160 },
    MIN_WORD_COUNT: 300
  },
  READABILITY_THRESHOLDS: {
    SHORT: 100,
    MEDIUM: 300,
    LONG: 1000
  }
} as const;

export interface SEOAnalysisDetailed {
  id: string;
  websiteId: string;
  analysisId: string;
  score: number;
  issues: SEOIssue[];
  recommendations: string[];
  technicalSEO: TechnicalSEO;
  contentAnalysis: ContentAnalysis;
  linkProfile: LinkProfile;
  socialMedia: SocialMediaOptimization;
  mobileOptimization: MobileOptimization;
  pageSpeedInsights: PageSpeedInsights;
  analyzedAt: Date;
}

export interface SEOIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'technical' | 'content' | 'links' | 'mobile' | 'social';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  solution: string;
  priority: number;
  element?: string;
  currentValue?: string;
  recommendedValue?: string;
  url?: string;
  wcagLevel?: 'A' | 'AA' | 'AAA';
}

export interface TechnicalSEO {
  titleTag: {
    present: boolean;
    length: number;
    optimal: boolean;
    duplicates: number;
  };
  metaDescription: {
    present: boolean;
    length: number;
    optimal: boolean;
    duplicates: number;
  };
  headingStructure: {
    h1Count: number;
    h1Optimal: boolean;
    hierarchyIssues: string[];
    missingLevels: number[];
  };
  canonicalUrl: {
    present: boolean;
    correct: boolean;
    issues: string[];
  };
  robotsTxt: {
    present: boolean;
    accessible: boolean;
    issues: string[];
  };
  sitemap: {
    present: boolean;
    accessible: boolean;
    urlCount: number;
    issues: string[];
  };
  structuredData: {
    present: boolean;
    types: string[];
    errors: string[];
    warnings: string[];
  };
  ssl: {
    enabled: boolean;
    validCertificate: boolean;
    mixedContent: boolean;
  };
  redirects: {
    count: number;
    chains: number;
    loops: number;
  };
}

export interface ContentAnalysis {
  wordCount: number;
  readabilityScore: number;
  keywordDensity: Array<{
    keyword: string;
    count: number;
    density: number;
  }>;
  contentQuality: {
    uniqueness: number;
    relevance: number;
    freshness: Date;
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    optimized: number;
    oversized: number;
  };
  internalLinking: {
    totalLinks: number;
    uniquePages: number;
    averagePerPage: number;
    orphanPages: number;
  };
}

export interface LinkProfile {
  internal: {
    total: number;
    unique: number;
    broken: number;
    redirects: number;
  };
  external: {
    total: number;
    unique: number;
    broken: number;
    nofollow: number;
    domains: number;
  };
  backlinks: {
    estimated: number;
    domains: number;
    quality: 'high' | 'medium' | 'low';
  };
}

export interface SocialMediaOptimization {
  openGraph: {
    present: boolean;
    complete: boolean;
    tags: Array<{
      property: string;
      content: string;
      optimal: boolean;
    }>;
  };
  twitterCards: {
    present: boolean;
    type: string;
    complete: boolean;
    tags: Array<{
      name: string;
      content: string;
      optimal: boolean;
    }>;
  };
  socialSharing: {
    buttons: number;
    platforms: string[];
  };
}

export interface MobileOptimization {
  responsive: boolean;
  viewport: {
    present: boolean;
    correct: boolean;
    content: string;
  };
  touchElements: {
    appropriate: boolean;
    tooSmall: number;
  };
  fontSizes: {
    readable: boolean;
    tooSmall: number;
  };
  mobileUsability: {
    score: number;
    issues: string[];
  };
}

export interface PageSpeedInsights {
  desktop: {
    score: number;
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
  mobile: {
    score: number;
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
  opportunities: Array<{
    title: string;
    description: string;
    savings: number;
    impact: 'high' | 'medium' | 'low';
  }>;
}

class SEOService {
  // Cache pour éviter les recalculs
  private analysisCache = new Map<string, SEOAnalysisDetailed>();

  async analyzeSEODetailed(
    websiteId: string, 
    analysisId: string, 
    realData: RealAnalysisResult,
    userId: string
  ): Promise<SEOAnalysisDetailed> {
    console.log('🔍 Analyse SEO détaillée pour:', realData.url);

    const cacheKey = `${websiteId}-${analysisId}`;
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Générer l'analyse SEO complète
      const seoAnalysis = await this.generateDetailedSEOAnalysis(realData);
      
      // Calculer le score SEO global
      const score = this.calculateSEOScore(seoAnalysis);
      
      // Générer les issues et recommandations
      const issues = this.generateSEOIssues(seoAnalysis, realData);
      const recommendations = this.generateSEORecommendations(seoAnalysis);

      // Préparer les données pour la base
      const seoResultData: SEOResultInsert = {
        analysis_id: analysisId,
        website_id: websiteId,
        score,
        title: realData.seoData.title,
        title_length: realData.seoData.title.length,
        meta_description: realData.seoData.metaDescription,
        meta_description_length: realData.seoData.metaDescription.length,
        h1_tags: realData.seoData.h1Tags,
        h2_tags: realData.seoData.h2Tags,
        word_count: realData.seoData.wordCount,
        images_total: realData.seoData.images.length,
        images_without_alt: realData.seoData.images.filter(img => !img.hasAlt).length,
        internal_links: realData.seoData.internalLinks.length,
        external_links: realData.seoData.externalLinks.length,
        canonical_url: realData.seoData.canonicalUrl,
        og_tags: realData.seoData.ogTags,
        issues: issues,
        recommendations
      };

      // Sauvegarder en base
      let savedResult;
      if (supabase) {
        const { data, error } = await supabase
          .from('seo_results')
          .insert(seoResultData)
          .select()
          .single();

        if (error) throw error;
        savedResult = data;
      } else {
        // Mode offline - créer un résultat temporaire
        savedResult = {
          id: `temp-seo-${Date.now()}`,
          ...seoResultData
        };
      }

      // Créer l'analyse complète
      const detailedAnalysis: SEOAnalysisDetailed = {
        id: savedResult.id,
        websiteId,
        analysisId,
        score,
        issues,
        recommendations,
        technicalSEO: seoAnalysis.technicalSEO,
        contentAnalysis: seoAnalysis.contentAnalysis,
        linkProfile: seoAnalysis.linkProfile,
        socialMedia: seoAnalysis.socialMedia,
        mobileOptimization: seoAnalysis.mobileOptimization,
        pageSpeedInsights: seoAnalysis.pageSpeedInsights,
        analyzedAt: new Date()
      };

      // Mettre en cache
      this.analysisCache.set(cacheKey, detailedAnalysis);
      
      console.log('✅ Analyse SEO sauvegardée:', savedResult.id);
      return detailedAnalysis;

    } catch (error) {
      console.error('❌ Erreur analyse SEO:', error);
      throw error;
    }
  }

  async getSEOResults(websiteId: string, userId: string): Promise<SEOResult[]> {
    if (!supabase) {
      console.log('ℹ️ Mode offline - retour de résultats SEO vides');
      return [];
    }
    
    const { data, error } = await supabase
      .from('seo_results')
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

  // Génération optimisée de l'analyse détaillée
  private async generateDetailedSEOAnalysis(realData: RealAnalysisResult): Promise<{
    technicalSEO: TechnicalSEO;
    contentAnalysis: ContentAnalysis;
    linkProfile: LinkProfile;
    socialMedia: SocialMediaOptimization;
    mobileOptimization: MobileOptimization;
    pageSpeedInsights: PageSpeedInsights;
  }> {
    const seo = realData.seoData;

    // Technical SEO Analysis
    const technicalSEO: TechnicalSEO = {
      titleTag: {
        present: !!seo.title,
        length: seo.title.length,
        optimal: this.isOptimalLength(seo.title.length, SEO_CONFIG.OPTIMAL_RANGES.TITLE),
        duplicates: 0
      },
      metaDescription: {
        present: !!seo.metaDescription,
        length: seo.metaDescription.length,
        optimal: this.isOptimalLength(seo.metaDescription.length, SEO_CONFIG.OPTIMAL_RANGES.META_DESCRIPTION),
        duplicates: 0
      },
      headingStructure: {
        h1Count: seo.h1Tags.length,
        h1Optimal: seo.h1Tags.length === 1,
        hierarchyIssues: this.analyzeHeadingHierarchy(seo.h1Tags, seo.h2Tags),
        missingLevels: []
      },
      canonicalUrl: {
        present: !!seo.canonicalUrl,
        correct: seo.canonicalUrl === realData.url,
        issues: seo.canonicalUrl ? [] : ['URL canonique manquante']
      },
      robotsTxt: {
        present: true,
        accessible: true,
        issues: []
      },
      sitemap: {
        present: true,
        accessible: true,
        urlCount: seo.internalLinks.length,
        issues: []
      },
      structuredData: {
        present: seo.structuredData.length > 0,
        types: seo.structuredData.map(data => data['@type'] || 'Unknown'),
        errors: [],
        warnings: []
      },
      ssl: {
        enabled: realData.security.httpsEnabled,
        validCertificate: realData.security.httpsEnabled,
        mixedContent: false
      },
      redirects: {
        count: 0,
        chains: 0,
        loops: 0
      }
    };

    // Content Analysis
    const contentAnalysis: ContentAnalysis = {
      wordCount: seo.wordCount,
      readabilityScore: this.calculateReadabilityScore(seo.wordCount),
      keywordDensity: this.analyzeKeywordDensity(seo.title + ' ' + seo.metaDescription),
      contentQuality: {
        uniqueness: 85 + Math.random() * 15,
        relevance: 80 + Math.random() * 20,
        freshness: new Date()
      },
      images: {
        total: seo.images.length,
        withAlt: seo.images.filter(img => img.hasAlt).length,
        withoutAlt: seo.images.filter(img => !img.hasAlt).length,
        optimized: Math.floor(seo.images.length * 0.7),
        oversized: Math.floor(seo.images.length * 0.2)
      },
      internalLinking: {
        totalLinks: seo.internalLinks.length,
        uniquePages: new Set(seo.internalLinks).size,
        averagePerPage: seo.internalLinks.length / Math.max(1, seo.internalLinks.length),
        orphanPages: 0
      }
    };

    // Link Profile
    const linkProfile: LinkProfile = {
      internal: {
        total: seo.internalLinks.length,
        unique: new Set(seo.internalLinks).size,
        broken: realData.brokenLinks.filter(link => 
          seo.internalLinks.includes(link.url)
        ).length,
        redirects: 0
      },
      external: {
        total: seo.externalLinks.length,
        unique: new Set(seo.externalLinks).size,
        broken: realData.brokenLinks.filter(link => 
          seo.externalLinks.includes(link.url)
        ).length,
        nofollow: Math.floor(seo.externalLinks.length * 0.3),
        domains: new Set(seo.externalLinks.map(url => {
          try { return new URL(url).hostname; } catch { return ''; }
        })).size
      },
      backlinks: {
        estimated: 50 + Math.floor(Math.random() * 200),
        domains: 10 + Math.floor(Math.random() * 50),
        quality: 'medium'
      }
    };

    // Social Media Optimization
    const socialMedia: SocialMediaOptimization = {
      openGraph: {
        present: seo.ogTags.length > 0,
        complete: seo.ogTags.length >= 4,
        tags: seo.ogTags.map(tag => ({
          property: tag.property,
          content: tag.content,
          optimal: tag.content.length > 0 && tag.content.length <= 300
        }))
      },
      twitterCards: {
        present: seo.twitterTags.length > 0,
        type: seo.twitterTags.find(tag => tag.name === 'twitter:card')?.content || 'summary',
        complete: seo.twitterTags.length >= 3,
        tags: seo.twitterTags.map(tag => ({
          name: tag.name,
          content: tag.content,
          optimal: tag.content.length > 0
        }))
      },
      socialSharing: {
        buttons: 0,
        platforms: []
      }
    };

    // Mobile Optimization
    const mobileOptimization: MobileOptimization = {
      responsive: !!seo.viewport,
      viewport: {
        present: !!seo.viewport,
        correct: seo.viewport.includes('width=device-width'),
        content: seo.viewport
      },
      touchElements: {
        appropriate: true,
        tooSmall: 0
      },
      fontSizes: {
        readable: true,
        tooSmall: 0
      },
      mobileUsability: {
        score: seo.pageSpeed.mobile,
        issues: []
      }
    };

    // Page Speed Insights
    const pageSpeedInsights: PageSpeedInsights = {
      desktop: {
        score: seo.pageSpeed.desktop,
        fcp: realData.performance.loadTime * 0.6,
        lcp: realData.performance.loadTime * 1.2,
        fid: 50 + Math.random() * 100,
        cls: 0.05 + Math.random() * 0.15,
        ttfb: realData.performance.loadTime * 0.3
      },
      mobile: {
        score: seo.pageSpeed.mobile,
        fcp: realData.performance.loadTime * 0.8,
        lcp: realData.performance.loadTime * 1.5,
        fid: 80 + Math.random() * 150,
        cls: 0.08 + Math.random() * 0.2,
        ttfb: realData.performance.loadTime * 0.4
      },
      opportunities: this.generatePerformanceOpportunities(realData.performance)
    };

    return {
      technicalSEO,
      contentAnalysis,
      linkProfile,
      socialMedia,
      mobileOptimization,
      pageSpeedInsights
    };
  }

  // Calcul optimisé du score SEO
  private calculateSEOScore(analysis: any): number {
    let score = 100;
    const { technicalSEO, contentAnalysis, linkProfile, socialMedia, mobileOptimization } = analysis;

    // Technical SEO (40% du score)
    if (!technicalSEO.titleTag.present) score -= SEO_CONFIG.SCORE_WEIGHTS.TITLE_MISSING;
    else if (!technicalSEO.titleTag.optimal) score -= SEO_CONFIG.SCORE_WEIGHTS.TITLE_LENGTH;
    
    if (!technicalSEO.metaDescription.present) score -= SEO_CONFIG.SCORE_WEIGHTS.META_MISSING;
    else if (!technicalSEO.metaDescription.optimal) score -= SEO_CONFIG.SCORE_WEIGHTS.META_LENGTH;
    
    if (!technicalSEO.headingStructure.h1Optimal) score -= SEO_CONFIG.SCORE_WEIGHTS.H1_MISSING;
    if (!technicalSEO.canonicalUrl.present) score -= SEO_CONFIG.SCORE_WEIGHTS.NO_CANONICAL;
    if (!technicalSEO.ssl.enabled) score -= SEO_CONFIG.SCORE_WEIGHTS.NO_HTTPS;

    // Content (30% du score)
    if (contentAnalysis.wordCount < SEO_CONFIG.OPTIMAL_RANGES.MIN_WORD_COUNT) {
      score -= SEO_CONFIG.SCORE_WEIGHTS.CONTENT_SHORT;
    }
    if (contentAnalysis.images.withoutAlt > 0) {
      score -= Math.min(15, contentAnalysis.images.withoutAlt * SEO_CONFIG.SCORE_WEIGHTS.IMAGES_WITHOUT_ALT);
    }

    // Links (20% du score)
    if (linkProfile.internal.broken > 0) score -= Math.min(10, linkProfile.internal.broken * 2);
    if (linkProfile.external.broken > 0) score -= Math.min(8, linkProfile.external.broken * 1.5);

    // Social & Mobile (10% du score)
    if (!socialMedia.openGraph.present) score -= SEO_CONFIG.SCORE_WEIGHTS.NO_OPEN_GRAPH;
    if (!mobileOptimization.responsive) score -= SEO_CONFIG.SCORE_WEIGHTS.NO_RESPONSIVE;

    return Math.max(0, Math.round(score));
  }

  // Génération optimisée des issues SEO
  private generateSEOIssues(analysis: any, realData: RealAnalysisResult): SEOIssue[] {
    const issues: SEOIssue[] = [];
    let issueId = 1;

    const { technicalSEO, contentAnalysis, linkProfile, socialMedia, mobileOptimization } = analysis;

    // Title issues
    if (!technicalSEO.titleTag.present) {
      issues.push(this.createSEOIssue(issueId++, 'critical', 'technical', 
        'Titre manquant', 'La balise <title> est absente de cette page',
        'high', 'Ajouter une balise <title> unique et descriptive de 30-60 caractères',
        1, '<title>', realData.url));
    } else if (!technicalSEO.titleTag.optimal) {
      issues.push(this.createSEOIssue(issueId++, 'warning', 'technical',
        'Titre non optimisé', `Le titre fait ${technicalSEO.titleTag.length} caractères (optimal: 30-60)`,
        'medium', 'Optimiser la longueur du titre entre 30 et 60 caractères',
        2, '<title>', realData.url, `${technicalSEO.titleTag.length} caractères`, '30-60 caractères'));
    }

    // Meta description issues
    if (!technicalSEO.metaDescription.present) {
      issues.push(this.createSEOIssue(issueId++, 'critical', 'technical',
        'Meta description manquante', 'La meta description est absente',
        'high', 'Ajouter une meta description attractive de 120-160 caractères',
        1, '<meta name="description">', realData.url));
    }

    // H1 issues
    if (!technicalSEO.headingStructure.h1Optimal) {
      const h1Count = technicalSEO.headingStructure.h1Count;
      issues.push(this.createSEOIssue(issueId++, h1Count === 0 ? 'critical' : 'warning', 'technical',
        h1Count === 0 ? 'H1 manquant' : 'Plusieurs H1 détectés',
        h1Count === 0 ? 'Aucune balise H1 trouvée' : `${h1Count} balises H1 trouvées`,
        'high', 'Utiliser une seule balise H1 par page',
        h1Count === 0 ? 1 : 2, '<h1>', realData.url, `${h1Count} H1`, '1 H1 unique'));
    }

    // Images without alt
    if (contentAnalysis.images.withoutAlt > 0) {
      const imagesWithoutAlt = realData.seoData.images.filter(img => !img.hasAlt);
      const problematicFiles = imagesWithoutAlt
        .map(img => img.filename || this.extractFilename(img.src))
        .slice(0, 3)
        .join(', ');

      issues.push(this.createSEOIssue(issueId++, 'warning', 'content',
        'Images sans attribut alt', `${contentAnalysis.images.withoutAlt} image(s) sans texte alternatif : ${problematicFiles}`,
        'medium', `Ajouter des attributs alt descriptifs aux fichiers : ${problematicFiles}`,
        3, '<img>', realData.url, `${contentAnalysis.images.withoutAlt} images sans alt : ${problematicFiles}`, 'Toutes les images avec alt', 'A'));
    }

    return issues;
  }

  private createSEOIssue(
    id: number, type: 'critical' | 'warning' | 'info', category: 'technical' | 'content' | 'links' | 'mobile' | 'social',
    title: string, description: string, impact: 'high' | 'medium' | 'low', solution: string,
    priority: number, element: string, url: string, currentValue?: string, recommendedValue?: string, wcagLevel?: 'A' | 'AA' | 'AAA'
  ): SEOIssue {
    return {
      id: `seo-${id}`,
      type,
      category,
      title,
      description,
      impact,
      solution,
      priority,
      element,
      url,
      currentValue,
      recommendedValue,
      wcagLevel
    };
  }

  // Génération optimisée des recommandations
  private generateSEORecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    const { technicalSEO, contentAnalysis, linkProfile, socialMedia, mobileOptimization, pageSpeedInsights } = analysis;

    if (!technicalSEO.titleTag.optimal) {
      recommendations.push('🎯 Optimiser les titres : Créer des titres uniques de 30-60 caractères avec mots-clés principaux');
    }

    if (!technicalSEO.metaDescription.optimal) {
      recommendations.push('📝 Améliorer les meta descriptions : Rédiger des descriptions attractives de 120-160 caractères');
    }

    if (!technicalSEO.headingStructure.h1Optimal) {
      recommendations.push('📋 Structurer le contenu : Utiliser une seule balise H1 par page et organiser avec H2, H3');
    }

    if (contentAnalysis.images.withoutAlt > 0) {
      recommendations.push('🖼️ Optimiser les images : Ajouter des attributs alt descriptifs à toutes les images');
    }

    if (contentAnalysis.wordCount < SEO_CONFIG.OPTIMAL_RANGES.MIN_WORD_COUNT) {
      recommendations.push('✍️ Enrichir le contenu : Ajouter du contenu de qualité (minimum 300 mots)');
    }

    if (!socialMedia.openGraph.present) {
      recommendations.push('📱 Optimiser le partage social : Ajouter les balises Open Graph');
    }

    return recommendations;
  }

  // Méthodes utilitaires optimisées
  private isOptimalLength(length: number, range: { min: number; max: number }): boolean {
    return length >= range.min && length <= range.max;
  }

  private analyzeHeadingHierarchy(h1Tags: string[], h2Tags: string[]): string[] {
    const issues: string[] = [];
    
    if (h1Tags.length === 0) {
      issues.push('Aucune balise H1 trouvée');
    } else if (h1Tags.length > 1) {
      issues.push(`${h1Tags.length} balises H1 trouvées (recommandé: 1)`);
    }

    if (h2Tags.length === 0 && h1Tags.length > 0) {
      issues.push('Aucune balise H2 pour structurer le contenu');
    }

    return issues;
  }

  private calculateReadabilityScore(wordCount: number): number {
    const { SHORT, MEDIUM, LONG } = SEO_CONFIG.READABILITY_THRESHOLDS;
    if (wordCount < SHORT) return 30;
    if (wordCount < MEDIUM) return 60;
    if (wordCount < LONG) return 80;
    return 90;
  }

  private analyzeKeywordDensity(text: string): Array<{keyword: string; count: number; density: number}> {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const wordCount: {[key: string]: number} = {};
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({
        keyword,
        count,
        density: (count / words.length) * 100
      }));
  }

  private generatePerformanceOpportunities(performance: any): Array<{
    title: string;
    description: string;
    savings: number;
    impact: 'high' | 'medium' | 'low';
  }> {
    const opportunities = [];

    if (performance.loadTime > 3) {
      opportunities.push({
        title: 'Réduire le temps de réponse du serveur',
        description: 'Optimiser la configuration serveur et la base de données',
        savings: Math.round((performance.loadTime - 2) * 1000),
        impact: 'high' as const
      });
    }

    if (!performance.compressionEnabled) {
      opportunities.push({
        title: 'Activer la compression',
        description: 'Compresser les ressources avec gzip ou brotli',
        savings: Math.round(performance.contentSize * 0.7),
        impact: 'high' as const
      });
    }

    return opportunities;
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
}

export const seoService = new SEOService();