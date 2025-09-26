import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Shield, Zap, FileText, BarChart3, CheckCircle } from 'lucide-react';

const HomePage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);
  const navigate = useNavigate();

  const validateUrl = (inputUrl: string) => {
    try {
      new URL(inputUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      setIsValidUrl(false);
      return;
    }
    
    // Ajouter automatiquement https:// si pas de protocole
    let finalUrl = trimmedUrl;
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      finalUrl = 'https://' + trimmedUrl;
    }
    
    if (!validateUrl(finalUrl)) {
      setIsValidUrl(false);
      return;
    }

    setIsValidUrl(true);
    navigate(`/first-step-analysis?url=${encodeURIComponent(finalUrl)}`);
  };

  const features = [
    {
      icon: Globe,
      title: 'Scraping Complet',
      description: 'Analyse automatique de toutes les pages du site WordPress'
    },
    {
      icon: Shield,
      title: 'Sécurité & SEO',
      description: 'Vérification complète des balises, structure et sécurité'
    },
    {
      icon: Zap,
      title: 'Performance',
      description: 'Tests de vitesse et optimisation des performances'
    },
    {
      icon: FileText,
      title: 'Formulaires',
      description: 'Test automatisé des formulaires et reCAPTCHA'
    },
    {
      icon: BarChart3,
      title: 'Rapports KPI',
      description: 'Métriques détaillées avec recommandations techniques'
    },
    {
      icon: CheckCircle,
      title: 'Export PDF',
      description: 'Téléchargement des rapports au format PDF'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Analysez votre site{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WordPress
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Audit complet automatisé avec données réelles : SEO, performance, sécurité, liens et formulaires. 
              Obtenez un rapport détaillé basé sur l'analyse réelle de votre site.
            </p>

            {/* URL Input Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-16">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setIsValidUrl(true);
                    }}
                    placeholder="https://votre-site-wordpress.com"
                    className={`w-full px-6 py-4 text-lg border-2 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                      isValidUrl ? 'border-gray-300' : 'border-red-300 bg-red-50'
                    }`}
                    required
                  />
                  {!isValidUrl && (
                    <p className="text-red-600 text-sm mt-2 text-left">
                      Veuillez entrer une URL valide
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Analyser</span>
                </button>
              </div>
            </form>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto mb-12">
              <p className="text-blue-800 text-center">
                <span className="font-semibold">🚀 WP Analyzer Pro</span><br/>
                Analyses illimitées de sites WordPress avec données réelles
              </p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Analyse réelle de votre site
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-blue-100">Points de contrôle SEO</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-blue-100">Automatisé</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">{'< 5min'}</div>
              <div className="text-blue-100">Temps d'analyse</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;