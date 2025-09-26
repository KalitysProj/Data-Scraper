import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { seoService, SEOAnalysisDetailed, SEOIssue } from '../../services/seoService';
import { websiteService } from '../../services/websiteService';
import { realAnalysisService } from '../../services/realAnalysisService';
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Globe,
  Smartphone,
  Share2,
  Zap,
  Eye,
  BarChart3,
  Target,
  Award,
  Clock,
  Users,
  Link as LinkIcon
} from 'lucide-react';

// Configuration centralisée pour optimiser la maintenance
const SEO_UI_CONFIG = {
  TABS: [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'technical', label: 'SEO Technique', icon: Search },
    { id: 'content', label: 'Contenu', icon: Target },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    { id: 'social', label: 'Social', icon: Share2 }
  ],
  SEVERITY_COLORS: {
    critical: 'text-red-600 bg-red-100 border-red-200',
    warning: 'text-orange-600 bg-orange-100 border-orange-200',
    info: 'text-blue-600 bg-blue-100 border-blue-200'
  },
  SCORE_COLORS: {
    excellent: { threshold: 90, color: 'text-green-600', bg: 'bg-green-500' },
    good: { threshold: 70, color: 'text-orange-600', bg: 'bg-orange-500' },
    poor: { threshold: 0, color: 'text-red-600', bg: 'bg-red-500' }
  }
} as const;

