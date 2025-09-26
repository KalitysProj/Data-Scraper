import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Globe, 
  Calendar, 
  FileText, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Play,
  Eye
} from 'lucide-react';

interface Website {
  id: string;
  url: string;
  domain: string;
  title?: string;
  meta_description?: string;
  page_count: number;
  status: 'discovered' | 'scraped' | 'error';
  discovered_at: string;
}

const DiscoveryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isScraping, setIsScraping] = useState<string | null>(null);
  const [websites, setWebsites] = useState<Website[]>([
    {
      id: '1',
      url: 'https://example-wordpress.com',
      domain: 'example-wordpress.com',
      title: 'Site WordPress Exemple',
      meta_description: 'Un site WordPress d\'exemple pour démonstration',
      page_count: 15,
      status: 'scraped',
      discovered_at: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user) return;

    setIsDiscovering(true);
    setError('');

    try {
      // Valider l'URL
      const urlObj = new URL(url);
      
      // Simuler la découverte
      const newWebsite: Website = {
        id: Date.now().toString(),
        url,
        domain: urlObj.hostname,
        title: `Site découvert - ${urlObj.hostname}`,
        meta_description: 'Site WordPress découvert automatiquement',
        page_count: Math.floor(Math.random() * 50) + 5,
        status: 'discovered',
        discovered_at: new Date().toISOString()
      };
      
      setWebsites(prev => [newWebsite, ...prev]);
      setUrl('');
      
    } catch (error) {
      console.error('Erreur découverte:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la découverte');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleFullScraping = async (websiteId: string) => {

    setIsScraping(websiteId);
    setError('');

    try {
      // Simuler le scraping
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setWebsites(prev => prev.map(site => 
        site.id === websiteId 
          ? { ...site, status: 'scraped', page_count: Math.floor(Math.random() * 100) + 20 }
          : site
      ));
    } catch (error) {
      console.error('Erreur scraping:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du scraping');
    } finally {
      setIsScraping(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'discovered':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'scraped':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'discovered':
        return 'Découvert';
      case 'scraped':
        return 'Scrapé';
      case 'error':
        return 'Erreur';
      default:
        return 'Inconnu';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'discovered':
        return 'text-yellow-600 bg-yellow-100';
      case 'scraped':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Découverte de Sites</h1>
          <p className="text-gray-600 mt-2">
            Découvrez et scrapez des sites WordPress pour analyse détaillée
          </p>
        </div>

        {/* Discovery Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Découvrir un Nouveau Site
          </h2>
          
          <form onSubmit={handleDiscover} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://votre-site-wordpress.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isDiscovering}
              />
            </div>
            <button
              type="submit"
              disabled={isDiscovering}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isDiscovering ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{isDiscovering ? 'Découverte...' : 'Découvrir'}</span>
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Websites List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Sites Découverts ({websites.length})
            </h3>
          </div>

          {websites.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun site découvert</h3>
              <p className="text-gray-600">Commencez par découvrir votre premier site WordPress</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Site Web
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Découvert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {websites.map((website) => (
                    <tr key={website.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {website.title || website.domain}
                            </div>
                            <div className="text-sm text-gray-500">
                              {website.url}
                            </div>
                            {website.meta_description && (
                              <div className="text-xs text-gray-400 mt-1 max-w-md truncate">
                                {website.meta_description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(website.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(website.status)}`}>
                            {getStatusText(website.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span>{website.page_count}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(website.discovered_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {website.status === 'discovered' && (
                            <button
                              onClick={() => handleFullScraping(website.id)}
                              disabled={isScraping === website.id}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1 disabled:opacity-50"
                            >
                              {isScraping === website.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                              <span>{isScraping === website.id ? 'Scraping...' : 'Scraper'}</span>
                            </button>
                          )}
                          
                          {website.status === 'scraped' && (
                            <button
                              onClick={() => navigate(`/seo-analysis/${website.id}`)}
                              className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>SEO</span>
                            </button>
                          )}
                          
                          {website.status === 'scraped' && (
                            <button
                              onClick={() => navigate(`/analysis-selection/${website.id}`)}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              <Play className="w-4 h-4" />
                              <span>Analyse</span>
                            </button>
                          )}
                          
                          <a
                            href={website.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Voir</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">
            🔍 Comment ça fonctionne ?
          </h4>
          <div className="text-blue-800 space-y-2">
            <p><strong>1. Découverte :</strong> Analyse rapide du site et extraction des URLs principales</p>
            <p><strong>2. Scraping :</strong> Récupération complète de toutes les pages et métadonnées</p>
            <p><strong>3. Analyse :</strong> Sélection des modules d'analyse à exécuter (SEO, Performance, etc.)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPage;