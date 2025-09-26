import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Zap, 
  Shield, 
  FileText, 
  Link, 
  Eye,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { websiteService } from '../../services/websiteService';

// Configuration centralisée optimisée
const ANALYSIS_CONFIG = {
  MODULES: [
    {
      id: 'seo',
      name: 'SEO',
      description: 'Analyse complète du référencement naturel',
      details: 'Balises meta, structure HTML, mots-clés, maillage interne',
      estimatedTime: '2-3 min',
      icon: Search,
      color: 'blue'
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Vitesse de chargement et Core Web Vitals',
      details: 'Temps de chargement, optimisation images, cache',
      estimatedTime: '1-2 min',
      icon: Zap,
      color: 'green'
    },
    {
      id: 'security',
      name: 'Sécurité',
      description: 'Analyse des vulnérabilités et certificats',
      details: 'HTTPS, headers de sécurité, certificats SSL',
      estimatedTime: '1 min',
      icon: Shield,
      color: 'red'
    },
    {
      id: 'forms',
      name: 'Formulaires',
      description: 'Test des formulaires et CAPTCHA',
      details: 'Validation, accessibilité, protection anti-spam',
      estimatedTime: '2-3 min',
      icon: FileText,
      color: 'purple'
    },
    {
      id: 'links',
      name: 'Liens',
      description: 'Vérification des liens cassés',
      details: 'Liens internes/externes, redirections, ancres',
      estimatedTime: '3-4 min',
      icon: Link,
      color: 'orange'
    },
    {
      id: 'accessibility',
      name: 'Accessibilité',
      description: 'Conformité WCAG et navigation',
      details: 'Contraste, alt text, navigation clavier',
      estimatedTime: '2 min',
      icon: Eye,
      color: 'indigo'
    }
  ],
  MODULE_COLORS: {
    blue: 'bg-blue-500 text-white border-blue-200',
    green: 'bg-green-500 text-white border-green-200',
    red: 'bg-red-500 text-white border-red-200',
    purple: 'bg-purple-500 text-white border-purple-200',
    orange: 'bg-orange-500 text-white border-orange-200',
    indigo: 'bg-indigo-500 text-white border-indigo-200'
  },
  SESSION_STATUS_COLORS: {
    completed: 'bg-green-100 text-green-800',
    running: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
  }
} as const;

// Fonctions utilitaires optimisées
const getModuleColor = (color: string) => 
  ANALYSIS_CONFIG.MODULE_COLORS[color as keyof typeof ANALYSIS_CONFIG.MODULE_COLORS] || ANALYSIS_CONFIG.MODULE_COLORS.blue;

const getSessionStatusColor = (status: string) => 
  ANALYSIS_CONFIG.SESSION_STATUS_COLORS[status as keyof typeof ANALYSIS_CONFIG.SESSION_STATUS_COLORS] || ANALYSIS_CONFIG.SESSION_STATUS_COLORS.default;