const SEOAnalysisPage: React.FC = () => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [analysis, setAnalysis] = useState<SEOAnalysisDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'content' | 'performance' | 'mobile' | 'social'>('overview');

  useEffect(() => {
    if (user && websiteId) {
      performSEOAnalysis();
    }
  }, [user, websiteId]);

  const performSEOAnalysis = async () => {
    try {
      setLoading(true);
      setError('');

      // Récupérer le site web
      const websites = await websiteService.getUserWebsites(user!.uid);
      const website = websites.find(w => w.id === websiteId);
      
      if (!website) {
        throw new Error('Site web non trouvé');
      }

      // Effectuer l'analyse réelle
      const realData = await realAnalysisService.analyzeWebsite(website.url);
      
      // Créer une analyse en base
      const analysisRecord = await websiteService.createAnalysis(
        websiteId!,
        user!.uid,
        'seo'
      );

      // Générer l'analyse SEO détaillée
      const seoAnalysis = await seoService.analyzeSEODetailed(
        websiteId!,
        analysisRecord.id,
        realData,
        user!.uid
      );

      setAnalysis(seoAnalysis);

    } catch (error) {
      console.error('Erreur analyse SEO:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'analyse SEO');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires optimisées
  const getSeverityColor = (type: string) => 
    SEO_UI_CONFIG.SEVERITY_COLORS[type as keyof typeof SEO_UI_CONFIG.SEVERITY_COLORS] || 'text-gray-600 bg-gray-100 border-gray-200';

  const getScoreColor = (score: number) => {
    const { excellent, good, poor } = SEO_UI_CONFIG.SCORE_COLORS;
    if (score >= excellent.threshold) return excellent.color;
    if (score >= good.threshold) return good.color;
    return poor.color;
  };

  const getScoreBgColor = (score: number) => {
    const { excellent, good, poor } = SEO_UI_CONFIG.SCORE_COLORS;
    if (score >= excellent.threshold) return excellent.bg;
    if (score >= good.threshold) return good.bg;
    return poor.bg;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyse SEO en cours...</h2>
          <p className="text-gray-600">Analyse approfondie de votre site web</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur d'analyse</h2>
          <p className="text-gray-600 mb-4">{error || 'Impossible de charger l\'analyse SEO'}</p>
          <button
            onClick={() => navigate('/discovery')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à la découverte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/discovery')}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Analyse SEO Détaillée
                </h1>
                <p className="text-gray-600">
                  Rapport complet • {new Date(analysis.analyzedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.score)} mb-2`}>
                  {analysis.score}/100
                </div>
                <div className="w-24 h-24 relative">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${analysis.score * 2.51} 251`}
                      className={getScoreColor(analysis.score)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Award className={`w-8 h-8 ${getScoreColor(analysis.score)}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {SEO_UI_CONFIG.TABS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Score SEO</p>
                        <p className="text-3xl font-bold text-blue-900">{analysis.score}/100</p>
                      </div>
                      <Search className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Mots-clés</p>
                        <p className="text-3xl font-bold text-green-900">{analysis.contentAnalysis.keywordDensity.length}</p>
                      </div>
                      <Target className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-medium">Issues</p>
                        <p className="text-3xl font-bold text-orange-900">{analysis.issues.length}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Backlinks</p>
                        <p className="text-3xl font-bold text-purple-900">{analysis.linkProfile.backlinks.estimated}</p>
                      </div>
                      <LinkIcon className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Critical Issues */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Issues Critiques ({analysis.issues.filter(i => i.type === 'critical').length})
                  </h3>
                  <div className="space-y-3">
                    {analysis.issues.filter(i => i.type === 'critical').slice(0, 3).map((issue) => (
                      <div key={issue.id} className="flex items-start space-x-3">
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-red-900">{issue.title}</h4>
                          <p className="text-red-700 text-sm">{issue.description}</p>
                          <p className="text-red-600 text-sm mt-1">
                            <strong>Solution:</strong> {issue.solution}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Recommendations */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Recommandations Prioritaires
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.recommendations.slice(0, 6).map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-800 text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Technical SEO Tab */}
            {activeTab === 'technical' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">SEO Technique</h3>
                
                {/* Title Tag */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Balise Title</h4>
                    {analysis.technicalSEO.titleTag.present ? (
                      analysis.technicalSEO.titleTag.optimal ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      )
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Présente:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.titleTag.present ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.technicalSEO.titleTag.present ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Longueur:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.titleTag.optimal ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.technicalSEO.titleTag.length} caractères
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Optimal:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.titleTag.optimal ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.technicalSEO.titleTag.optimal ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta Description */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Meta Description</h4>
                    {analysis.technicalSEO.metaDescription.present ? (
                      analysis.technicalSEO.metaDescription.optimal ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      )
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Présente:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.metaDescription.present ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.technicalSEO.metaDescription.present ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Longueur:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.metaDescription.optimal ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.technicalSEO.metaDescription.length} caractères
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Optimal:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.metaDescription.optimal ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.technicalSEO.metaDescription.optimal ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Heading Structure */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Structure des Titres</h4>
                    {analysis.technicalSEO.headingStructure.h1Optimal ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Balises H1:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.headingStructure.h1Optimal ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.technicalSEO.headingStructure.h1Count}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Structure optimale:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.headingStructure.h1Optimal ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.technicalSEO.headingStructure.h1Optimal ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>
                  {analysis.technicalSEO.headingStructure.hierarchyIssues.length > 0 && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                      <h5 className="text-sm font-medium text-orange-800 mb-2">Problèmes détectés:</h5>
                      <ul className="text-sm text-orange-700 space-y-1">
                        {analysis.technicalSEO.headingStructure.hierarchyIssues.map((issue, index) => (
                          <li key={index}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* SSL & Security */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">SSL & Sécurité</h4>
                    {analysis.technicalSEO.ssl.enabled ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">HTTPS:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.ssl.enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.technicalSEO.ssl.enabled ? 'Activé' : 'Désactivé'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Certificat valide:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.ssl.validCertificate ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.technicalSEO.ssl.validCertificate ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Contenu mixte:</span>
                      <span className={`ml-2 ${!analysis.technicalSEO.ssl.mixedContent ? 'text-green-600' : 'text-orange-600'}`}>
                        {!analysis.technicalSEO.ssl.mixedContent ? 'Aucun' : 'Détecté'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Structured Data */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Données Structurées</h4>
                    {analysis.technicalSEO.structuredData.present ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="text-gray-600">Présentes:</span>
                      <span className={`ml-2 ${analysis.technicalSEO.structuredData.present ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.technicalSEO.structuredData.present ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    {analysis.technicalSEO.structuredData.types.length > 0 && (
                      <div>
                        <span className="text-gray-600">Types détectés:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {analysis.technicalSEO.structuredData.types.map((type, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Analyse du Contenu</h3>
                
                {/* Content Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Nombre de mots</p>
                        <p className="text-2xl font-bold text-blue-900">{analysis.contentAnalysis.wordCount}</p>
                      </div>
                      <Target className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Score de lisibilité</p>
                        <p className="text-2xl font-bold text-green-900">{analysis.contentAnalysis.readabilityScore}/100</p>
                      </div>
                      <Eye className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Unicité</p>
                        <p className="text-2xl font-bold text-purple-900">{Math.round(analysis.contentAnalysis.contentQuality.uniqueness)}%</p>
                      </div>
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Images Analysis */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Analyse des Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{analysis.contentAnalysis.images.total}</p>
                      <p className="text-gray-600">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analysis.contentAnalysis.images.withAlt}</p>
                      <p className="text-gray-600">Avec Alt</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{analysis.contentAnalysis.images.withoutAlt}</p>
                      <p className="text-gray-600">Sans Alt</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{analysis.contentAnalysis.images.oversized}</p>
                      <p className="text-gray-600">Trop lourdes</p>
                    </div>
                  </div>
                </div>

                {/* Keyword Density */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Densité des Mots-clés</h4>
                  <div className="space-y-2">
                    {analysis.contentAnalysis.keywordDensity.slice(0, 10).map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-900 font-medium">{keyword.keyword}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-600 text-sm">{keyword.count} fois</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(keyword.density * 10, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-600 text-sm w-12">{keyword.density.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Internal Linking */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Maillage Interne</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{analysis.contentAnalysis.internalLinking.totalLinks}</p>
                      <p className="text-gray-600">Liens totaux</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analysis.contentAnalysis.internalLinking.uniquePages}</p>
                      <p className="text-gray-600">Pages uniques</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{analysis.contentAnalysis.internalLinking.averagePerPage.toFixed(1)}</p>
                      <p className="text-gray-600">Moyenne/page</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{analysis.contentAnalysis.internalLinking.orphanPages}</p>
                      <p className="text-gray-600">Pages orphelines</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Performance & Vitesse</h3>
                
                {/* Core Web Vitals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2" />
                      Desktop
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Score PageSpeed</span>
                        <span className={`font-bold ${getScoreColor(analysis.pageSpeedInsights.desktop.score)}`}>
                          {analysis.pageSpeedInsights.desktop.score}/100
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">First Contentful Paint</span>
                        <span className="font-medium">{analysis.pageSpeedInsights.desktop.fcp.toFixed(2)}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Largest Contentful Paint</span>
                        <span className="font-medium">{analysis.pageSpeedInsights.desktop.lcp.toFixed(2)}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Cumulative Layout Shift</span>
                        <span className="font-medium">{analysis.pageSpeedInsights.desktop.cls.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Smartphone className="w-5 h-5 mr-2" />
                      Mobile
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Score PageSpeed</span>
                        <span className={`font-bold ${getScoreColor(analysis.pageSpeedInsights.mobile.score)}`}>
                          {analysis.pageSpeedInsights.mobile.score}/100
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">First Contentful Paint</span>
                        <span className="font-medium">{analysis.pageSpeedInsights.mobile.fcp.toFixed(2)}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Largest Contentful Paint</span>
                        <span className="font-medium">{analysis.pageSpeedInsights.mobile.lcp.toFixed(2)}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Cumulative Layout Shift</span>
                        <span className="font-medium">{analysis.pageSpeedInsights.mobile.cls.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Opportunities */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Opportunités d'Amélioration</h4>
                  <div className="space-y-3">
                    {analysis.pageSpeedInsights.opportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          opportunity.impact === 'high' ? 'bg-red-500' :
                          opportunity.impact === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}></div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{opportunity.title}</h5>
                          <p className="text-gray-600 text-sm">{opportunity.description}</p>
                          <p className="text-green-600 text-sm mt-1">
                            Économie potentielle: {opportunity.savings > 1000 ? 
                              `${(opportunity.savings / 1000).toFixed(1)}KB` : 
                              `${opportunity.savings}ms`
                            }
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          opportunity.impact === 'high' ? 'bg-red-100 text-red-800' :
                          opportunity.impact === 'medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {opportunity.impact === 'high' ? 'Élevé' :
                           opportunity.impact === 'medium' ? 'Moyen' : 'Faible'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Tab */}
            {activeTab === 'mobile' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Optimisation Mobile</h3>
                
                {/* Mobile Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Responsive</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {analysis.mobileOptimization.responsive ? 'Oui' : 'Non'}
                        </p>
                      </div>
                      <Smartphone className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Score Mobile</p>
                        <p className="text-2xl font-bold text-green-900">
                          {analysis.mobileOptimization.mobileUsability.score}/100
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Éléments tactiles</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {analysis.mobileOptimization.touchElements.appropriate ? 'OK' : 'Issues'}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Viewport Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Configuration Viewport</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Présent:</span>
                      <span className={`ml-2 ${analysis.mobileOptimization.viewport.present ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.mobileOptimization.viewport.present ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Correct:</span>
                      <span className={`ml-2 ${analysis.mobileOptimization.viewport.correct ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.mobileOptimization.viewport.correct ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div className="md:col-span-1">
                      <span className="text-gray-600">Contenu:</span>
                      <code className="ml-2 text-xs bg-gray-100 px-1 rounded">
                        {analysis.mobileOptimization.viewport.content || 'Non défini'}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Mobile Usability Issues */}
                {analysis.mobileOptimization.mobileUsability.issues.length > 0 && (
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <h4 className="font-medium text-orange-900 mb-3">Problèmes d'Utilisabilité Mobile</h4>
                    <ul className="space-y-2">
                      {analysis.mobileOptimization.mobileUsability.issues.map((issue, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-orange-800 text-sm">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Optimisation Réseaux Sociaux</h3>
                
                {/* Open Graph */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Open Graph (Facebook)</h4>
                    {analysis.socialMedia.openGraph.present ? (
                      analysis.socialMedia.openGraph.complete ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      )
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Présent:</span>
                      <span className={`ml-2 ${analysis.socialMedia.openGraph.present ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.socialMedia.openGraph.present ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Complet:</span>
                      <span className={`ml-2 ${analysis.socialMedia.openGraph.complete ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.socialMedia.openGraph.complete ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>

                  {analysis.socialMedia.openGraph.tags.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Balises détectées:</h5>
                      <div className="space-y-2">
                        {analysis.socialMedia.openGraph.tags.map((tag, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <code className="text-xs text-gray-800">{tag.property}</code>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600 max-w-xs truncate">{tag.content}</span>
                              {tag.optimal ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Twitter Cards */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Twitter Cards</h4>
                    {analysis.socialMedia.twitterCards.present ? (
                      analysis.socialMedia.twitterCards.complete ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      )
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Présent:</span>
                      <span className={`ml-2 ${analysis.socialMedia.twitterCards.present ? 'text-green-600' : 'text-red-600'}`}>
                        {analysis.socialMedia.twitterCards.present ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 text-gray-900">{analysis.socialMedia.twitterCards.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Complet:</span>
                      <span className={`ml-2 ${analysis.socialMedia.twitterCards.complete ? 'text-green-600' : 'text-orange-600'}`}>
                        {analysis.socialMedia.twitterCards.complete ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>

                  {analysis.socialMedia.twitterCards.tags.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Balises détectées:</h5>
                      <div className="space-y-2">
                        {analysis.socialMedia.twitterCards.tags.map((tag, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <code className="text-xs text-gray-800">{tag.name}</code>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600 max-w-xs truncate">{tag.content}</span>
                              {tag.optimal ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All Issues */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Tous les Problèmes ({analysis.issues.length})
          </h3>
          <div className="space-y-4">
            {analysis.issues.map((issue) => (
              <div key={issue.id} className={`border rounded-lg p-4 ${getSeverityColor(issue.type)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{issue.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.type)}`}>
                        {issue.type === 'critical' ? 'Critique' : 
                         issue.type === 'warning' ? 'Attention' : 'Info'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {issue.category}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{issue.description}</p>
                    {issue.element && (
                      <p className="text-xs text-gray-600 mb-1">
                        Élément: <code className="bg-gray-100 px-1 rounded">{issue.element}</code>
                      </p>
                    )}
                    {issue.currentValue && (
                      <p className="text-xs text-gray-600 mb-1">
                        Valeur actuelle: <span className="font-mono">{issue.currentValue}</span>
                      </p>
                    )}
                    {issue.recommendedValue && (
                      <p className="text-xs text-gray-600 mb-2">
                        Valeur recommandée: <span className="font-mono">{issue.recommendedValue}</span>
                      </p>
                    )}
                    <div className="bg-white bg-opacity-50 border border-current border-opacity-20 rounded p-2">
                      <p className="text-sm">
                        <strong>Solution:</strong> {issue.solution}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      issue.impact === 'high' ? 'bg-red-100 text-red-800' :
                      issue.impact === 'medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      Impact {issue.impact === 'high' ? 'élevé' : issue.impact === 'medium' ? 'moyen' : 'faible'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Priorité {issue.priority}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOAnalysisPage;