import React, { useState } from 'react';
import { 
  Search, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MapPin,
  Building,
  Code
} from 'lucide-react';

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
    processedResults: 0
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    
    // Warning for demo mode
    if (!window.confirm('Attention: Ceci est une simulation de scraping. Pour un scraping réel, vous devez configurer le backend. Continuer la démonstration ?')) {
      return;
    }
    
    setProgress({
      isActive: true,
      progress: 0,
      status: 'SIMULATION - Initialisation du scraping...',
      foundResults: 0,
      processedResults: 0
    });

    // Simulation du scraping
    const steps = [
      { message: 'SIMULATION - Connexion à INPI...', duration: 1000 },
      { message: 'SIMULATION - Recherche des entreprises...', duration: 2000 },
      { message: 'SIMULATION - Extraction des données...', duration: 3000 },
      { message: 'SIMULATION - Sauvegarde en base...', duration: 1500 },
      { message: 'SIMULATION - Scraping terminé !', duration: 500 }
    ];

    let currentProgress = 0;
    const totalSteps = steps.length;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setProgress(prev => ({
        ...prev,
        status: step.message,
        progress: Math.round((i / totalSteps) * 100),
        foundResults: Math.floor(Math.random() * 500) + 50,
        processedResults: Math.floor(Math.random() * 450) + 45
      }));

      await new Promise(resolve => setTimeout(resolve, step.duration));
    }

    setProgress(prev => ({
      ...prev,
      isActive: false,
      progress: 100,
      status: 'Scraping terminé avec succès !'
    }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau Scraping</h1>
        <p className="text-gray-600">Configurez et lancez une extraction de données INPI</p>
      </div>

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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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

            {/* Launch Button */}
            <button
              onClick={startScraping}
              disabled={progress.isActive}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {progress.isActive ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  En cours...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Lancer le scraping
                </>
              )}
            </button>
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
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                {progress.isActive ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : progress.progress === 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
                <p className="text-sm font-medium text-blue-900">{progress.status}</p>
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