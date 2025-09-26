import React from 'react';
import { 
  BarChart3, 
  Search, 
  Database, 
  Settings, 
  Building2,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';
import { ActiveView } from '../App';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard' as ActiveView, label: 'Dashboard', icon: BarChart3 },
  { id: 'scraper' as ActiveView, label: 'Nouveau Scraping', icon: Search },
  { id: 'data' as ActiveView, label: 'Données', icon: Database },
  { id: 'settings' as ActiveView, label: 'Paramètres', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onLogout }) => {
  const { user } = useAuth();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">INPI Scraper</h1>
            <p className="text-sm text-gray-500">Données d'entreprises</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-blue-600" />}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-3">
        {/* User Info */}
        {user && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                  }
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Plan {user?.subscriptionPlan || 'Free'}
              </p>
              <p className="text-xs text-blue-700">Données réelles</p>
            </div>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">✓</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
};