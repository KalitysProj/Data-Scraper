import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AnalysisResult } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  FileText, Calendar, TrendingUp, AlertCircle, ExternalLink, Search, 
  History, User, Globe, Award, Clock, Filter, ChevronDown, ChevronUp, 
  Eye, Download, RefreshCw, BarChart3, Target, Shield, Zap
} from 'lucide-react';

// Configuration centralisée pour optimiser la maintenance
const DASHBOARD_CONFIG = {
  PAGINATION: {
    ITEMS_PER_PAGE: 10,
    MAX_PAGES_SHOWN: 5
  },
  CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutes
    REFRESH_INTERVAL: 30 * 1000 // 30 secondes
  },
  STATUS: {
    COLORS: {
      completed: 'text-green-600 bg-green-100',
      running: 'text-blue-600 bg-blue-100',
      failed: 'text-red-600 bg-red-100',
      pending: 'text-gray-600 bg-gray-100'
    },
    TEXT: {
      completed: 'Terminé',
      running: 'En cours',
      failed: 'Échec',
      pending: 'En attente'
    }
  },
  SCORE: {
    COLORS: {
      excellent: { threshold: 80, class: 'text-green-600' },
      good: { threshold: 60, class: 'text-orange-600' },
      poor: { threshold: 0, class: 'text-red-600' }
    }
  }
} as const;

interface AnalysisHistoryItem {
  id: string;
  analysis_date: string;
  website_url: string;
  website_domain: string;
  website_title: string;
  overall_score: number;
  user_email: string;
  session_name: string;
  modules_completed: string[];
  duration_seconds: number;
  status: string;
}

interface DashboardStats {
  totalAnalyses: number;
  averageSeoScore: number;
  totalIssues: number;
  lastAnalysis: Date | null;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // États optimisés avec types stricts
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'url'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalyses: 0,
    averageSeoScore: 0,
    totalIssues: 0,
    lastAnalysis: null
  });

  // Calculs mémorisés pour optimiser les performances
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = analysisHistory;
    
    // Filtrage
    if (historyFilter !== 'all') {
      filtered = filtered.filter(item => item.status === historyFilter);
    }
    
    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.analysis_date).getTime() - new Date(b.analysis_date).getTime();
          break;
        case 'score':
          comparison = a.overall_score - b.overall_score;
          break;
        case 'url':
          comparison = a.website_domain.localeCompare(b.website_domain);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [analysisHistory, historyFilter, sortBy, sortOrder]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * DASHBOARD_CONFIG.PAGINATION.ITEMS_PER_PAGE;
    const endIndex = startIndex + DASHBOARD_CONFIG.PAGINATION.ITEMS_PER_PAGE;
    return {
      items: filteredAndSortedHistory.slice(startIndex, endIndex),
      totalItems: filteredAndSortedHistory.length,
      totalPages: Math.ceil(filteredAndSortedHistory.length / DASHBOARD_CONFIG.PAGINATION.ITEMS_PER_PAGE)
    };
  }, [filteredAndSortedHistory, currentPage]);

  const chartData = useMemo(() => {
    return analyses
      .filter(a => a.status === 'completed' && a.results)
      .slice(-6)
      .map(analysis => ({
        name: new URL(analysis.url).hostname,
        seo: analysis.results?.seo.score || 0,
        performance: analysis.results?.performance.score || 0,
        accessibility: analysis.results?.accessibility.score || 0
      }));
  }, [analyses]);

  useEffect(() => {
    // Charger les données initiales
    loadInitialData();
    
    // Actualisation automatique
    const interval = setInterval(loadAnalysisHistory, DASHBOARD_CONFIG.CACHE.REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Réinitialiser la pagination lors du changement de filtre
    setCurrentPage(1);
  }, [historyFilter, sortBy, sortOrder]);

  const loadInitialData = async () => {
    // Charger les analyses depuis localStorage
    const savedAnalyses = localStorage.getItem('wp-analyzer-analyses');
    if (savedAnalyses) {
      try {
        const parsed = JSON.parse(savedAnalyses);
        setAnalyses(parsed);
        calculateStats(parsed);
      } catch (error) {
        console.error('Erreur parsing analyses:', error);
      }
    }
    
    // Charger l'historique
    if (user) {
      await loadAnalysisHistory();
    }
  };

  const loadAnalysisHistory = async () => {
    if (!user) return;
    
    // Vérifier si Supabase est configuré
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase non configuré - historique indisponible');
      setHistoryLoading(false);
      return;
    }
    
    try {
      setHistoryLoading(true);
      
      // Requête optimisée avec limitation
      const { data, error } = await supabase
        .from('analysis_sessions')
        .select(`
          id,
          session_name,
          started_at,
          completed_at,
          duration_seconds,
          status,
          overall_score,
          modules_completed,
          websites (
            url,
            domain,
            title
          )
        `)
        .eq('user_id', user.uid)
        .order('started_at', { ascending: false })
        .limit(100); // Limitation pour les performances
      
      if (error) throw error;
      
      const historyItems: AnalysisHistoryItem[] = (data || []).map(session => ({
        id: session.id,
        analysis_date: session.started_at,
        website_url: session.websites?.url || '',
        website_domain: session.websites?.domain || '',
        website_title: session.websites?.title || session.websites?.domain || '',
        overall_score: session.overall_score || 0,
        user_email: user.email || '',
        session_name: session.session_name,
        modules_completed: session.modules_completed || [],
        duration_seconds: session.duration_seconds || 0,
        status: session.status
      }));
      
      setAnalysisHistory(historyItems);
      
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const calculateStats = (userAnalyses: AnalysisResult[]) => {
    const completedAnalyses = userAnalyses.filter(a => a.status === 'completed' && a.results);
    const totalAnalyses = completedAnalyses.length;
    const averageSeoScore = completedAnalyses.length > 0 
      ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.results?.seo.score || 0), 0) / completedAnalyses.length)
      : 0;
    const totalIssues = completedAnalyses.reduce((sum, a) => 
      sum + (a.results?.seo.issues.length || 0) + (a.results?.accessibility.issues.length || 0), 0
    );
    const lastAnalysis = userAnalyses.length > 0 
      ? new Date(Math.max(...userAnalyses.map(a => a.timestamp)))
      : null;

    setStats({
      totalAnalyses,
      averageSeoScore,
      totalIssues,
      lastAnalysis
    });
  };

  // Fonctions utilitaires optimisées
  const getStatusColor = (status: string) => 
    DASHBOARD_CONFIG.STATUS.COLORS[status as keyof typeof DASHBOARD_CONFIG.STATUS.COLORS] || DASHBOARD_CONFIG.STATUS.COLORS.pending;

  const getStatusText = (status: string) => 
    DASHBOARD_CONFIG.STATUS.TEXT[status as keyof typeof DASHBOARD_CONFIG.STATUS.TEXT] || 'Inconnu';

  const getScoreColor = (score: number) => {
    const { excellent, good, poor } = DASHBOARD_CONFIG.SCORE.COLORS;
    if (score >= excellent.threshold) return excellent.class;
    if (score >= good.threshold) return good.class;
    return poor.class;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderPagination = () => {
    if (paginatedHistory.totalPages <= 1) return null;

    const { totalPages } = paginatedHistory;
    const maxPagesToShow = DASHBOARD_CONFIG.PAGINATION.MAX_PAGES_SHOWN;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return (
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Affichage de {((currentPage - 1) * DASHBOARD_CONFIG.PAGINATION.ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * DASHBOARD_CONFIG.PAGINATION.ITEMS_PER_PAGE, paginatedHistory.totalItems)} sur {paginatedHistory.totalItems} analyses
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                const pageNum = startPage + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-2">
            Bienvenue {user?.displayName || user?.email}
          </p>
        </div>

        {/* Stats Cards Optimisées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAnalyses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Score SEO Moyen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageSeoScore}/100</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Issues Détectées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dernière Analyse</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.lastAnalysis ? stats.lastAnalysis.toLocaleDateString('fr-FR') : 'Aucune'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Optimisé */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Scores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="seo" fill="#3B82F6" name="SEO" />
                <Bar dataKey="performance" fill="#10B981" name="Performance" />
                <Bar dataKey="accessibility" fill="#F59E0B" name="Accessibilité" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Historique Complet Optimisé */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <History className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Historique Complet des Analyses
                </h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {analysisHistory.length} analyse{analysisHistory.length > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={loadAnalysisHistory}
                disabled={historyLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {historyLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Filtres Optimisés */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">Statut:</label>
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Toutes les analyses</option>
                    <option value="completed">Terminées</option>
                    <option value="failed">Échouées</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Trier par:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Date d'analyse</option>
                    <option value="score">Score global</option>
                    <option value="url">Site web</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                    title={`Tri ${sortOrder === 'desc' ? 'décroissant' : 'croissant'}`}
                  >
                    {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  {filteredAndSortedHistory.filter(item => item.status === 'completed').length} terminées
                </span>
                <span>•</span>
                <span>
                  {filteredAndSortedHistory.filter(item => item.status === 'failed').length} échouées
                </span>
              </div>
            </div>
          </div>

          {/* Table Optimisée */}
          <div className="overflow-x-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Chargement de l'historique...</span>
              </div>
            ) : paginatedHistory.items.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune analyse trouvée</h3>
                <p className="text-gray-600 mb-4">
                  {historyFilter === 'all' 
                    ? 'Aucune analyse n\'a encore été effectuée'
                    : `Aucune analyse avec le statut "${historyFilter === 'completed' ? 'terminée' : 'échouée'}" trouvée`
                  }
                </p>
                <Link
                  to="/"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Commencer une analyse</span>
                </Link>
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Date d'Analyse
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                        Site Analysé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Score Global
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Durée
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedHistory.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(item.analysis_date).toLocaleDateString('fr-FR')}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(item.analysis_date).toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 text-blue-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.website_title || item.website_domain}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.website_domain}
                              </div>
                              <div className="text-xs text-blue-600 truncate">
                                {item.session_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <Award className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getScoreColor(item.overall_score)}`}>
                                {item.overall_score}
                              </div>
                              <div className="text-xs text-gray-500">/100</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.user_email}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.modules_completed.length} module{item.modules_completed.length > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {formatDuration(item.duration_seconds)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {item.status === 'completed' ? (
                              <>
                                <Link
                                  to={`/report/${item.id}`}
                                  className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                  title="Voir le rapport complet"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => {/* TODO: Export PDF */}}
                                  className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                  title="Télécharger le rapport PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </>
                            ) : item.status === 'running' ? (
                              <Link
                                to={`/analysis-progress/${item.id}`}
                                className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                                title="Suivre l'analyse en cours"
                              >
                                <Clock className="w-4 h-4" />
                              </Link>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {renderPagination()}
              </>
            )}
          </div>
        </div>

        {/* Analyses Récentes Optimisées */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Analyses Récentes</h3>
              <Link
                to="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Nouvelle Analyse</span>
              </Link>
            </div>
          </div>

          {analyses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune analyse</h3>
              <p className="text-gray-600 mb-4">Commencez par analyser votre premier site WordPress</p>
              <Link
                to="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Commencer une analyse</span>
              </Link>
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
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score SEO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyses.slice(0, 5).map((analysis) => (
                    <tr key={analysis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Search className="w-5 h-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {new URL(analysis.url).hostname}
                            </div>
                            <div className="text-sm text-gray-500">
                              {analysis.url}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(analysis.timestamp).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(analysis.status)}`}>
                          {getStatusText(analysis.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {analysis.results?.seo.score ? `${analysis.results.seo.score}/100` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {analysis.status === 'completed' ? (
                          <Link
                            to={`/report/${analysis.id}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Voir le rapport</span>
                          </Link>
                        ) : analysis.status === 'running' ? (
                          <Link
                            to={`/analysis?url=${encodeURIComponent(analysis.url)}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Suivre
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;