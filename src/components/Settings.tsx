import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Database, 
  Bell, 
  Shield,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  Save
} from 'lucide-react';

interface SettingsData {
  apiSettings: {
    maxRequestsPerMinute: number;
    timeout: number;
    retryCount: number;
  };
  dataSettings: {
    autoExport: boolean;
    exportFormat: string;
    storageLocation: string;
  };
  notifications: {
    scrapingComplete: boolean;
    errors: boolean;
    dailyReport: boolean;
  };
  security: {
    enableLogs: boolean;
    dataRetention: number;
  };
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    apiSettings: {
      maxRequestsPerMinute: 60,
      timeout: 30,
      retryCount: 3
    },
    dataSettings: {
      autoExport: false,
      exportFormat: 'csv',
      storageLocation: 'database'
    },
    notifications: {
      scrapingComplete: true,
      errors: true,
      dailyReport: false
    },
    security: {
      enableLogs: true,
      dataRetention: 90
    }
  });

  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    // Simulate saving
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const updateSetting = (section: keyof SettingsData, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
        <p className="text-gray-600">Configurez votre outil de scraping INPI</p>
        
        {/* Backend Configuration Notice */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">Configuration Backend Requise</p>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            Pour utiliser le scraping réel, vous devez configurer le backend avec les APIs de scraping et la base de données
          </p>
        </div>
      </div>

      {/* Save Message */}
      {savedMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">Paramètres sauvegardés avec succès</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* API Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Paramètres API</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requêtes par minute
              </label>
              <input
                type="number"
                value={settings.apiSettings.maxRequestsPerMinute}
                onChange={(e) => updateSetting('apiSettings', 'maxRequestsPerMinute', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Limite recommandée: 60 req/min</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (secondes)
              </label>
              <input
                type="number"
                value={settings.apiSettings.timeout}
                onChange={(e) => updateSetting('apiSettings', 'timeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="5"
                max="120"
              />
              <p className="text-xs text-gray-500 mt-1">Temps d'attente maximum</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tentatives de retry
              </label>
              <input
                type="number"
                value={settings.apiSettings.retryCount}
                onChange={(e) => updateSetting('apiSettings', 'retryCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-1">Nombre de nouvelles tentatives</p>
            </div>
          </div>
        </div>

        {/* Data Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Gestion des données</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Export automatique</h4>
                <p className="text-sm text-gray-600">Générer automatiquement un fichier CSV après chaque scraping</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dataSettings.autoExport}
                  onChange={(e) => updateSetting('dataSettings', 'autoExport', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format d'export
                </label>
                <select
                  value={settings.dataSettings.exportFormat}
                  onChange={(e) => updateSetting('dataSettings', 'exportFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stockage principal
                </label>
                <select
                  value={settings.dataSettings.storageLocation}
                  onChange={(e) => updateSetting('dataSettings', 'storageLocation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="database">Base de données</option>
                  <option value="local">Stockage local</option>
                  <option value="cloud">Cloud Storage</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>

          <div className="space-y-4">
            {[
              {
                key: 'scrapingComplete',
                title: 'Scraping terminé',
                description: 'Recevoir une notification lorsque le scraping est terminé'
              },
              {
                key: 'errors',
                title: 'Erreurs',
                description: 'Recevoir une notification en cas d\'erreur lors du scraping'
              },
              {
                key: 'dailyReport',
                title: 'Rapport quotidien',
                description: 'Recevoir un résumé quotidien de l\'activité'
              }
            ].map((notification) => (
              <div key={notification.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications[notification.key as keyof typeof settings.notifications]}
                    onChange={(e) => updateSetting('notifications', notification.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Sécurité & Confidentialité</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Journalisation</h4>
                <p className="text-sm text-gray-600">Activer les logs détaillés pour le suivi des activités</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.enableLogs}
                  onChange={(e) => updateSetting('security', 'enableLogs', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rétention des données (jours)
              </label>
              <input
                type="number"
                value={settings.security.dataRetention}
                onChange={(e) => updateSetting('security', 'dataRetention', parseInt(e.target.value))}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">Durée de conservation des données scrapées</p>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">Responsabilité légale</h4>
              <p className="text-sm text-amber-700 mb-4">
                En utilisant cet outil, vous vous engagez à respecter les conditions d'utilisation du site INPI et la législation en vigueur. 
                Assurez-vous de ne pas surcharger les serveurs et d'utiliser les données dans le respect de la vie privée et du RGPD.
              </p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Respectez les robots.txt et les conditions d'utilisation</li>
                <li>• Limitez la fréquence des requêtes</li>
                <li>• Utilisez les données de manière éthique et légale</li>
                <li>• Protégez les données personnelles selon le RGPD</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            Sauvegarder les paramètres
          </button>
        </div>
      </div>
    </div>
  );
};