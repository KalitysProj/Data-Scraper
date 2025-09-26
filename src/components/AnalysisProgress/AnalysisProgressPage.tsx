import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { websiteService } from '../../services/websiteService';
import { Database } from '../../lib/supabase';
import { 
  Search, 
  Shield, 
  Zap, 
  FileText, 
  Eye,
  Link,
  CheckCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

type AnalysisSession = Database['public']['Tables']['analysis_sessions']['Row'] & {
  websites?: Database['public']['Tables']['websites']['Row'];
};

interface ModuleProgress {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

// Configuration centralisée optimisée
const PROGRESS_CONFIG = {
  MODULES: {
    seo: { name: 'Analyse SEO', icon: Search },
    performance: { name: 'Performance', icon: Zap },
    security: { name: 'Sécurité', icon: Shield },
    forms: { name: 'Formulaires', icon: FileText },
    links: { name: 'Liens', icon: Link },
    accessibility: { name: 'Accessibilité', icon: Eye }
  },
  STATUS: {
    COLORS: {
      completed: 'text-green-600 bg-green-100',
      running: 'text-blue-600 bg-blue-100',
      failed: 'text-red-600 bg-red-100',
      pending: 'text-gray-600 bg-gray-100'
    },
    TEXT: {
      pending: 'En attente',
      running: 'En cours',
      completed: 'Terminé',
      failed: 'Échec'
    }
  },
  ANALYSIS: {
    STEPS_PER_MODULE: 10,
    MIN_DELAY: 300,
    MAX_DELAY: 800,
    FINAL_SCORE_MIN: 70,
    FINAL_SCORE_MAX: 100,
    REDIRECT_DELAY: 2000
  }
} as const;
const AnalysisProgressPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [modules, setModules] = useState<ModuleProgress[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPaused, setIsPaused] = useState(false);


  useEffect(() => {
    if (user && sessionId) {
      loadSession();
    }
  }, [user, sessionId]);

  // Fonctions utilitaires optimisées
  const getStatusColor = (status: string) => 
    PROGRESS_CONFIG.STATUS.COLORS[status as keyof typeof PROGRESS_CONFIG.STATUS.COLORS] || PROGRESS_CONFIG.STATUS.COLORS.pending;
    
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Clock;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };
  
  const loadSession = async () => {
    try {
      setLoading(true);
      
      // Charger la session
      const sessions = await websiteService.getUserAnalysisSessions(user!.uid);
      const currentSession = sessions.find(s => s.id === sessionId);
      
      if (!currentSession) {
        navigate('/discovery');
        return;
      }
      
      setSession(currentSession);
      
      // Initialiser les modules
      const moduleList: ModuleProgress[] = (currentSession.modules_selected || []).map(moduleId => ({
        id: moduleId,
        name: PROGRESS_CONFIG.MODULES[moduleId as keyof typeof PROGRESS_CONFIG.MODULES]?.name || moduleId,
        icon: PROGRESS_CONFIG.MODULES[moduleId as keyof typeof PROGRESS_CONFIG.MODULES]?.icon || Search,
        status: (currentSession.modules_completed || []).includes(moduleId) ? 'completed' : 'pending',
        progress: (currentSession.modules_completed || []).includes(moduleId) ? 100 : 0
      }));
      
      setModules(moduleList);
      
      // Démarrer l'analyse si elle n'est pas encore commencée
      if (currentSession.status === 'created') {
        await startAnalysis(currentSession);
      }
      
    } catch (error) {
      console.error('Erreur chargement session:', error);
      setError('Erreur lors du chargement de la session');
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async (sessionData: AnalysisSession) => {
    try {
      // Marquer la session comme démarrée
      await websiteService.startAnalysisSession(sessionData.id);
      
      // Démarrer l'analyse module par module
      await runAnalysisModules(sessionData);
      
    } catch (error) {
      console.error('Erreur démarrage analyse:', error);
      setError('Erreur lors du démarrage de l\'analyse');
    }
  };

  const runAnalysisModules = async (sessionData: AnalysisSession) => {
    const modulesToRun = sessionData.modules_selected || [];
    let completedModules: string[] = [];
    
    for (let i = 0; i < modulesToRun.length; i++) {
      if (isPaused) break;
      
      const moduleId = modulesToRun[i];
      setCurrentModule(moduleId);
      
      // Mettre à jour le statut du module
      setModules(prev => prev.map(m => 
        m.id === moduleId 
          ? { ...m, status: 'running', startTime: new Date() }
          : m
      ));
      
      try {
        // Simuler l'analyse du module
        await runModuleAnalysis(moduleId, sessionData);
        
        // Marquer comme terminé
        completedModules.push(moduleId);
        setModules(prev => prev.map(m => 
          m.id === moduleId 
            ? { ...m, status: 'completed', progress: 100, endTime: new Date() }
            : m
        ));
        
        // Mettre à jour la progression globale
        const progress = Math.round(((i + 1) / modulesToRun.length) * 100);
        setOverallProgress(progress);
        
        // Mettre à jour la session
        await websiteService.updateSessionProgress(sessionData.id, completedModules);
        
      } catch (error) {
        console.error(`Erreur module ${moduleId}:`, error);
        setModules(prev => prev.map(m => 
          m.id === moduleId 
            ? { ...m, status: 'failed', error: error instanceof Error ? error.message : 'Erreur inconnue' }
            : m
        ));
      }
    }
    
    // Terminer la session
    if (!isPaused && completedModules.length === modulesToRun.length) {
      const finalScore = Math.round(Math.random() * (PROGRESS_CONFIG.ANALYSIS.FINAL_SCORE_MAX - PROGRESS_CONFIG.ANALYSIS.FINAL_SCORE_MIN) + PROGRESS_CONFIG.ANALYSIS.FINAL_SCORE_MIN);
      await websiteService.completeAnalysisSession(sessionData.id, finalScore);
      setCurrentModule(null);
      
      // Rediriger vers les résultats après un délai
      setTimeout(() => {
        navigate(`/analysis-results/${sessionData.id}`);
      }, PROGRESS_CONFIG.ANALYSIS.REDIRECT_DELAY);
    }
  };

  const runModuleAnalysis = async (moduleId: string, sessionData: AnalysisSession): Promise<void> => {
    // Simulation de l'analyse avec progression
    const steps = PROGRESS_CONFIG.ANALYSIS.STEPS_PER_MODULE;
    for (let step = 0; step < steps; step++) {
      if (isPaused) break;
      
      const delay = PROGRESS_CONFIG.ANALYSIS.MIN_DELAY + Math.random() * (PROGRESS_CONFIG.ANALYSIS.MAX_DELAY - PROGRESS_CONFIG.ANALYSIS.MIN_DELAY);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const progress = Math.round(((step + 1) / steps) * 100);
      setModules(prev => prev.map(m => 
        m.id === moduleId 
          ? { ...m, progress }
          : m
      ));
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleRestart = async () => {
    if (!session) return;
    
    setIsPaused(false);
    setCurrentModule(null);
    setOverallProgress(0);
    
    // Réinitialiser les modules
    setModules(prev => prev.map(m => ({
      ...m,
      status: 'pending',
      progress: 0,
      startTime: undefined,
      endTime: undefined,
      error: undefined
    })));
    
    // Redémarrer l'analyse
    await startAnalysis(session);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session non trouvée</h2>
          <p className="text-gray-600 mb-4">Cette session d'analyse n'existe pas.</p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {session.session_name}
                </h1>
                <p className="text-gray-600">
                  Analyse en cours • {session.websites?.domain || 'Site web'}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePauseResume}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'Reprendre' : 'Pause'}</span>
                </button>
                
                <button
                  onClick={handleRestart}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Redémarrer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progression Globale</h2>
            <span className="text-2xl font-bold text-blue-600">{overallProgress}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {modules.filter(m => m.status === 'completed').length} / {modules.length} modules terminés
            </span>
            <span>
              {currentModule && `Module actuel: ${modules.find(m => m.id === currentModule)?.name}`}
            </span>
          </div>
        </div>

        {/* Modules Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Détail des Modules</h2>
          
          <div className="space-y-4">
            {modules.map((module) => {
              const IconComponent = module.icon;
              const StatusIcon = getStatusIcon(module.status);
              
              return (
                <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{module.name}</h3>
                        {module.startTime && (
                          <p className="text-sm text-gray-500">
                            Démarré à {module.startTime.toLocaleTimeString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {module.progress}%
                      </span>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="w-5 h-5" />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(module.status)}`}>
                          {PROGRESS_CONFIG.STATUS.TEXT[module.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        module.status === 'completed' ? 'bg-green-500' :
                        module.status === 'running' ? 'bg-blue-500' :
                        module.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                  
                  {module.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      Erreur: {module.error}
                    </div>
                  )}
                  
                  {module.endTime && (
                    <div className="mt-2 text-xs text-gray-500">
                      Terminé à {module.endTime.toLocaleTimeString('fr-FR')} 
                      {module.startTime && ` (durée: ${Math.round((module.endTime.getTime() - module.startTime.getTime()) / 1000)}s)`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {isPaused && (
          <div className="mt-6 bg-yellow-50 border border-yellow-300 text-yellow-700 px-4 py-3 rounded-lg">
            L'analyse est en pause. Cliquez sur "Reprendre" pour continuer.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisProgressPage;