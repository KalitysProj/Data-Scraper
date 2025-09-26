import React, { createContext, useContext, useState } from 'react';

interface User {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Utilisateur par défaut pour simplifier
  const [user] = useState<User>({
    uid: 'default-user',
    email: 'user@wpanalyzer.com',
    displayName: 'Utilisateur WP Analyzer'
  });
  
  const [loading] = useState(false);

  const value = {
    user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};