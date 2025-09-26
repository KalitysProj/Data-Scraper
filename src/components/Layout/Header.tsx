import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, Globe, BarChart3 } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">WP Analyzer</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </Link>
            <Link to="/discovery" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Globe className="w-4 h-4" />
              <span>Découverte</span>
            </Link>
            <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
              <BarChart3 className="w-4 h-4" />
              <span>Tableau de Bord</span>
            </Link>
          </nav>

          <div className="flex items-center">
            <span className="text-sm text-gray-600">WP Analyzer Pro</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;