const AnalysisSelectionPage: React.FC = () => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const navigate = useNavigate();
  
  const [website, setWebsite] = useState<any>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>(['seo']);
  const [sessionName, setSessionName] = useState('');
  const [previousSessions, setPreviousSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Calcul mémorisé du temps estimé
  const estimatedTime = useMemo(() => {
    const totalMinutes = selectedModules.reduce((total, moduleId) => {
      const module = ANALYSIS_CONFIG.MODULES.find(m => m.id === moduleId);
      if (module) {
        const timeRange = module.estimatedTime.match(/(\d+)(?:-(\d+))?/);
        if (timeRange) {
          const min = parseInt(timeRange[1]);
          const max = timeRange[2] ? parseInt(timeRange[2]) : min;
          return total + Math.ceil((min + max) / 2);
        }
      }
      return total;
    }, 0);
    
    return `${totalMinutes} min`;
  }, [selectedModules]);

  useEffect(() => {
    loadWebsiteData();
  }, [websiteId]);

  const loadWebsiteData = async () => {
    if (!websiteId) return;
    
    try {
      setLoading(true);
      
      let websiteData;
      
      if (supabase) {
        // Charger les données du site depuis Supabase
        const { data, error: websiteError } = await supabase
          .from('websites')
          .select('*')
          .eq('id', websiteId)
          .single();
        
        if (websiteError) throw websiteError;
        websiteData = data;
      } else {
        // Mode offline - données d'exemple
        websiteData = {
          id: websiteId,
          url: 'https://example-wordpress.com',
          domain: 'example-wordpress.com',
          title: 'Site WordPress Exemple',
          user_id: 'temp-user',
          page_count: 15,
          status: 'scraped'
        };
      }
      
      setWebsite(websiteData);
      
      // Générer un nom de session par défaut
      const now = new Date();
      const defaultName = `Analyse ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      setSessionName(defaultName);
      
      // Charger les sessions précédentes
      try {
        const sessions = await websiteService.getWebsiteAnalysisSessions(websiteId, websiteData.user_id);
        setPreviousSessions(sessions);
      } catch (error) {
        console.log('⚠️ Erreur chargement sessions précédentes:', error);
        setPreviousSessions([]);
      }
      
    } catch (error) {
      console.error('Erreur chargement données:', error);
      // En cas d'erreur, créer des données par défaut
      setWebsite({
        id: websiteId,
        url: 'https://site-exemple.com',
        domain: 'site-exemple.com',
        title: 'Site en mode offline',
        user_id: 'temp-user',
        page_count: 0,
        status: 'discovered'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  const handleStartAnalysis = async () => {
    if (!websiteId || !website || selectedModules.length === 0) return;
    
    try {
      setCreating(true);
      
      // Créer la session d'analyse
      const session = await websiteService.createAnalysisSession({
        websiteId,
        userId: website.user_id,
        sessionName: sessionName.trim() || `Analyse ${new Date().toLocaleString('fr-FR')}`,
        modulesSelected: selectedModules
      });
      
      // Rediriger vers la page de progression
      navigate(`/analysis-progress/${session.id}`);
      
    } catch (error) {
      console.error('Erreur création session:', error);
      alert('Erreur lors de la création de la session d\'analyse');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Site non trouvé</h2>
          <p className="text-gray-600">Le site demandé n'existe pas ou n'est pas accessible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sélection des Analyses
              </h1>
              <div className="flex items-center text-gray-600">
                <span className="font-medium">{website.title || website.domain}</span>
                <span className="mx-2">•</span>
                <span className="text-blue-600">{website.url}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Pages découvertes</div>
              <div className="text-2xl font-bold text-blue-600">{website.page_count || 0}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sélection des modules */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Modules d'Analyse Disponibles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ANALYSIS_CONFIG.MODULES.map((module) => {
                  const Icon = module.icon;
                  const isSelected = selectedModules.includes(module.id);
                  
                  return (
                    <div
                      key={module.id}
                      onClick={() => handleModuleToggle(module.id)}
                      className={`
                        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${isSelected 
                          ? `${getModuleColor(module.color)} shadow-lg transform scale-105` 
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-6 h-6 mt-1 ${isSelected ? 'text-white' : `text-${module.color}-500`}`} />
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {module.name}
                          </h3>
                          <p className={`text-sm mt-1 ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                            {module.description}
                          </p>
                          <p className={`text-xs mt-2 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                            {module.details}
                          </p>
                          <div className="flex items-center mt-2">
                            <Clock className={`w-4 h-4 mr-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`} />
                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                              {module.estimatedTime}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Configuration et lancement */}
          <div className="space-y-6">
            {/* Configuration de session */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la session
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom de votre analyse..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modules sélectionnés
                  </label>
                  <div className="text-sm text-gray-600">
                    {selectedModules.length} module{selectedModules.length > 1 ? 's' : ''} sélectionné{selectedModules.length > 1 ? 's' : ''}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temps estimé
                  </label>
                  <div className="flex items-center text-blue-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-medium">{estimatedTime}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleStartAnalysis}
                disabled={selectedModules.length === 0 || creating}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Lancer l'Analyse
                  </>
                )}
              </button>
            </div>

            {/* Sessions précédentes */}
            {previousSessions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sessions Précédentes
                </h3>
                
                <div className="space-y-3">
                  {previousSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {session.session_name}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(session.started_at).toLocaleDateString('fr-FR')}
                          {session.overall_score && (
                            <>
                              <BarChart3 className="w-3 h-3 ml-2 mr-1" />
                              {session.overall_score}/100
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                        {session.status === 'completed' ? 'Terminée' : 
                         session.status === 'running' ? 'En cours' : 
                         session.status === 'failed' ? 'Échec' : 'Créée'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSelectionPage;