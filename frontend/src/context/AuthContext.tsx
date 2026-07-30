import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '../types';

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (tokenString: string, role: 'admin' | 'reviewer') => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('access_token');
    if (!stored) return null;
    try {
      const payload = JSON.parse(atob(stored.split('.')[1]));
      return { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      return null;
    }
  });

  const login = useCallback((tokenString: string, role: 'admin' | 'reviewer') => {
    localStorage.setItem('access_token', tokenString);
    setToken(tokenString);
    try {
      const payload = JSON.parse(atob(tokenString.split('.')[1]));
      setUser({ id: payload.sub, email: payload.email, role: payload.role });
    } catch {
      setUser({ email: '', role });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
