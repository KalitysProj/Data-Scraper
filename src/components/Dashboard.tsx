import React from 'react';
import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  Database, 
  Download,
  Calendar,
  Building,
  Users,
  Activity,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { apiService, StatsData } from '../services/api';

const colorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500'
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    monthly: 0,
    byDepartment: [],
    byApeCode: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to load real data first
      try {
        const statsData = await apiService.getStats();
        setStats(statsData);
        setConnectionStatus('connected');
      } catch (backendError) {
        // If backend fails, use empty data and set disconnected status
        setStats({
          total: 0,
          monthly: 0,
          byDepartment: [],
          byApeCode: []
        });
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      // Use empty data on any error
      setStats({
        total: 0,
        monthly: 0,
        byDepartment: [],
        byApeCode: []
      });
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getStatsCards = () => {
    return [
      {
        label: 'Total Entreprises',
        value: formatNumber(stats.total),
        change: '+0%',
        changeType: 'neutral' as const,
        icon: Building,
        color: 'blue'
      },
      {
        label: 'Ce mois',
        value: formatNumber(stats.monthly),
        change: '+0%',
        changeType: 'neutral' as const,
        icon: Search,
        color: 'green'
      },
      {
        label: 'Départements',
        value: stats.byDepartment.length.toString(),
        change: '+0%',
        changeType: 'neutral' as const,
        icon: Download,
        color: 'orange'
      },
      {
        label: 'Codes APE',
        value: stats.byApeCode.length.toString(),
        change: '+0%',
        changeType: 'neutral' as const,
        icon: TrendingUp,
        color: 'purple'
      }
    ];
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Vue d'ensemble de vos données INPI</p>
        
        {/* Connection Status */}
        <div className={`mt-4 border rounded-lg p-4 ${
          connectionStatus === 'connected' 
            ? 'bg-green-50 border-green-200' 
            : connectionStatus === 'disconnected'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : connectionStatus === 'disconnected' ? (
              <WifiOff className="w-5 h-5 text-red-600" />
            ) : (
              <Activity className="w-5 h-5 text-yellow-600 animate-spin" />
            )}
            <p className={`text-sm font-medium ${
              connectionStatus === 'connected' 
                ? 'text-green-800' 
                : connectionStatus === 'disconnected'
                ? 'text-red-800'
                : 'text-yellow-800'
            }`}>
              {connectionStatus === 'connected' 
                ? 'Backend connecté - Données réelles disponibles'
                : connectionStatus === 'disconnected'
                ? 'Backend non connecté'
                : 'Vérification de la connexion...'
              }
            </p>
          </div>
          {connectionStatus === 'disconnected' && (
            <p className="text-xs text-red-700 mt-1">
              Assurez-vous que le backend est démarré sur http://localhost:3001
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getStatsCards().map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${colorMap[stat.color as keyof typeof colorMap]} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Activité de scraping</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>30 derniers jours</span>
            </div>
          </div>
          
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Données en temps réel</p>
              <p className="text-sm text-gray-400">Les graphiques seront disponibles avec plus de données</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Répartition par département</h3>
          
          <div className="space-y-4">
            {stats && stats.byDepartment.length > 0 ? (
              stats.byDepartment.slice(0, 5).map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">{dept.department}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Département {dept.department}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {formatNumber(dept.count)} entreprises
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucune donnée disponible</p>
                <p className="text-sm text-gray-400 mt-1">
                  Lancez votre premier scraping pour voir les statistiques
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top APE Codes */}
      {stats && stats.byApeCode.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top codes APE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.byApeCode.slice(0, 6).map((ape, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{ape.ape_code}</p>
                  <p className="text-sm text-gray-600">{formatNumber(ape.count)} entreprises</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};