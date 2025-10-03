import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '@/services/api';

export interface User {
  user_id: string;
  name: string;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Always read token from localStorage
  const getToken = () => localStorage.getItem('token');

  const login = async (email: string, password: string) => {
    const response = await apiService.login({ email, password });
    const newToken = response.token;

    localStorage.setItem('token', newToken);
    setToken(newToken);

    await refreshUser(); // will use latest token from localStorage
  };

  const register = async (name: string, email: string, password: string) => {
    await apiService.register({ name, email, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const currentToken = getToken();
      if (!currentToken) return;

      // Make sure apiService.getCurrentUser reads the token from localStorage or pass it explicitly
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      logout();
    }
  };

  useEffect(() => {
    const init = async () => {
      const currentToken = getToken();
      if (currentToken) setToken(currentToken);

      await refreshUser();
      setIsLoading(false);
    };
    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
