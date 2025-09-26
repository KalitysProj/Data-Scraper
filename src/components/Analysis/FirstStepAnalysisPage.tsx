import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { firstStepAnalysisService, FirstStepResult } from '../../services/firstStepAnalysisService';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  Globe,
  Search,
  Shield,
  FileText,
  BarChart3,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

const FirstStepAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const url = searchParams.get('url') || '';
  const [result, setResult] = useState<FirstStepResult | null>(null);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (url && user) {
      performFirstStepAnalysis();
    }
  }, [url, user]);

  const performFirstStepAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      
      const analysisResult = await firstStepAnalysisService.performFirstStepAnalysis(
        url,
        user!.uid,
        (step, progressValue, status) => {
          setCurrentStep(status);
          setProgress(progressValue);
        }
      );
      
      setResult(analysisResult);
      
    } catch (error) {
      console.error('Erreur 1ère étape:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'analyse';
      
      // Messages d'erreur plus explicites pour l'utilisateur
      if (errorMessage.includes('Domaine inaccessible')) {
        setError('Le site web n\'est pas accessible actuellement. Vérifiez que l\'URL est correcte et que le site est en ligne.');
      } else if (errorMessage.includes('proxies ont échoué')) {
        setError('Impossible d\'accéder au site. Il pourrait être protégé par un firewall ou temporairement indisponible.');
      } else if (errorMessage.includes('CORS')) {
        setError('Problème de sécurité réseau. Veuillez réessayer dans quelques instants.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-200 bg-green-50';
      case 'failed': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-orange-600 bg-orange-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Analyse Initiale en Cours
              </h2>
              <p className="text-gray-600 mb-6">{currentStep}</p>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-gray-500">
                {progress}% terminé
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Problème d'Accessibilité</h2>
            
            {/* Message d'erreur formaté */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="whitespace-pre-line text-left text-red-800">
                {error}
              </div>
            </div>
            
            {/* Actions possibles */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={performFirstStepAnalysis}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réessayer l'Analyse</span>
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Essayer une Autre URL</span>
              </button>
            </div>
            
            {/* Conseils supplémentaires */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Conseils pour résoudre le problème :</h3>
              <ul className="text-blue-800 text-sm space-y-1 text-left">
                <li>• Testez d'abord votre site dans un navigateur normal</li>
                <li>• Vérifiez que votre site n'est pas en maintenance</li>
                <li>• Contactez votre hébergeur si le problème persiste</li>
                <li>• Essayez avec ou sans 'www' dans l'URL</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec résumé */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analyse Initiale Terminée
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <span>{new URL(url).hostname}</span>
                <span>•</span>
                <span>{(result.duration / 1000).toFixed(1)}s</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOverallStatusColor(result.status)}`}>
                  {result.status === 'completed' ? 'Succès' : 
                   result.status === 'partial' ? 'Partiel' : 'Échec'}
                </span>
              </div>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Voir le site</span>
            </a>
          </div>
        </div>

        {/* Résumé rapide */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">WordPress</p>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.summary.isWordPress ? 'Détecté' : 'Non détecté'}
                  </p>
                  {result.steps.homepageAnalysis.data?.technologies && (
                    <div className="mt-2">
                      {result.steps.homepageAnalysis.data.technologies
                        .filter((tech: string) => tech.toLowerCase().includes('wordpress'))
                        .map((tech: string, index: number) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                            {tech}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                result.summary.isWordPress ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Search className={`w-6 h-6 ${
                  result.summary.isWordPress ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pages découvertes</p>
                <p className="text-2xl font-bold text-gray-900">{result.summary.pagesDiscovered}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Images trouvées</p>
                <p className="text-2xl font-bold text-gray-900">{result.summary.imagesFound}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiration domaine</p>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{result.summary.domainExpiresIn}j</p>
                  {result.steps.whoisAnalysis.data?.expirationDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(result.steps.whoisAnalysis.data.expirationDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                result.summary.domainExpiresIn < 30 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <Shield className={`w-6 h-6 ${
                  result.summary.domainExpiresIn < 30 ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Détail des étapes */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Détail des Étapes</h2>
          
          <div className="space-y-4">
            {Object.entries(result.steps).map(([key, step]) => (
              <div key={key} className={`border rounded-lg p-4 ${getStepColor(step.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStepIcon(step.status)}
                    <h3 className="font-medium text-gray-900">{step.name}</h3>
                  </div>
                  <span className="text-sm text-gray-500">{step.duration}ms</span>
                </div>
                
                {/* Affichage des données spécifiques par étape */}
                {key === 'domainValidation' && step.data && (
                  <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Validation du Domaine:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Domaine: </span>
                        <span className="font-medium">{step.data.domain || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Protocole: </span>
                        <span className={`font-medium ${step.data.protocol === 'https:' ? 'text-green-600' : 'text-orange-600'}`}>
                          {step.data.protocol ? step.data.protocol.replace(':', '') : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Temps de réponse: </span>
                        <span className="font-medium">{step.data.responseTime || 0}ms</span>
                      </div>
                      {step.data.statusCode > 0 && (
                        <div>
                          <span className="text-gray-600">Code de statut: </span>
                          <span className={`font-medium ${step.data.statusCode < 400 ? 'text-green-600' : 'text-red-600'}`}>
                            {step.data.statusCode}
                          </span>
                        </div>
                      )}
                    </div>
                    {step.data.errorDetails && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Détail de l'erreur:</strong> {step.data.errorDetails}
                      </div>
                    )}
                  </div>
                )}
                
                {key === 'homepageAnalysis' && step.data && (
                  <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Technologies Détectées:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {step.data.technologies?.filter((tech): tech is string => typeof tech === 'string' && tech).map((tech: string, index: number) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tech}
                        </span>
                      )) || <span className="text-gray-500 text-xs">Aucune technologie détectée</span>}
                    </div>
                    {step.data.basicSeoScore && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Score SEO de base: </span>
                        <span className={`font-medium ${
                          step.data.basicSeoScore >= 70 ? 'text-green-600' : 
                          step.data.basicSeoScore >= 50 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {step.data.basicSeoScore}/100
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {key === 'architectureDiscovery' && step.data && (
                  <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Architecture Découverte:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Pages: </span>
                        <span className="font-medium">{step.data.pagesDiscovered || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sitemap: </span>
                        <span className={`font-medium ${step.data.hasSitemap ? 'text-green-600' : 'text-red-600'}`}>
                          {step.data.hasSitemap ? 'Présent' : 'Absent'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Robots.txt: </span>
                        <span className={`font-medium ${step.data.hasRobotsTxt ? 'text-green-600' : 'text-red-600'}`}>
                          {step.data.hasRobotsTxt ? 'Présent' : 'Absent'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">URLs propres: </span>
                        <span className={`font-medium ${step.data.urlStructure?.hasCleanUrls ? 'text-green-600' : 'text-orange-600'}`}>
                          {step.data.urlStructure?.hasCleanUrls ? 'Oui' : 'Non'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {key === 'resourceInventory' && step.data && (
                  <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Inventaire des Ressources:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{step.data.images?.total || 0}</div>
                        <div className="text-gray-600">Images</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{step.data.links?.internal || 0}</div>
                        <div className="text-gray-600">Liens internes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{step.data.links?.external || 0}</div>
                        <div className="text-gray-600">Liens externes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{step.data.forms?.found || 0}</div>
                        <div className="text-gray-600">Formulaires</div>
                      </div>
                    </div>
                    {step.data.images?.withoutAlt > 0 && (
                      <div className="mt-2 text-sm text-orange-700">
                        ⚠️ {step.data.images.withoutAlt} images sans attribut alt détectées
                      </div>
                    )}
                  </div>
                )}
                
                {step.warnings.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-orange-800 mb-2">
                      {step.status === 'failed' ? 'Problèmes détectés:' : 'Avertissements:'}
                    </h4>
                    <ul className={`text-sm space-y-1 ${step.status === 'failed' ? 'text-red-700' : 'text-orange-700'}`}>
                      {step.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-current">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {step.error && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                    Erreur: {step.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Issues critiques */}
        {result.summary.criticalIssues.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Problèmes Critiques Détectés ({result.summary.criticalIssues.length})
            </h3>
            <div className="space-y-3">
              {result.summary.criticalIssues.map((issue, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-red-200">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-red-800 font-medium">{issue || 'Problème non spécifié'}</span>
                    {issue && issue.includes('Solution:') && (
                      <div className="mt-1 text-sm text-red-700 bg-red-100 p-2 rounded">
                        {issue.split('Solution:')[1]?.trim()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prochaines étapes */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Prochaines Étapes Recommandées
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.summary.nextSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-blue-800">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          {/* Bouton de retry si échec */}
          {result.status === 'failed' && (
            <button
              onClick={performFirstStepAnalysis}
              className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réessayer l'Analyse</span>
            </button>
          )}
          
          {result.summary.isWordPress && result.status !== 'failed' && (
            <button
              onClick={() => navigate(`/analysis-selection/${result.websiteId}`)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Continuer l'Analyse Complète</span>
            </button>
          )}
          
          {/* Analyse manuelle si WordPress non détecté */}
          {!result.summary.isWordPress && result.status !== 'failed' && (
            <button
              onClick={() => navigate(`/analysis-selection/${result.websiteId}`)}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Analyser Quand Même</span>
            </button>
          )}
          
          <button
            onClick={() => navigate('/discovery')}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Retour à la Découverte
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirstStepAnalysisPage;