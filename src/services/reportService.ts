import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { RealAnalysisResult } from './realAnalysisService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type AnalysisSession = Database['public']['Tables']['analysis_sessions']['Row'];

// Configuration centralisée pour optimiser la maintenance
const REPORT_CONFIG = {
  PDF: {
    FORMAT: 'a4' as const,
    ORIENTATION: 'portrait' as const,
    MARGINS: { top: 20, right: 20, bottom: 20, left: 20 },
    FONT_SIZES: { title: 24, subtitle: 18, body: 12, caption: 10 },
    COLORS: {
      primary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      text: '#1F2937',
      muted: '#6B7280'
    },
    QUALITY: { scale: 2, dpi: 300 }
  },
  CHARTS: {
    COLORS: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    DIMENSIONS: { width: 400, height: 300 }
  },
  TEMPLATES: {
    EXECUTIVE: 'executive',
    TECHNICAL: 'technical',
    COMPLETE: 'complete'
  }
} as const;

export interface ReportData {
  sessionId: string;
  websiteUrl: string;
  websiteDomain: string;
  websiteTitle: string;
  analysisDate: Date;
  overallScore: number;
  moduleResults: ModuleResult[];
  summary: ReportSummary;
  recommendations: PriorityRecommendation[];
  charts: ChartData[];
}

export interface ModuleResult {
  module: string;
  score: number;
  status: 'completed' | 'failed' | 'skipped';
  metrics: Record<string, any>;
  issues: Issue[];
  recommendations: string[];
}

export interface ReportSummary {
  totalIssues: number;
  criticalIssues: number;
  improvementPotential: number;
  timeToFix: string;
  priorityActions: string[];
}

export interface PriorityRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeToImplement: string;
}

export interface Issue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  solution: string;
  module: string;
}

export interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'radar';
  title: string;
  data: any[];
  labels: string[];
  colors: string[];
}

class ReportService {
  // Générer un rapport complet à partir d'une session
  async generateReport(sessionId: string, userId: string): Promise<ReportData> {
    console.log('📊 Génération rapport pour session:', sessionId);

    try {
      // Récupérer la session et les résultats
      const session = await this.getSessionWithResults(sessionId, userId);
      if (!session) {
        throw new Error('Session non trouvée');
      }

      // Récupérer tous les résultats des modules
      const moduleResults = await this.getModuleResults(sessionId, userId);
      
      // Calculer le résumé
      const summary = this.calculateSummary(moduleResults);
      
      // Générer les recommandations prioritaires
      const recommendations = this.generatePriorityRecommendations(moduleResults);
      
      // Créer les données de graphiques
      const charts = this.generateChartData(moduleResults);

      const reportData: ReportData = {
        sessionId,
        websiteUrl: session.websites?.url || '',
        websiteDomain: session.websites?.domain || '',
        websiteTitle: session.websites?.title || '',
        analysisDate: new Date(session.started_at),
        overallScore: session.overall_score || 0,
        moduleResults,
        summary,
        recommendations,
        charts
      };

      console.log('✅ Rapport généré avec succès');
      return reportData;

    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      throw error;
    }
  }

  // Exporter en PDF avec template personnalisé
  async exportToPDF(
    reportData: ReportData, 
    template: 'executive' | 'technical' | 'complete' = 'complete'
  ): Promise<Blob> {
    console.log('📄 Export PDF avec template:', template);

    try {
      const pdf = new jsPDF(REPORT_CONFIG.PDF.ORIENTATION, 'mm', REPORT_CONFIG.PDF.FORMAT);
      
      // Page de couverture
      this.addCoverPage(pdf, reportData);
      
      // Résumé exécutif
      this.addExecutiveSummary(pdf, reportData);
      
      if (template === 'complete' || template === 'technical') {
        // Détails techniques par module
        this.addModuleDetails(pdf, reportData);
        
        // Graphiques et métriques
        this.addChartsAndMetrics(pdf, reportData);
      }
      
      // Recommandations prioritaires
      this.addRecommendations(pdf, reportData);
      
      // Annexes
      if (template === 'complete') {
        this.addAppendices(pdf, reportData);
      }

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      throw error;
    }
  }

