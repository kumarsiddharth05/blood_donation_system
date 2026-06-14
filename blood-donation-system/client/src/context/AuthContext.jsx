import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);   // decoded JWT payload
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);   // true while hydrating from storage

  // Hydrate auth state from localStorage on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        // Check if token has expired
        const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
        if (isExpired) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setToken(storedToken);
          setUser(decoded);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /**
   * login — call after a successful POST /api/auth/login
   * @param {string} rawToken - the JWT string
   * @param {object} userData  - the user object from the API response
   */
  const login = useCallback((rawToken, userData) => {
    localStorage.setItem('token', rawToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(rawToken);
    setUser(userData);
  }, []);

  /**
   * logout — clears auth state and redirects to /login
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — custom hook for consuming AuthContext
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};

export default AuthContext;
