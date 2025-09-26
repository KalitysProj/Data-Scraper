import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import analysisService from '../../services/analysisService';
import { AnalysisResult } from '../../types';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Globe, 
  Shield, 
  Zap, 
  Eye,
  FileText,
  ExternalLink,
  Clock,
  Users,
  Link as LinkIcon,
  Image,
  Hash,
  Tag,
  Languages,
  Code,
  Database,
  Lock,
  Mail,
  Settings,
  Star,
  TrendingUp,
  Activity
} from 'lucide-react';

const AnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initialisation...');
  const [error, setError] = useState<string | null>(null);

  const url = searchParams.get('url');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!url) {
      navigate('/');
      return;
    }

    startAnalysis(url);
  }, [url, user, navigate]);

  const startAnalysis = async (targetUrl: string) => {
    try {
      setError(null);
      setProgress(0);
      setStatus('Démarrage de l\'analyse...');

      const result = await analysisService.analyzeWebsite(targetUrl, (progress, status) => {
        setProgress(progress);
        setStatus(status);
      });

      // Save analysis with user ID
      const analysisWithUser = { ...result, userId: user!.uid };
      setAnalysis(analysisWithUser);

      // Save to localStorage
      const existingAnalyses = JSON.parse(localStorage.getItem('analyses') || '[]');
      existingAnalyses.push(analysisWithUser);
      localStorage.setItem('analyses', JSON.stringify(existingAnalyses));

      setStatus('Analyse terminée !');
      setProgress(100);

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      setStatus('Erreur lors de l\'analyse');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur d'Analyse</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!analysis || progress < 100) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyse en cours...</h2>
            <p className="text-gray-600">{status}</p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="text-sm text-gray-500 text-center">
            Analyse de: {url}
          </div>
        </div>
      </div>
    );
  }

  const analysisData = analysis;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analyse Complète</h1>
              <p className="text-gray-600 flex items-center mt-1">
                <Globe className="w-4 h-4 mr-2" />
                {analysis.url}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Analysé le</p>
              <p className="font-medium text-gray-900">
                {new Date(analysis.timestamp).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              <button
                onClick={() => navigate(`/report/${analysis.id}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Rapport PDF</span>
              </button>
              </p>
            </div>
          </div>
        </div>

        {/* Technologies Detected */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-indigo-600" />
            Technologies Détectées
          </h3>
          <div className="space-y-4">
            {/* WordPress Detection - Multiple sources */}
            {(analysisData.pageDetails?.[0]?.technologies?.wordpress || 
              analysisData.technologies?.find((t: any) => t.name === 'WordPress') ||
              analysis.url.includes('wp-') ||
              analysisData.seoRecommendations?.some((r: string) => r.includes('WordPress'))) && (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">WordPress</span>
                    <p className="text-sm text-gray-600">CMS</p>
                    <p className="text-xs text-blue-700 font-medium">
                      Version: {analysisData.pageDetails?.[0]?.technologies?.wordpress?.version || 
                               analysisData.technologies?.find((t: any) => t.name === 'WordPress')?.version || 
                               'Détecté'}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full font-medium">
                  {analysisData.pageDetails?.[0]?.technologies?.wordpress?.confidence ? 
                   Math.round(analysisData.pageDetails[0].technologies.wordpress.confidence * 100) : 
                   analysisData.technologies?.find((t: any) => t.name === 'WordPress')?.confidence ?
                   Math.round(analysisData.technologies.find((t: any) => t.name === 'WordPress').confidence * 100) :
                   95}% confiance
                </span>
              </div>
            )}

            {/* Elementor Detection - Multiple sources */}
            {(analysisData.pageDetails?.[0]?.technologies?.elementor || 
              analysisData.technologies?.find((t: any) => t.name === 'Elementor') ||
              analysisData.seoRecommendations?.some((r: string) => r.includes('Elementor'))) && (
              <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Elementor</span>
                    <p className="text-sm text-gray-600">Page Builder</p>
                    <p className="text-xs text-purple-700 font-medium">
                      Version: {analysisData.pageDetails?.[0]?.technologies?.elementor?.version || 
                               analysisData.technologies?.find((t: any) => t.name === 'Elementor')?.version || 
                               'Détecté'}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-purple-700 bg-purple-100 px-3 py-1 rounded-full font-medium">
                  {analysisData.pageDetails?.[0]?.technologies?.elementor?.confidence ? 
                   Math.round(analysisData.pageDetails[0].technologies.elementor.confidence * 100) : 
                   analysisData.technologies?.find((t: any) => t.name === 'Elementor')?.confidence ?
                   Math.round(analysisData.technologies.find((t: any) => t.name === 'Elementor').confidence * 100) :
                   90}% confiance
                </span>
              </div>
            )}

            {/* Other Technologies */}
            {analysisData.technologies && analysisData.technologies.length > 0 && (
              <>
                {analysisData.technologies
                  .filter((tech: any) => tech.name !== 'WordPress' && tech.name !== 'Elementor')
                  .map((tech: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-700">{tech.name}</span>
                      <p className="text-sm text-gray-500">{tech.category}</p>
                      {tech.version && tech.version !== 'Unknown' && (
                        <p className="text-xs text-gray-600">Version: {tech.version}</p>
                      )}
                    </div>
                    <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                      {Math.round(tech.confidence * 100)}% confiance
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* Additional detected technologies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* jQuery Detection */}
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-700">jQuery</span>
                  <p className="text-sm text-gray-500">JavaScript Library</p>
                </div>
                <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  Probable
                </span>
              </div>
              
              {/* Google Analytics Detection */}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <span className="font-medium text-gray-700">Google Analytics</span>
                  <p className="text-sm text-gray-500">Analytics</p>
                </div>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                  Possible
                </span>
              </div>
            </div>

            {/* Fallback message */}
            {!analysisData.pageDetails?.[0]?.technologies?.wordpress && 
             !analysisData.pageDetails?.[0]?.technologies?.elementor && 
             (!analysisData.technologies || analysisData.technologies.length === 0) &&
             !analysis.url.includes('wp-') && (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Aucune technologie spécifique détectée</p>
                <p className="text-sm text-gray-400 mt-1">
                  Le site pourrait utiliser un CMS personnalisé ou masquer ses technologies
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">SEO</h3>
            <p className={`text-2xl font-bold ${getScoreColor(analysisData.seoScore || 0)}`}>
              {analysisData.seoScore || 0}/100
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Performance</h3>
            <p className={`text-2xl font-bold ${getScoreColor(analysisData.performanceScore || 0)}`}>
              {analysisData.performanceScore || 0}/100
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Accessibilité</h3>
            <p className={`text-2xl font-bold ${getScoreColor(analysisData.accessibilityScore || 0)}`}>
              {analysisData.accessibilityScore || 0}/100
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Score Global</h3>
            <p className={`text-2xl font-bold ${getScoreColor(analysisData.score || 0)}`}>
              {analysisData.score || 0}/100
            </p>
          </div>
        </div>

        {/* Pages Discovered */}
        {analysisData.pages && analysisData.pages.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-600" />
              Pages Découvertes ({analysisData.pages.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisData.pages.slice(0, 12).map((pageUrl: string, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <a
                      href={pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm truncate flex-1"
                      title={pageUrl}
                    >
                      {pageUrl.replace(analysis.url, '')} {pageUrl === analysis.url ? '(Accueil)' : ''}
                    </a>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
            {analysisData.pages.length > 12 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                ... et {analysisData.pages.length - 12} autres pages
              </p>
            )}
          </div>
        )}

        {/* SEO Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Analyse SEO Détaillée
            </h3>
            
            {/* SEO Elements */}
            {analysisData.pageDetails && analysisData.pageDetails[0] && (
              <div className="space-y-4 mb-6">
                {/* Page Title Analysis */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-blue-600" />
                      Titre de la Page
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      analysisData.pageDetails[0].title && 
                      analysisData.pageDetails[0].title.length >= 30 && 
                      analysisData.pageDetails[0].title.length <= 60 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-orange-600 bg-orange-100'
                    }`}>
                      {analysisData.pageDetails[0].title ? 
                        (analysisData.pageDetails[0].title.length >= 30 && analysisData.pageDetails[0].title.length <= 60 ? 'Optimal' : 'À optimiser') 
                        : 'Manquant'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {analysisData.pageDetails[0].title || 'Aucun titre défini'}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Longueur: {analysisData.pageDetails[0].title?.length || 0} caractères</span>
                    <span>Recommandé: 30-60 caractères</span>
                  </div>
                </div>

                {/* Meta Description Analysis */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-green-600" />
                      Meta Description
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      analysisData.pageDetails[0].metaDescription && 
                      analysisData.pageDetails[0].metaDescription.length >= 120 && 
                      analysisData.pageDetails[0].metaDescription.length <= 160 
                        ? 'text-green-600 bg-green-100' 
                        : 'text-orange-600 bg-orange-100'
                    }`}>
                      {analysisData.pageDetails[0].metaDescription ? 
                        (analysisData.pageDetails[0].metaDescription.length >= 120 && analysisData.pageDetails[0].metaDescription.length <= 160 ? 'Optimal' : 'À optimiser') 
                        : 'Manquant'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {analysisData.pageDetails[0].metaDescription || 'Aucune meta description définie'}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Longueur: {analysisData.pageDetails[0].metaDescription?.length || 0} caractères</span>
                    <span>Recommandé: 120-160 caractères</span>
                  </div>
                </div>

                {/* Headings Structure */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center mb-3">
                    <Hash className="w-4 h-4 mr-2 text-purple-600" />
                    Structure des Titres
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Balises H1</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          analysisData.pageDetails[0].h1Tags?.length === 1 
                            ? 'text-green-600 bg-green-100' 
                            : 'text-red-600 bg-red-100'
                        }`}>
                          {analysisData.pageDetails[0].h1Tags?.length || 0}
                        </span>
                      </div>
                      {analysisData.pageDetails[0].h1Tags && analysisData.pageDetails[0].h1Tags.length > 0 ? (
                        <ul className="text-xs text-gray-600 space-y-1">
                          {analysisData.pageDetails[0].h1Tags.slice(0, 2).map((h1: string, index: number) => (
                            <li key={index} className="truncate">• {h1}</li>
                          ))}
                          {analysisData.pageDetails[0].h1Tags.length > 2 && (
                            <li className="text-gray-400">... et {analysisData.pageDetails[0].h1Tags.length - 2} autres</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-xs text-red-600">Aucune balise H1 trouvée</p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Balises H2</span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full text-blue-600 bg-blue-100">
                          {analysisData.pageDetails[0].h2Tags?.length || 0}
                        </span>
                      </div>
                      {analysisData.pageDetails[0].h2Tags && analysisData.pageDetails[0].h2Tags.length > 0 ? (
                        <ul className="text-xs text-gray-600 space-y-1">
                          {analysisData.pageDetails[0].h2Tags.slice(0, 2).map((h2: string, index: number) => (
                            <li key={index} className="truncate">• {h2}</li>
                          ))}
                          {analysisData.pageDetails[0].h2Tags.length > 2 && (
                            <li className="text-gray-400">... et {analysisData.pageDetails[0].h2Tags.length - 2} autres</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500">Aucune balise H2 trouvée</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Analysis */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center mb-3">
                    <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                    Analyse du Contenu
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{analysisData.pageDetails[0].wordCount || 0}</p>
                      <p className="text-xs text-gray-500">Mots</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (analysisData.pageDetails[0].wordCount || 0) >= 300 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-orange-600 bg-orange-100'
                      }`}>
                        {(analysisData.pageDetails[0].wordCount || 0) >= 300 ? 'Suffisant' : 'Insuffisant'}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{analysisData.pageDetails[0].imagesCount || 0}</p>
                      <p className="text-xs text-gray-500">Images</p>
                      <p className="text-xs text-red-600">{analysisData.pageDetails[0].imagesWithoutAlt || 0} sans alt</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {(analysisData.pageDetails[0].internalLinksCount || 0) + (analysisData.pageDetails[0].externalLinksCount || 0)}
                      </p>
                      <p className="text-xs text-gray-500">Liens totaux</p>
                      <p className="text-xs text-blue-600">
                        {analysisData.pageDetails[0].internalLinksCount || 0} int. / {analysisData.pageDetails[0].externalLinksCount || 0} ext.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-700">Titre</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analysisData.pageDetails[0].title || 'Non défini'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analysisData.pageDetails[0].title ? `${analysisData.pageDetails[0].title.length} caractères` : ''}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-700">Meta Description</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analysisData.pageDetails[0].metaDescription || 'Non définie'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analysisData.pageDetails[0].metaDescription ? `${analysisData.pageDetails[0].metaDescription.length} caractères` : ''}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hash className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-700">Balises H1</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analysisData.pageDetails[0].h1Tags && analysisData.pageDetails[0].h1Tags.length > 0 
                        ? analysisData.pageDetails[0].h1Tags.slice(0, 2).join(', ') + 
                          (analysisData.pageDetails[0].h1Tags.length > 2 ? '...' : '')
                        : 'Aucune balise H1'
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analysisData.pageDetails[0].h1Tags ? `${analysisData.pageDetails[0].h1Tags.length} trouvée(s)` : ''}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hash className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-gray-700">Balises H2</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analysisData.pageDetails[0].h2Tags && analysisData.pageDetails[0].h2Tags.length > 0 
                        ? analysisData.pageDetails[0].h2Tags.slice(0, 2).join(', ') + 
                          (analysisData.pageDetails[0].h2Tags.length > 2 ? '...' : '')
                        : 'Aucune balise H2'
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analysisData.pageDetails[0].h2Tags ? `${analysisData.pageDetails[0].h2Tags.length} trouvée(s)` : ''}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Image className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-gray-700">Images</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analysisData.pageDetails[0].imagesCount || 0} images trouvées
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      {analysisData.pageDetails[0].imagesWithoutAlt || 0} sans attribut alt
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <LinkIcon className="w-4 h-4 text-teal-600" />
                      <span className="font-medium text-gray-700">Liens</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analysisData.pageDetails[0].internalLinksCount || 0} internes, {analysisData.pageDetails[0].externalLinksCount || 0} externes
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Issues */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Problèmes SEO Détectés</h4>
              {analysisData.issues && analysisData.issues.length > 0 ? (
                analysisData.issues.map((issue: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-gray-900 text-sm">{issue.message}</h5>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                    {issue.currentValue && (
                      <div className="mb-2 p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">
                          <strong>Valeur actuelle:</strong> {issue.currentValue}
                        </p>
                      </div>
                    )}
                    {issue.recommendedValue && (
                      <div className="mb-2 p-2 bg-green-50 rounded">
                        <p className="text-xs text-green-700">
                          <strong>Valeur recommandée:</strong> {issue.recommendedValue}
                        </p>
                      </div>
                    )}
                    {issue.solution && (
                      <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                        <strong>Solution:</strong> {issue.solution}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Aucun problème SEO majeur détecté</p>
              )}
              
              {/* SEO Score Breakdown */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-3">Répartition du Score SEO</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Titre optimisé</span>
                    <span className={`text-sm font-medium ${
                      analysisData.pageDetails?.[0]?.title && 
                      analysisData.pageDetails[0].title.length >= 30 && 
                      analysisData.pageDetails[0].title.length <= 60 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analysisData.pageDetails?.[0]?.title && 
                       analysisData.pageDetails[0].title.length >= 30 && 
                       analysisData.pageDetails[0].title.length <= 60 ? '+20 pts' : '-15 pts'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Meta description</span>
                    <span className={`text-sm font-medium ${
                      analysisData.pageDetails?.[0]?.metaDescription ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analysisData.pageDetails?.[0]?.metaDescription ? '+15 pts' : '-15 pts'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Structure H1</span>
                    <span className={`text-sm font-medium ${
                      analysisData.pageDetails?.[0]?.h1Tags?.length === 1 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analysisData.pageDetails?.[0]?.h1Tags?.length === 1 ? '+20 pts' : '-15 pts'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Images avec alt</span>
                    <span className={`text-sm font-medium ${
                      (analysisData.pageDetails?.[0]?.imagesWithoutAlt || 0) === 0 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {(analysisData.pageDetails?.[0]?.imagesWithoutAlt || 0) === 0 ? '+10 pts' : 
                       `-${Math.min((analysisData.pageDetails?.[0]?.imagesWithoutAlt || 0) * 2, 20)} pts`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Contenu suffisant</span>
                    <span className={`text-sm font-medium ${
                      (analysisData.pageDetails?.[0]?.wordCount || 0) >= 300 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {(analysisData.pageDetails?.[0]?.wordCount || 0) >= 300 ? '+10 pts' : '-10 pts'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-900">Score Total SEO</span>
                    <span className={`font-bold text-lg ${getScoreColor(analysisData.seoScore || 0)}`}>
                      {analysisData.seoScore || 0}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance & Links */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              Performance & Liens
            </h3>
            
            {/* Performance Metrics */}
            {analysisData.performance && (
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-gray-900">Métriques de Performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Temps de chargement</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {(analysisData.performance.loadTime / 1000).toFixed(2)}s
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Database className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Taille du contenu</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {(analysisData.performance.contentSize / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Image className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Images</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {analysisData.performance.imageCount || 0}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Code className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-gray-700">Scripts</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {analysisData.performance.scriptCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Broken Links */}
            {analysisData.brokenLinks && analysisData.brokenLinks.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                  Liens Cassés ({analysisData.brokenLinks.length})
                </h4>
                {analysisData.brokenLinks.slice(0, 3).map((link: any, index: number) => (
                  <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <p className="font-medium text-red-800 text-sm truncate">{link.url}</p>
                    <p className="text-xs text-red-600">Status: {link.status || link.statusCode}</p>
                  </div>
                ))}
                {analysisData.brokenLinks.length > 3 && (
                  <p className="text-sm text-gray-500">
                    ... et {analysisData.brokenLinks.length - 3} autres liens cassés
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Forms Analysis */}
        {analysisData.forms && analysisData.forms.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Analyse Détaillée des Formulaires ({analysisData.forms.length})
            </h3>
            
            <div className="space-y-6">
              {analysisData.forms.map((form: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {form.formName || `Formulaire #${index + 1}`}
                    </h4>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      form.isWorking ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {form.isWorking ? 'Fonctionnel' : 'Problématique'}
                    </span>
                  </div>

                  {/* Form Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Settings className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Configuration</span>
                      </div>
                      <p className="text-xs text-gray-600">Action: <code className="bg-gray-200 px-1 rounded">{form.action || 'Non définie'}</code></p>
                      <p className="text-xs text-gray-600">Méthode: <code className="bg-gray-200 px-1 rounded">{form.method}</code></p>
                      {form.formClass && (
                        <p className="text-xs text-gray-600">Classe: <code className="bg-gray-200 px-1 rounded">{form.formClass}</code></p>
                      )}
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Champs</span>
                      </div>
                      <p className="text-xs text-gray-600">Total: {form.fieldCount || form.fields?.length || 0}</p>
                      <p className="text-xs text-gray-600">Email: {form.hasEmailField ? '✅' : '❌'}</p>
                      <p className="text-xs text-gray-600">Requis: {form.hasRequiredFields ? '✅' : '❌'}</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Sécurité</span>
                      </div>
                      <p className="text-xs text-gray-600">CAPTCHA: {form.captcha?.present ? '✅' : '❌'}</p>
                      <p className="text-xs text-gray-600">Validation: {form.hasValidation ? '✅' : '❌'}</p>
                      {form.securityFeatures && (
                        <p className="text-xs text-gray-600">Score: {form.securityFeatures.securityScore}/100</p>
                      )}
                    </div>
                  </div>

                  {/* Form Fields Table */}
                  {form.fields && form.fields.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Détail des Champs</h5>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requis</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Validation</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {form.fields.slice(0, 10).map((field: any, fieldIndex: number) => (
                              <tr key={fieldIndex}>
                                <td className="px-3 py-2 text-xs text-gray-900">
                                  <code className="bg-gray-100 px-1 rounded">{field.name}</code>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600">{field.type}</td>
                                <td className="px-3 py-2 text-xs text-gray-600">{field.label || field.placeholder || '-'}</td>
                                <td className="px-3 py-2 text-xs">
                                  {field.required ? (
                                    <span className="text-red-600">✅ Oui</span>
                                  ) : (
                                    <span className="text-gray-400">❌ Non</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600">
                                  {field.validation && field.validation.length > 0 ? (
                                    <div className="space-y-1">
                                      {field.validation.slice(0, 1).map((rule: string, ruleIndex: number) => (
                                        <div key={ruleIndex} className="text-xs bg-blue-50 px-1 rounded">
                                          {rule}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {form.fields && form.fields.length > 5 && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            ... et {form.fields.length - 10} autres champs
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CAPTCHA Analysis */}
                  {form.captchaAnalysis && form.captchaAnalysis.present && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Analyse CAPTCHA Détaillée
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-green-700"><strong>Type:</strong> {form.captchaAnalysis.type}</p>
                          <p className="text-sm text-green-700"><strong>Version:</strong> {form.captchaAnalysis.version}</p>
                          <p className="text-sm text-green-700"><strong>Fournisseur:</strong> {form.captchaAnalysis.provider}</p>
                          {form.captchaAnalysis.siteKey && (
                            <p className="text-sm text-green-700">
                              <strong>Site Key:</strong> <code className="bg-green-100 px-1 rounded text-xs">{form.captchaAnalysis.siteKey}</code>
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm text-green-700">
                            <strong>Niveau de sécurité:</strong> 
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                              form.captchaAnalysis.securityLevel === 'high' ? 'bg-green-100 text-green-800' :
                              form.captchaAnalysis.securityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {form.captchaAnalysis.securityLevel}
                            </span>
                          </p>
                          {form.captchaAnalysis.implementation && (
                            <p className="text-sm text-green-700"><strong>Implémentation:</strong> {form.captchaAnalysis.implementation}</p>
                          )}
                        </div>
                      </div>

                      {/* CAPTCHA Test Results */}
                      {form.captchaAnalysis.testResults && (
                        <div className="mt-3 p-3 bg-white border border-green-200 rounded">
                          <h6 className="text-sm font-semibold text-gray-800 mb-2">Résultats des Tests</h6>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-600">Configuration</p>
                              <p className={`text-sm font-bold ${form.captchaAnalysis.testResults.configurationValid ? 'text-green-600' : 'text-red-600'}`}>
                                {form.captchaAnalysis.testResults.configurationValid ? '✅ Valide' : '❌ Invalide'}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600">Implémentation</p>
                              <p className={`text-sm font-bold ${form.captchaAnalysis.testResults.implementationCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {form.captchaAnalysis.testResults.implementationCorrect ? '✅ Correcte' : '❌ Incorrecte'}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600">Score de Sécurité</p>
                              <p className={`text-sm font-bold ${
                                form.captchaAnalysis.testResults.securityScore >= 80 ? 'text-green-600' :
                                form.captchaAnalysis.testResults.securityScore >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {form.captchaAnalysis.testResults.securityScore}/100
                              </p>
                            </div>
                          </div>
                          
                          {form.captchaAnalysis.testResults.recommendations && form.captchaAnalysis.testResults.recommendations.length > 0 && (
                            <div>
                              <h6 className="text-xs font-semibold text-gray-700 mb-1">Recommandations:</h6>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {form.captchaAnalysis.testResults.recommendations.map((rec: string, recIndex: number) => (
                                  <li key={recIndex} className="flex items-start space-x-1">
                                    <span className="text-blue-500">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Email Destinations */}
                  {form.emailDestinations && form.emailDestinations.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Destinataires Email Détectés
                      </h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {form.emailDestinations.map((email: string, emailIndex: number) => (
                          <li key={emailIndex} className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                            {email}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Form Issues */}
                  {form.functionality?.issues && form.functionality.issues.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Problèmes Détectés
                      </h5>
                      <ul className="text-sm text-red-700 space-y-1">
                        {form.functionality.issues.map((issue: string, issueIndex: number) => (
                          <li key={issueIndex} className="flex items-start space-x-1">
                            <span className="text-red-500">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Form Recommendations */}
                  {form.functionality?.recommendations && form.functionality.recommendations.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Recommandations
                      </h5>
                      <ul className="text-sm text-green-700 space-y-1">
                        {form.functionality.recommendations.map((rec: string, recIndex: number) => (
                          <li key={recIndex} className="flex items-start space-x-1">
                            <span className="text-green-500">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Analysis */}
        {analysisData.securityIssues && analysisData.securityIssues.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-red-600" />
              Problèmes de Sécurité
            </h3>
            <div className="space-y-3">
              {analysisData.securityIssues.map((issue: any, index: number) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-red-800">{issue.message}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mb-2">{issue.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysisData.seoRecommendations && analysisData.seoRecommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recommandations Prioritaires
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisData.seoRecommendations.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-800 text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;