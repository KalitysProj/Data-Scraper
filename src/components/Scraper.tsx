import React, { useState } from 'react';
import { useEffect } from 'react';
import { 
  Search, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MapPin,
  Building,
  Code,
  StopCircle
} from 'lucide-react';
import { apiService } from '../services/api';

interface ScrapingConfig {
  apeCode: string;
  department: string;
  siegeOnly: boolean;
}

interface ScrapingProgress {
  isActive: boolean;
  progress: number;
  status: string;
  foundResults: number;
  processedResults: number;
  jobId?: string;
}

export const Scraper: React.FC = () => {
  const [config, setConfig] = useState<ScrapingConfig>({
    apeCode: '',
    department: '',
    siegeOnly: true
  });

  const [progress, setProgress] = useState<ScrapingProgress>({
    isActive: false,
    progress: 0,
    status: '',
    foundResults: 0,
    processedResults: 0,
    jobId: undefined
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const departmentOptions = [
    { value: '01', label: '01 - Ain' },
    { value: '02', label: '02 - Aisne' },
    { value: '03', label: '03 - Allier' },
    { value: '13', label: '13 - Bouches-du-Rhône' },
    { value: '69', label: '69 - Rhône' },
    { value: '75', label: '75 - Paris' },
    { value: '971', label: '971 - Guadeloupe' },
    { value: '972', label: '972 - Martinique' },
    { value: '973', label: '973 - Guyane' },
    { value: '974', label: '974 - Réunion' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (progress.isActive && progress.jobId) {
      interval = setInterval(async () => {
        try {
          const job = await apiService.getScrapingStatus(progress.jobId!);
          
          setProgress(prev => ({
            ...prev,
            progress: job.progress,
            status: getStatusMessage(job.status, job.progress),
            foundResults: job.results_found,
            processedResults: job.results_processed,
            isActive: job.status === 'running'
          }));

          if (job.status === 'completed' || job.status === 'failed') {
            setProgress(prev => ({ ...prev, isActive: false }));
            if (job.status === 'failed' && job.error_message) {
              setError(job.error_message);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du statut:', error);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [progress.isActive, progress.jobId]);

  const getStatusMessage = (status: string, progressValue: number): string => {
    switch (status) {
      case 'pending':
        return 'En attente de démarrage...';
      case 'running':
        return progressValue < 20 
          ? 'Initialisation du scraping...'
          : progressValue < 50
          ? 'Recherche des entreprises...'
          : progressValue < 80
          ? 'Extraction des données...'
          : 'Finalisation...';
      case 'completed':
        return 'Scraping terminé avec succès !';
      case 'failed':
        return 'Erreur lors du scraping';
      default:
        return 'Statut inconnu';
    }
  };

  const validateConfig = (): boolean => {
    const errors: string[] = [];
    
    if (!config.apeCode.trim()) {
      errors.push('Le code APE est requis');
    } else if (!/^\d{4}[A-Z]$/.test(config.apeCode.trim())) {
      errors.push('Le code APE doit être au format 0000A (ex: 0121Z)');
    }
    
    if (!config.department) {
      errors.push('Le département est requis');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const startScraping = async () => {
    if (!validateConfig()) return;
    
    setError(null);
    
    try {
      const { jobId } = await apiService.startScraping({
        apeCode: config.apeCode.trim(),
        department: config.department,
        siegeOnly: config.siegeOnly
      });

      setProgress({
        isActive: true,
        progress: 0,
        status: 'Démarrage du scraping...',
        foundResults: 0,
        processedResults: 0,
        jobId
      });
    } catch (error) {
      // En mode démonstration, afficher un message informatif
      setError('Mode démonstration : Le scraping réel nécessite le backend');
    }
  };

  const stopScraping = async () => {
    if (!progress.jobId) return;

    try {
      await apiService.stopScraping(progress.jobId);
      setProgress(prev => ({
        ...prev,
        isActive: false,
        status: 'Scraping arrêté par l\'utilisateur'
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'arrêt du scraping');
    }
  };

  const resetScraping = () => {
    setProgress({
      isActive: false,
      progress: 0,
      status: '',
      foundResults: 0,
      processedResults: 0,
      jobId: undefined
    });
    setError(null);
  };

  const canStartScraping = () => {
    return !progress.isActive;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau Scraping</h1>
        <p className="text-gray-600">Configurez et lancez une extraction de données INPI</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Fermer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Configuration de la recherche
          </h3>

          <div className="space-y-6">
            {/* Code APE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code APE *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.apeCode}
                  onChange={(e) => setConfig({ ...config, apeCode: e.target.value.toUpperCase() })}
                  placeholder="Ex: 0121Z"
                  disabled={progress.isActive}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <Code className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Format: 4 chiffres + 1 lettre (ex: 0121Z pour culture de la vigne)</p>
            </div>

            {/* Département */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Département *
              </label>
              <div className="relative">
                <select
                  value={config.department}
                  onChange={(e) => setConfig({ ...config, department: e.target.value })}
                  disabled={progress.isActive}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Sélectionnez un département</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Options */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="siegeOnly"
                  checked={config.siegeOnly}
                  onChange={(e) => setConfig({ ...config, siegeOnly: e.target.checked })}
                  disabled={progress.isActive}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <label htmlFor="siegeOnly" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  Siège uniquement
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7 mt-1">Récupérer uniquement les données du siège social</p>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-2">Erreurs de validation :</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!progress.isActive ? (
                <button
                  onClick={startScraping}
                  disabled={!canStartScraping()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Lancer le scraping
                </button>
              ) : (
                <>
                  <button
                    onClick={stopScraping}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <StopCircle className="w-5 h-5" />
                    Arrêter
                  </button>
                </>
              )}
              
              {progress.progress > 0 && !progress.isActive && (
                <button
                  onClick={resetScraping}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Nouveau
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-green-600" />
            Progression du scraping
          </h3>

          {!progress.isActive && progress.progress === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Prêt à démarrer</p>
              <p className="text-sm text-gray-400 mt-1">Configurez vos paramètres et lancez le scraping</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progression</span>
                  <span>{progress.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                progress.isActive 
                  ? 'bg-blue-50 border-blue-200'
                  : progress.progress === 100
                  ? 'bg-green-50 border-green-200'
                  : error
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                {progress.isActive ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : progress.progress === 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : error ? (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                )}
                <p className={`text-sm font-medium ${
                  progress.isActive 
                    ? 'text-blue-900'
                    : progress.progress === 100
                    ? 'text-green-900'
                    : error
                    ? 'text-red-900'
                    : 'text-gray-900'
                }`}>
                  {progress.status}
                </p>
              </div>

              {/* Results */}
              {progress.foundResults > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-2xl font-bold text-green-700">{progress.foundResults}</p>
                    <p className="text-sm text-green-600">Entreprises trouvées</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">{progress.processedResults}</p>
                    <p className="text-sm text-blue-600">Données extraites</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legal Notice */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 mb-1">Avis légal</h4>
            <p className="text-sm text-amber-700">
              Veuillez vous assurer de respecter les conditions d'utilisation du site INPI et la réglementation en vigueur 
              concernant l'extraction de données. Utilisez cet outil de manière responsable et éthique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ajout des méthodes manquantes à apiService
declare module '../services/api' {
  interface ApiService {
    stopScraping(jobId: string): Promise<void>;
  }
}

// Extension temporaire de l'API service
if (!('stopScraping' in apiService)) {
  (apiService as any).stopScraping = async function(jobId: string) {
    const response = await this.request(`/scraping/stop/${jobId}`, {
      method: 'POST'
    });

    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de l\'arrêt du scraping');
    }
  };
}