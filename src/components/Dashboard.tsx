import React from 'react';
import { 
  TrendingUp, 
  Search, 
  Database, 
  Download,
  Calendar,
  Building,
  Users,
  Activity
} from 'lucide-react';

const stats = [
  {
    label: 'Total Entreprises',
    value: '12,847',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: Building,
    color: 'blue'
  },
  {
    label: 'Scraping ce mois',
    value: '1,543',
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: Search,
    color: 'green'
  },
  {
    label: 'Exports réalisés',
    value: '284',
    change: '+15.3%',
    changeType: 'positive' as const,
    icon: Download,
    color: 'orange'
  },
  {
    label: 'Taux de succès',
    value: '96.8%',
    change: '+2.1%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    color: 'purple'
  }
];

const recentActivities = [
  {
    id: 1,
    type: 'scraping',
    description: 'Scraping terminé - Code APE 0121Z, Département 69',
    timestamp: 'Il y a 2 minutes',
    status: 'success',
    count: 157
  },
  {
    id: 2,
    type: 'export',
    description: 'Export CSV généré pour 2,543 entreprises',
    timestamp: 'Il y a 15 minutes',
    status: 'success',
    count: 2543
  },
  {
    id: 3,
    type: 'scraping',
    description: 'Scraping en cours - Code APE 4711A, Département 75',
    timestamp: 'Il y a 32 minutes',
    status: 'pending',
    count: 89
  }
];

const colorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500'
};

export const Dashboard: React.FC = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Vue d'ensemble de vos données INPI</p>
        
        {/* Demo Notice */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">
              Mode Démonstration - Les données affichées sont fictives
            </p>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Pour utiliser de vraies données, connectez votre base de données et configurez le scraper backend
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colorMap[stat.color as keyof typeof colorMap]} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'positive' 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-red-700 bg-red-100'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

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
              <p className="text-gray-500 font-medium">Graphique des performances</p>
              <p className="text-sm text-gray-400">Évolution du nombre de scraping par jour</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Activité récente</h3>
          
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.status === 'success' 
                    ? 'bg-green-100 text-green-600' 
                    : activity.status === 'pending'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {activity.type === 'scraping' ? (
                    <Search className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    <span className="text-xs font-medium text-blue-600">
                      {activity.count} résultats
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};