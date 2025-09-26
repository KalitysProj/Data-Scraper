import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Scraper } from './components/Scraper';
import { DataManager } from './components/DataManager';
import { Settings } from './components/Settings';

export type ActiveView = 'dashboard' | 'scraper' | 'data' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

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
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 ml-64">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;