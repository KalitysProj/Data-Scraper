import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Scraper } from './components/Scraper';
import { DataManager } from './components/DataManager';
import { Settings } from './components/Settings';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';

export type ActiveView = 'dashboard' | 'scraper' | 'data' | 'settings';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, login, register, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      await login(email, password);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (userData: { email: string; password: string; firstName?: string; lastName?: string }) => {
    setAuthLoading(true);
    try {
      await register(userData);
    } finally {
      setAuthLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode === 'login') {
      return (
        <LoginForm
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthMode('register')}
          isLoading={authLoading}
        />
      );
    } else {
      return (
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthMode('login')}
          isLoading={authLoading}
        />
      );
    }
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'scraper':
        return <Scraper />;
      case 'data':
        return <DataManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={logout} />
      <main className="flex-1 ml-64">
        {renderActiveView()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;