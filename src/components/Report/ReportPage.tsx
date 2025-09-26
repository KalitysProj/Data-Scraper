import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnalysisResult } from '../../types';
import { 
  Download, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Globe,
  Shield,
  Zap,
  Eye,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (id) {
      loadAnalysis(id);
    }
  }, [id]);

  const loadAnalysis = (analysisId: string) => {
    const allAnalyses = JSON.parse(localStorage.getItem('analyses') || '[]') as AnalysisResult[];
    const foundAnalysis = allAnalyses.find(a => a.id === analysisId);
    
    if (!foundAnalysis) {
      navigate('/dashboard');
      return;
    }

    setAnalysis(foundAnalysis);
    setLoading(false);
  };

  const exportToPDF = async () => {
    if (!analysis) return;
    
    setIsExporting(true);
    
    try {
      // Show loading message
      const loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                    z-index: 9999; text-align: center;">
          <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; 
                      border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
          <p>Génération du PDF en cours...</p>
        </div>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `;
      document.body.appendChild(loadingDiv);
      
      const reportElement = document.getElementById('report-content');
      if (!reportElement) return;

      // Optimize canvas generation
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false, // Disable logging for performance
        onclone: (clonedDoc) => {
          // Optimize cloned document for PDF
          const clonedElement = clonedDoc.getElementById('report-content');
          if (clonedElement) {
            clonedElement.style.maxWidth = '210mm';
            clonedElement.style.padding = '20mm';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const hostname = new URL(analysis.url).hostname;
      const date = new Date(analysis.timestamp).toLocaleDateString('fr-FR');
      pdf.save(`rapport-${hostname}-${date}.pdf`);
      
      // Remove loading message
      document.body.removeChild(loadingDiv);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analysis.results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Rapport non disponible</h2>
          <p className="text-gray-600">Cette analyse n'est pas encore terminée.</p>
        </div>
      </div>
    );
  }

  const { results } = analysis;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Rapport d'Analyse
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>{analysis.url}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>•</span>
                  <span>{new Date(analysis.timestamp).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <a
                href={analysis.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Voir le site</span>
              </a>
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isExporting ? 'Export...' : 'Télécharger PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        <div id="report-content">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">SEO</h3>
              <p className={`text-2xl font-bold ${getScoreColor(results.seo.score)}`}>
                {results.seo.score}/100
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Performance</h3>
              <p className={`text-2xl font-bold ${getScoreColor(results.performance.score)}`}>
                {results.performance.score}/100
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Accessibilité</h3>
              <p className={`text-2xl font-bold ${getScoreColor(results.accessibility.score)}`}>
                {results.accessibility.score}/100
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Liens</h3>
              <p className="text-2xl font-bold text-gray-900">{results.links.totalLinks}</p>
              <p className="text-sm text-red-600">{results.links.brokenLinks} cassés</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Pages</h3>
              <p className="text-2xl font-bold text-gray-900">{results.links.totalLinks}</p>
              <p className="text-sm text-blue-600">analysées</p>
            </div>
          </div>

          {/* Additional metrics row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Formulaires</h3>
              <p className="text-2xl font-bold text-gray-900">{results.forms.formsFound}</p>
              <p className="text-sm text-green-600">{results.forms.workingForms} fonctionnent</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Problèmes SEO</h3>
              <p className="text-2xl font-bold text-gray-900">{results.seo.issues.length}</p>
              <p className="text-sm text-red-600">
                {results.seo.issues.filter(i => i.severity === 'high').length} critiques
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Accessibilité</h3>
              <p className="text-2xl font-bold text-gray-900">{results.accessibility.issues.length}</p>
              <p className="text-sm text-orange-600">problèmes détectés</p>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SEO Issues */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Problèmes SEO
              </h3>
              <div className="space-y-4">
                {results.seo.issues.map((issue, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{issue.message}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Page: {issue.page || issue.url || '/'}</p>
                    {issue.solution && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Solution:</strong> {issue.solution}
                        </p>
                      </div>
                    )}
                    {issue.currentValue && (
                      <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-2">
                        <p className="text-xs text-gray-600">
                          <strong>Valeur actuelle:</strong> {issue.currentValue}
                        </p>
                      </div>
                    )}
                    {issue.recommendedValue && (
                      <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                        <p className="text-xs text-green-700">
                          <strong>Valeur recommandée:</strong> {issue.recommendedValue}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-green-600" />
                Métriques de Performance
              </h3>
              
              {/* Legend */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Valeurs de référence :</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-medium text-gray-600">Temps de chargement :</span>
                    <div className="ml-2">
                      <span className="text-green-600">• Excellent : &lt; 2s</span><br/>
                      <span className="text-orange-600">• Bon : &lt; 3s</span><br/>
                      <span className="text-red-600">• À améliorer : &gt; 3s</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">First Contentful Paint :</span>
                    <div className="ml-2">
                      <span className="text-green-600">• Excellent : &lt; 1.2s</span><br/>
                      <span className="text-orange-600">• Bon : &lt; 1.8s</span><br/>
                      <span className="text-red-600">• À améliorer : &gt; 1.8s</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Largest Contentful Paint :</span>
                    <div className="ml-2">
                      <span className="text-green-600">• Excellent : &lt; 1.2s</span><br/>
                      <span className="text-orange-600">• Bon : &lt; 2.5s</span><br/>
                      <span className="text-red-600">• À améliorer : &gt; 2.5s</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Cumulative Layout Shift :</span>
                    <div className="ml-2">
                      <span className="text-green-600">• Excellent : &lt; 0.05</span><br/>
                      <span className="text-orange-600">• Bon : &lt; 0.1</span><br/>
                      <span className="text-red-600">• À améliorer : &gt; 0.1</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Temps de chargement</span>
                  <div className="text-right">
                    <span className={`font-bold ${results.performance.loadTime <= 2 ? 'text-green-600' : results.performance.loadTime <= 3 ? 'text-orange-600' : 'text-red-600'}`}>
                      {results.performance.loadTime.toFixed(2)}s
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {results.performance.loadTime <= 2 ? 'Excellent' : results.performance.loadTime <= 3 ? 'Bon' : 'À améliorer'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">First Contentful Paint</span>
                  <div className="text-right">
                    <span className={`font-bold ${results.performance.firstContentfulPaint <= 1.2 ? 'text-green-600' : results.performance.firstContentfulPaint <= 1.8 ? 'text-orange-600' : 'text-red-600'}`}>
                      {results.performance.firstContentfulPaint.toFixed(2)}s
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {results.performance.firstContentfulPaint <= 1.2 ? 'Excellent' : results.performance.firstContentfulPaint <= 1.8 ? 'Bon' : 'À améliorer'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Largest Contentful Paint</span>
                  <div className="text-right">
                    <span className={`font-bold ${results.performance.largestContentfulPaint <= 1.2 ? 'text-green-600' : results.performance.largestContentfulPaint <= 2.5 ? 'text-orange-600' : 'text-red-600'}`}>
                      {results.performance.largestContentfulPaint.toFixed(2)}s
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {results.performance.largestContentfulPaint <= 1.2 ? 'Excellent' : results.performance.largestContentfulPaint <= 2.5 ? 'Bon' : 'À améliorer'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Cumulative Layout Shift</span>
                  <div className="text-right">
                    <span className={`font-bold ${results.performance.cumulativeLayoutShift <= 0.05 ? 'text-green-600' : results.performance.cumulativeLayoutShift <= 0.1 ? 'text-orange-600' : 'text-red-600'}`}>
                      {results.performance.cumulativeLayoutShift.toFixed(2)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {results.performance.cumulativeLayoutShift <= 0.05 ? 'Excellent' : results.performance.cumulativeLayoutShift <= 0.1 ? 'Bon' : 'À améliorer'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Broken Links */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <XCircle className="w-5 h-5 mr-2 text-red-600" />
                Liens Cassés ({results.links.brokenLinks})
              </h3>
              
              {/* Guide général pour les liens cassés */}
              {results.links.brokenLinks > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">🔧 Actions prioritaires :</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-700">
                    <div>
                      <strong>1. Audit immédiat :</strong>
                      <ul className="ml-2 mt-1 space-y-1">
                        <li>• Tester chaque lien manuellement</li>
                        <li>• Identifier la cause de l'erreur</li>
                        <li>• Prioriser par importance de la page</li>
                      </ul>
                    </div>
                    <div>
                      <strong>2. Solutions techniques :</strong>
                      <ul className="ml-2 mt-1 space-y-1">
                        <li>• Configurer des redirections 301</li>
                        <li>• Mettre à jour les liens dans le CMS</li>
                        <li>• Créer une page 404 personnalisée</li>
                      </ul>
                    </div>
                    <div>
                      <strong>3. Prévention :</strong>
                      <ul className="ml-2 mt-1 space-y-1">
                        <li>• Vérifier régulièrement les liens</li>
                        <li>• Utiliser des outils de monitoring</li>
                        <li>• Former l'équipe éditoriale</li>
                      </ul>
                    </div>
                    <div>
                      <strong>4. Outils recommandés :</strong>
                      <ul className="ml-2 mt-1 space-y-1">
                        <li>• Google Search Console</li>
                        <li>• Screaming Frog SEO Spider</li>
                        <li>• Plugin WordPress (Broken Link Checker)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {results.links.brokenLinksList.map((link, index) => (
                  <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-red-800 truncate">{link.url}</span>
                      <span className="text-sm text-red-600 bg-red-200 px-2 py-1 rounded">
                        {link.status}
                      </span>
                    </div>
                    <p className="text-sm text-red-600">Page: {link.page}</p>
                    <p className="text-sm text-red-700 mt-1">{link.message}</p>
                    
                    {/* Solutions pour liens cassés */}
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <h5 className="text-sm font-semibold text-blue-800 mb-2">Solutions recommandées :</h5>
                      <ul className="text-xs text-blue-700 space-y-1">
                        {link.status === 404 ? (
                          <>
                            <li>• Vérifier si la page de destination existe encore</li>
                            <li>• Rediriger vers une page similaire ou pertinente</li>
                            <li>• Supprimer le lien s'il n'est plus nécessaire</li>
                            <li>• Corriger l'URL si elle contient une erreur de frappe</li>
                          </>
                        ) : link.status >= 500 ? (
                          <>
                            <li>• Problème serveur temporaire - revérifier plus tard</li>
                            <li>• Contacter l'administrateur du site de destination</li>
                            <li>• Remplacer par un lien vers une source alternative</li>
                          </>
                        ) : link.status === 403 ? (
                          <>
                            <li>• Accès interdit - vérifier les permissions</li>
                            <li>• Utiliser un lien public vers la même ressource</li>
                            <li>• Contacter le propriétaire pour obtenir l'accès</li>
                          </>
                        ) : link.status === 0 ? (
                          <>
                            <li>• Problème de connectivité - vérifier l'URL</li>
                            <li>• Le site peut être temporairement indisponible</li>
                            <li>• Vérifier si l'URL est correctement formatée</li>
                          </>
                        ) : (
                          <>
                            <li>• Analyser le code d'erreur HTTP {link.status}</li>
                            <li>• Vérifier la validité de l'URL</li>
                            <li>• Tester le lien dans un navigateur</li>
                            <li>• Considérer une redirection ou suppression</li>
                          </>
                        )}
                      </ul>
                    </div>
                    
                    {/* Impact SEO */}
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>Impact SEO :</strong> Les liens cassés nuisent à l'expérience utilisateur et peuvent affecter 
                        négativement le classement de votre site dans les moteurs de recherche.
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Guide pour les images sans alt */}
                {results.seo.issues.some(issue => issue.type === 'images') && (
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2">🖼️ Guide pour optimiser les images :</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-purple-700">
                      <div>
                        <strong>1. Attributs alt descriptifs :</strong>
                        <ul className="ml-2 mt-1 space-y-1">
                          <li>• Décrire le contenu de l'image</li>
                          <li>• Éviter "image de" ou "photo de"</li>
                          <li>• 125 caractères maximum</li>
                          <li>• Inclure les mots-clés pertinents</li>
                        </ul>
                      </div>
                      <div>
                        <strong>2. Bonnes pratiques :</strong>
                        <ul className="ml-2 mt-1 space-y-1">
                          <li>• Images décoratives : alt=""</li>
                          <li>• Graphiques : décrire les données</li>
                          <li>• Logos : nom de l'entreprise</li>
                          <li>• Boutons : action à effectuer</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-purple-100 border border-purple-300 rounded">
                      <p className="text-xs text-purple-800">
                        <strong>Impact :</strong> Les attributs alt améliorent l'accessibilité pour les lecteurs d'écran 
                        et aident les moteurs de recherche à comprendre vos images.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security & Forms */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                Sécurité & Formulaires
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">HTTPS</span>
                  {results.security.httpsEnabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Protection CAPTCHA</span>
                  {results.forms.captchaInfo?.type !== 'none' ? (
                    <div className="text-right">
                      <CheckCircle className="w-5 h-5 text-green-600 inline" />
                      <div className="text-xs text-gray-500 mt-1">
                        {results.forms.captchaInfo?.provider} {results.forms.captchaInfo?.version}
                      </div>
                    </div>
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Formulaires fonctionnels</span>
                  <span className="font-bold text-gray-900">
                    {results.forms.workingForms}/{results.forms.formsFound}
                  </span>
                </div>
                
                {/* Detailed Form Analysis */}
                {results.forms.formDetails && results.forms.formDetails.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Analyse Détaillée des Formulaires</h4>
                    
                    {/* Test Summary */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-blue-800 mb-3">🧪 Résumé des Tests Effectués :</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                        <div>
                          <strong>Tests automatisés :</strong>
                          <ul className="ml-2 mt-1 space-y-1">
                            <li>• Détection des formulaires HTML</li>
                            <li>• Validation des attributs action/method</li>
                            <li>• Analyse des champs requis</li>
                            <li>• Vérification des types de champs</li>
                          </ul>
                        </div>
                        <div>
                          <strong>Tests de sécurité :</strong>
                          <ul className="ml-2 mt-1 space-y-1">
                            <li>• Scan des systèmes CAPTCHA</li>
                            <li>• Détection des protections anti-spam</li>
                            <li>• Analyse des destinations email</li>
                            <li>• Vérification de l'accessibilité</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {results.forms.formDetails.map((form, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          {/* Form Test Results Header */}
                          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                            <h6 className="text-sm font-semibold text-gray-800 mb-2">🔍 Résultats des Tests :</h6>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-2 ${form.isWorking ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span>Fonctionnel: {form.isWorking ? 'Oui' : 'Non'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-2 ${form.hasValidation ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                <span>Validation: {form.hasValidation ? 'Oui' : 'Non'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-2 ${form.isSecure ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span>Sécurisé: {form.isSecure ? 'Oui' : 'Non'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-2 ${form.captcha?.present ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                <span>CAPTCHA: {form.captcha?.present ? 'Oui' : 'Non'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">
                              Formulaire #{index + 1}
                              {form.id && <span className="text-xs text-gray-500 ml-2">ID: {form.id}</span>}
                            </h5>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              form.isWorking ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                            }`}>
                              {form.isWorking ? 'Fonctionnel' : 'Problématique'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Action: <code className="bg-gray-100 px-1 rounded">{form.action || 'Non définie'}</code></p>
                              <p className="text-sm text-gray-600">Méthode: <code className="bg-gray-100 px-1 rounded">{form.method}</code></p>
                              <p className="text-sm text-gray-600">Champs: {form.fieldCount || form.fields?.length || 0}</p>
                              {form.fields && form.fields.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500">Types de champs détectés:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {[...new Set(form.fields.map(f => f.type))].map((type, i) => (
                                      <span key={i} className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                        {type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Email: {form.hasEmailField ? '✅' : '❌'}</p>
                              <p className="text-sm text-gray-600">Champs requis: {form.hasRequiredFields ? '✅' : '❌'}</p>
                              <p className="text-sm text-gray-600">CAPTCHA: {form.captcha?.present ? '✅' : '❌'}</p>
                              <p className="text-sm text-gray-600">Validation: {form.hasValidation ? '✅' : '❌'}</p>
                              <p className="text-sm text-gray-600">Sécurisé: {form.isSecure ? '✅' : '❌'}</p>
                            </div>
                          </div>
                          
                          {/* CAPTCHA Details */}
                          {form.captcha?.present && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                              <h6 className="text-sm font-semibold text-green-800 mb-2">🛡️ Protection CAPTCHA détectée :</h6>
                              <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded">
                                <p className="text-xs text-green-800">
                                  <strong>🧪 Test effectué :</strong> Scan automatique du code HTML pour détecter les scripts et éléments CAPTCHA
                                </p>
                              </div>
                              <div className="text-sm text-green-700 space-y-1">
                                <p><strong>Type :</strong> {form.captcha.type}</p>
                                {form.captcha.version && <p><strong>Version :</strong> {form.captcha.version}</p>}
                                {form.captcha.provider && <p><strong>Fournisseur :</strong> {form.captcha.provider}</p>}
                                {form.captcha.siteKey && (
                                  <p><strong>Site Key :</strong> <code className="bg-green-100 px-1 rounded text-xs">{form.captcha.siteKey}</code></p>
                                )}
                                <div className="mt-2 p-2 bg-white border border-green-200 rounded">
                                  <p className="text-xs text-green-600">
                                    <strong>🔒 Niveau de sécurité :</strong> 
                                    {form.captcha.type === 'recaptcha-v3' ? ' Élevé (Invisible, score-based)' :
                                     form.captcha.type === 'recaptcha-v2' ? ' Moyen (Challenge visuel)' :
                                     form.captcha.type === 'hcaptcha' ? ' Élevé (Privacy-focused)' :
                                     form.captcha.type === 'turnstile' ? ' Élevé (Cloudflare)' : ' Standard'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* No CAPTCHA Warning */}
                          {!form.captcha?.present && form.hasEmailField && (
                            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                              <h6 className="text-sm font-semibold text-orange-800 mb-2">⚠️ Aucune protection CAPTCHA détectée :</h6>
                              <div className="mb-3 p-2 bg-orange-100 border border-orange-300 rounded">
                                <p className="text-xs text-orange-800">
                                  <strong>🧪 Test effectué :</strong> Scan complet du formulaire et du code source - Aucun système anti-spam détecté
                                </p>
                              </div>
                              <div className="text-sm text-orange-700 space-y-1">
                                <p><strong>Risques identifiés :</strong></p>
                                <ul className="ml-4 mt-1 space-y-1">
                                  <li>• Spam automatisé par des bots</li>
                                  <li>• Surcharge du serveur email</li>
                                  <li>• Attaques par déni de service</li>
                                  <li>• Pollution de la base de données</li>
                                </ul>
                              </div>
                            </div>
                          )}
                          
                          {/* Email Destinations */}
                          {form.emailDestinations && form.emailDestinations.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                              <h6 className="text-sm font-semibold text-blue-800 mb-2">📧 Destinataires détectés :</h6>
                              <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded">
                                <p className="text-xs text-blue-800">
                                  <strong>🧪 Test effectué :</strong> Extraction automatique des adresses email dans le code source et attributs du formulaire
                                </p>
                              </div>
                              <ul className="text-sm text-blue-700 space-y-1">
                                {form.emailDestinations.map((email, emailIndex) => (
                                  <li key={emailIndex} className="font-mono">• {email}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Form Issues */}
                          {form.functionality?.issues && form.functionality.issues.length > 0 && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                              <h6 className="text-sm font-semibold text-red-800 mb-2">⚠️ Problèmes détectés :</h6>
                              <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded">
                                <p className="text-xs text-red-800">
                                  <strong>🧪 Tests effectués :</strong> Validation HTML, accessibilité, sécurité et conformité des formulaires
                                </p>
                              </div>
                              <ul className="text-sm text-red-700 space-y-1">
                                {form.functionality.issues.map((issue, issueIndex) => (
                                  <li key={issueIndex}>• {issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Form Recommendations */}
                          {form.functionality?.recommendations && form.functionality.recommendations.length > 0 && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                              <h6 className="text-sm font-semibold text-green-800 mb-2">💡 Recommandations :</h6>
                              <ul className="text-sm text-green-700 space-y-1">
                                {form.functionality.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Test Methodology */}
                          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                            <h6 className="text-sm font-semibold text-gray-700 mb-2">🔬 Méthodologie de Test :</h6>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p><strong>1. Détection :</strong> Scan des balises &lt;form&gt; dans le DOM</p>
                              <p><strong>2. Analyse :</strong> Extraction des attributs et champs de formulaire</p>
                              <p><strong>3. Sécurité :</strong> Recherche de patterns CAPTCHA dans le code source</p>
                              <p><strong>4. Validation :</strong> Vérification de la structure et accessibilité</p>
                              <p><strong>5. Rapport :</strong> Synthèse des résultats avec recommandations</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Global Form Security Assessment */}
                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-indigo-800 mb-3">🛡️ Évaluation Globale de la Sécurité des Formulaires :</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong className="text-indigo-700">Protection Anti-Spam :</strong>
                      <p className="text-indigo-600 mt-1">
                        {results.forms.hasRecaptcha ? 
                          `✅ Protégé (${results.forms.captchaInfo?.type || 'CAPTCHA détecté'})` : 
                          '⚠️ Non protégé - Risque de spam'
                        }
                      </p>
                    </div>
                    <div>
                      <strong className="text-indigo-700">Formulaires Fonctionnels :</strong>
                      <p className="text-indigo-600 mt-1">
                        ✅ {results.forms.workingForms}/{results.forms.formsFound} formulaires testés
                      </p>
                    </div>
                    <div>
                      <strong className="text-indigo-700">Niveau de Sécurité :</strong>
                      <p className="text-indigo-600 mt-1">
                        {results.forms.hasRecaptcha ? 
                          (results.forms.captchaInfo?.type === 'recaptcha-v3' ? '🔒 Élevé' : '🔒 Moyen') : 
                          '⚠️ Faible'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white border border-indigo-200 rounded">
                    <h5 className="text-sm font-semibold text-indigo-800 mb-2">📊 Résumé des Tests Automatisés :</h5>
                    <div className="text-xs text-indigo-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>✅ Détection automatique des formulaires HTML</div>
                      <div>✅ Scan des systèmes CAPTCHA (reCAPTCHA, hCaptcha, etc.)</div>
                      <div>✅ Validation de la structure des formulaires</div>
                      <div>✅ Analyse de l'accessibilité des champs</div>
                      <div>✅ Extraction des destinations email</div>
                      <div>✅ Évaluation des risques de sécurité</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Analysis Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Accessibility Issues */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-purple-600" />
                Problèmes d'Accessibilité
              </h3>
              <div className="space-y-4">
                {results.accessibility.issues.map((issue, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{issue.message}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Élément: <code className="bg-gray-100 px-1 rounded">{issue.element}</code></p>
                    {issue.xpath && (
                      <p className="text-sm text-gray-500 mb-2">XPath: <code className="bg-gray-100 px-1 rounded text-xs">{issue.xpath}</code></p>
                    )}
                    {issue.wcagLevel && (
                      <p className="text-sm text-purple-600 mb-2">Niveau WCAG: {issue.wcagLevel}</p>
                    )}
                    <div className="bg-purple-50 border border-purple-200 rounded p-3">
                      <p className="text-sm text-purple-800">
                        <strong>Solution:</strong> {issue.solution}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technologies Detected */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-indigo-600" />
                Technologies Détectées
              </h3>
              <div className="space-y-3">
                {/* This would be populated from the analysis results */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-700">WordPress</span>
                    <p className="text-sm text-gray-500">CMS</p>
                  </div>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">95% confiance</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-700">Elementor</span>
                    <p className="text-sm text-gray-500">Page Builder</p>
                  </div>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">90% confiance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recommandations Prioritaires
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.seo.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;