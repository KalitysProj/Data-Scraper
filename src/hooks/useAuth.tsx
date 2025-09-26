import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionPlan: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au démarrage
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Tenter de récupérer le profil utilisateur
          const response = await fetch('http://localhost:3001/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setUser(data.user);
            } else {
              // Token invalide, le supprimer
              localStorage.removeItem('auth_token');
            }
          } else {
            // Token invalide, le supprimer
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          // Erreur de connexion, garder le token mais pas d'utilisateur
          console.warn('Impossible de vérifier l\'authentification:', error);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Try to login with backend first
      try {
        const { user: userData } = await apiService.login(email, password);
        setUser(userData);
        localStorage.removeItem('demo_mode');
      } catch (backendError) {
        // If backend fails, use demo mode
        const demoUser = {
          id: 'demo-user',
          email: email,
          firstName: 'Demo',
          lastName: 'User',
          subscriptionPlan: 'free'
        };
        setUser(demoUser);
        localStorage.setItem('demo_mode', 'true');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: { email: string; password: string; firstName?: string; lastName?: string }) => {
    try {
      // Try to register with backend first
      try {
        const { user: newUser } = await apiService.register(userData);
        setUser(newUser);
        localStorage.removeItem('demo_mode');
      } catch (backendError) {
        // If backend fails, use demo mode
        const demoUser = {
          id: 'demo-user',
          email: userData.email,
          firstName: userData.firstName || 'Demo',
          lastName: userData.lastName || 'User',
          subscriptionPlan: 'free'
        };
        setUser(demoUser);
        localStorage.setItem('demo_mode', 'true');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    localStorage.removeItem('demo_mode');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};