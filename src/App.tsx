import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Layout/Header';
import HomePage from './components/Home/HomePage';
import DiscoveryPage from './components/Discovery/DiscoveryPage';
import Dashboard from './components/Dashboard/Dashboard';
import AnalysisPage from './components/Analysis/AnalysisPage';
import ReportPage from './components/Report/ReportPage';
import AnalysisSelectionPage from './components/AnalysisSelection/AnalysisSelectionPage';
import AnalysisProgressPage from './components/AnalysisProgress/AnalysisProgressPage';
import SEOAnalysisPage from './components/Analysis/SEOAnalysisPage';
import FirstStepAnalysisPage from './components/Analysis/FirstStepAnalysisPage';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/discovery" element={<DiscoveryPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/first-step-analysis" element={<FirstStepAnalysisPage />} />
            <Route path="/analysis-selection/:websiteId" element={<AnalysisSelectionPage />} />
            <Route path="/analysis-progress/:sessionId" element={<AnalysisProgressPage />} />
            <Route path="/seo-analysis/:websiteId" element={<SEOAnalysisPage />} />
            <Route path="/report/:id" element={<ReportPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;