  // Récupérer la session avec tous les résultats
  private async getSessionWithResults(sessionId: string, userId: string): Promise<any> {
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
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Récupérer les résultats de tous les modules
  private async getModuleResults(sessionId: string, userId: string): Promise<ModuleResult[]> {
    const results: ModuleResult[] = [];

    // Récupérer les analyses de la session
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;

    for (const analysis of analyses || []) {
      const moduleResult = await this.getModuleResult(analysis);
      if (moduleResult) {
        results.push(moduleResult);
      }
    }

    return results;
  }

  // Récupérer le résultat d'un module spécifique
  private async getModuleResult(analysis: any): Promise<ModuleResult | null> {
    const { analysis_type, id: analysisId, website_id } = analysis;

    try {
      let metrics = {};
      let issues: Issue[] = [];
      let recommendations: string[] = [];
      let score = 0;

      switch (analysis_type) {
        case 'seo':
          const seoData = await this.getSEOResults(analysisId);
          if (seoData) {
            score = seoData.score || 0;
            metrics = {
              titleLength: seoData.title_length,
              metaDescLength: seoData.meta_description_length,
              wordCount: seoData.word_count,
              imagesWithoutAlt: seoData.images_without_alt,
              internalLinks: seoData.internal_links,
              externalLinks: seoData.external_links
            };
            issues = seoData.issues || [];
            recommendations = seoData.recommendations || [];
          }
          break;

        case 'performance':
          const perfData = await this.getPerformanceResults(analysisId);
          if (perfData) {
            score = perfData.desktop_score || 0;
            metrics = {
              loadTime: perfData.load_time,
              contentSize: perfData.content_size,
              resourceCount: perfData.resource_count,
              compressionEnabled: perfData.compression_enabled,
              cacheHeaders: perfData.cache_headers,
              coreWebVitals: perfData.core_web_vitals
            };
            recommendations = ['Optimiser les images', 'Activer la compression', 'Configurer le cache'];
          }
          break;

        case 'security':
          const secData = await this.getSecurityResults(analysisId);
          if (secData) {
            score = secData.security_score || 0;
            metrics = {
              httpsEnabled: secData.https_enabled,
              sslValid: secData.ssl_certificate_valid,
              securityHeaders: secData.security_headers,
              vulnerabilities: secData.vulnerabilities,
              mixedContent: secData.mixed_content
            };
            recommendations = secData.recommendations || [];
          }
          break;

        case 'forms':
          const formData = await this.getFormResults(analysisId);
          if (formData) {
            score = formData.accessibility_score || 0;
            metrics = {
              formsFound: formData.forms_found,
              formsWorking: formData.forms_working,
              hasCaptcha: formData.has_captcha,
              captchaType: formData.captcha_type,
              emailDestinations: formData.email_destinations
            };
            recommendations = formData.recommendations || [];
          }
          break;

        case 'links':
          const linkData = await this.getLinkResults(analysisId);
          if (linkData) {
            score = Math.max(0, 100 - (linkData.broken_links * 5));
            metrics = {
              totalLinks: linkData.total_links,
              brokenLinks: linkData.broken_links,
              redirectLinks: linkData.redirect_links,
              internalLinks: linkData.internal_links,
              externalLinks: linkData.external_links
            };
            recommendations = linkData.recommendations || [];
          }
          break;

        case 'accessibility':
          const a11yData = await this.getAccessibilityResults(analysisId);
          if (a11yData) {
            score = a11yData.accessibility_score || 0;
            metrics = {
              wcagLevel: a11yData.wcag_level,
              criticalIssues: a11yData.issues_critical,
              majorIssues: a11yData.issues_major,
              minorIssues: a11yData.issues_minor,
              altTextCoverage: a11yData.alt_text_coverage,
              formLabelsCoverage: a11yData.form_labels_coverage
            };
            recommendations = a11yData.recommendations || [];
          }
          break;
      }

      return {
        module: analysis_type,
        score,
        status: analysis.status === 'completed' ? 'completed' : 'failed',
        metrics,
        issues,
        recommendations
      };

    } catch (error) {
      console.error(`Erreur récupération résultats ${analysis_type}:`, error);
      return {
        module: analysis_type,
        score: 0,
        status: 'failed',
        metrics: {},
        issues: [],
        recommendations: []
      };
    }
  }

  // Méthodes pour récupérer les résultats par module
  private async getSEOResults(analysisId: string) {
    const { data } = await supabase
      .from('seo_results')
      .select('*')
      .eq('analysis_id', analysisId)
      .single();
    return data;
  }

  private async getPerformanceResults(analysisId: string) {
    const { data } = await supabase
      .from('performance_results')
      .select('*')
      .eq('analysis_id', analysisId)
      .single();
    return data;
  }

  private async getSecurityResults(analysisId: string) {
    const { data } = await supabase
      .from('security_results')
      .select('*')
      .eq('analysis_id', analysisId)
      .single();
    return data;
  }

  private async getFormResults(analysisId: string) {
    const { data } = await supabase
      .from('form_results')
      .select('*')
      .eq('analysis_id', analysisId)
      .single();
    return data;
  }

  private async getLinkResults(analysisId: string) {
    const { data } = await supabase
      .from('link_results')
      .select('*')
      .eq('analysis_id', analysisId)
      .single();
    return data;
  }

  private async getAccessibilityResults(analysisId: string) {
    const { data } = await supabase
      .from('accessibility_results')
      .select('*')
      .eq('analysis_id', analysisId)
      .single();
    return data;
  }

  // Calculer le résumé du rapport
  private calculateSummary(moduleResults: ModuleResult[]): ReportSummary {
    const totalIssues = moduleResults.reduce((sum, module) => sum + module.issues.length, 0);
    const criticalIssues = moduleResults.reduce((sum, module) => 
      sum + module.issues.filter(issue => issue.severity === 'critical').length, 0
    );

    const averageScore = moduleResults.length > 0 
      ? Math.round(moduleResults.reduce((sum, module) => sum + module.score, 0) / moduleResults.length)
      : 0;

    const improvementPotential = Math.max(0, 100 - averageScore);

    return {
      totalIssues,
      criticalIssues,
      improvementPotential,
      timeToFix: this.estimateTimeToFix(totalIssues, criticalIssues),
      priorityActions: this.getPriorityActions(moduleResults)
    };
  }

  // Générer les recommandations prioritaires
  private generatePriorityRecommendations(moduleResults: ModuleResult[]): PriorityRecommendation[] {
    const recommendations: PriorityRecommendation[] = [];

    moduleResults.forEach(module => {
      // Recommandations critiques
      const criticalIssues = module.issues.filter(issue => issue.severity === 'critical');
      criticalIssues.forEach(issue => {
        recommendations.push({
          priority: 'high',
          category: module.module,
          title: issue.title,
          description: issue.description,
          impact: 'Critique pour le SEO et l\'expérience utilisateur',
          effort: 'medium',
          timeToImplement: '1-2 jours'
        });
      });

      // Recommandations par score
      if (module.score < 70) {
        recommendations.push({
          priority: 'high',
          category: module.module,
          title: `Améliorer le score ${module.module}`,
          description: `Score actuel: ${module.score}/100`,
          impact: 'Amélioration significative du référencement',
          effort: 'high',
          timeToImplement: '1-2 semaines'
        });
      }
    });

    return recommendations.slice(0, 10); // Top 10 recommandations
  }

  // Générer les données de graphiques
  private generateChartData(moduleResults: ModuleResult[]): ChartData[] {
    const charts: ChartData[] = [];

    // Graphique des scores par module
    charts.push({
      type: 'bar',
      title: 'Scores par Module',
      data: moduleResults.map(module => module.score),
      labels: moduleResults.map(module => module.module.toUpperCase()),
      colors: REPORT_CONFIG.CHARTS.COLORS
    });

    // Graphique des issues par sévérité
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    moduleResults.forEach(module => {
      module.issues.forEach(issue => {
        severityCounts[issue.severity]++;
      });
    });

    charts.push({
      type: 'pie',
      title: 'Répartition des Problèmes',
      data: Object.values(severityCounts),
      labels: ['Critique', 'Élevé', 'Moyen', 'Faible'],
      colors: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981']
    });

    return charts;
  }

  // Méthodes PDF privées
  private addCoverPage(pdf: jsPDF, reportData: ReportData) {
    const { PDF } = REPORT_CONFIG;
    
    pdf.setFontSize(PDF.FONT_SIZES.title);
    pdf.setTextColor(PDF.COLORS.primary);
    pdf.text('Rapport d\'Analyse WordPress', 105, 50, { align: 'center' });
    
    pdf.setFontSize(PDF.FONT_SIZES.subtitle);
    pdf.setTextColor(PDF.COLORS.text);
    pdf.text(reportData.websiteDomain, 105, 70, { align: 'center' });
    
    pdf.setFontSize(PDF.FONT_SIZES.body);
    pdf.text(`Score Global: ${reportData.overallScore}/100`, 105, 90, { align: 'center' });
    pdf.text(`Date: ${reportData.analysisDate.toLocaleDateString('fr-FR')}`, 105, 110, { align: 'center' });
  }

  private addExecutiveSummary(pdf: jsPDF, reportData: ReportData) {
    pdf.addPage();
    pdf.setFontSize(REPORT_CONFIG.PDF.FONT_SIZES.subtitle);
    pdf.text('Résumé Exécutif', 20, 30);
    
    pdf.setFontSize(REPORT_CONFIG.PDF.FONT_SIZES.body);
    let y = 50;
    
    pdf.text(`Score Global: ${reportData.overallScore}/100`, 20, y);
    y += 10;
    pdf.text(`Problèmes Totaux: ${reportData.summary.totalIssues}`, 20, y);
    y += 10;
    pdf.text(`Problèmes Critiques: ${reportData.summary.criticalIssues}`, 20, y);
    y += 10;
    pdf.text(`Potentiel d'Amélioration: ${reportData.summary.improvementPotential}%`, 20, y);
  }

  private addModuleDetails(pdf: jsPDF, reportData: ReportData) {
    reportData.moduleResults.forEach(module => {
      pdf.addPage();
      pdf.setFontSize(REPORT_CONFIG.PDF.FONT_SIZES.subtitle);
      pdf.text(`Module ${module.module.toUpperCase()}`, 20, 30);
      
      pdf.setFontSize(REPORT_CONFIG.PDF.FONT_SIZES.body);
      pdf.text(`Score: ${module.score}/100`, 20, 50);
      pdf.text(`Statut: ${module.status}`, 20, 65);
      
      // Ajouter les métriques
      let y = 85;
      Object.entries(module.metrics).forEach(([key, value]) => {
        pdf.text(`${key}: ${value}`, 20, y);
        y += 10;
      });
    });
  }

  private addChartsAndMetrics(pdf: jsPDF, reportData: ReportData) {
    pdf.addPage();
    pdf.setFontSize(REPORT_CONFIG.PDF.FONT_SIZES.subtitle);
    pdf.text('Graphiques et Métriques', 20, 30);
    
    // Ici on pourrait ajouter des graphiques générés
    // Pour l'instant, on ajoute les données textuelles
  }

  private addRecommendations(pdf: jsPDF, reportData: ReportData) {
    pdf.addPage();
    pdf.setFontSize(REPORT_CONFIG.PDF.FONT_SIZES.subtitle);
    pdf.text('Recommandations Prioritaires', 20, 30);
    
    let y = 50;
    reportData.recommendations.slice(0, 10).forEach((rec, index) => {
      pdf.setFontSize(REPORT_CONFIG.PDF.FONT_SIZES.body);
      pdf.text(`${index + 1}. ${rec.title}`, 20, y);
      y += 8;
      pdf.setFontSize(REPORT_CONFIG.PDF.FONT_SIZES.caption);
      pdf.text(rec.description, 25, y);
      y += 12;
    });
  }

  private addAppendices(pdf: jsPDF, reportData: ReportData) {
    pdf.addPage();
    pdf.setFontSize(REPORT_CONFIG.PDF.FONT_SIZES.subtitle);
    pdf.text('Annexes Techniques', 20, 30);
    
    // Ajouter les détails techniques complets
  }

  // Méthodes utilitaires
  private estimateTimeToFix(totalIssues: number, criticalIssues: number): string {
    const days = Math.ceil((criticalIssues * 2 + totalIssues * 0.5) / 8); // 8h par jour
    if (days <= 1) return '1 jour';
    if (days <= 7) return `${days} jours`;
    return `${Math.ceil(days / 7)} semaines`;
  }

  private getPriorityActions(moduleResults: ModuleResult[]): string[] {
    const actions: string[] = [];
    
    moduleResults.forEach(module => {
      if (module.score < 50) {
        actions.push(`Améliorer urgence le module ${module.module}`);
      }
      
      const criticalIssues = module.issues.filter(issue => issue.severity === 'critical');
      if (criticalIssues.length > 0) {
        actions.push(`Corriger ${criticalIssues.length} problème(s) critique(s) en ${module.module}`);
      }
    });

    return actions.slice(0, 5);
  }
}

export const reportService = new ReportService();