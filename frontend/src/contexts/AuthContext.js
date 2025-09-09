import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.getProfile();
      console.log('Profile response:', response.data);
      setUser(response.data.user);
    } catch (error) {
      console.error('Profile check error:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
        const response = await authAPI.login(credentials);
        console.log('Full login response:', response.data);
        
        // Debug the token structure
        console.log('Token from backend:', response.data.token);
        console.log('Token type:', typeof response.data.token);
        
        const tokenFromBackend = response.data.token;
        const user = response.data.user;
        
        if (!tokenFromBackend) {
            console.error('No JWT token found in response');
            return { success: false, error: 'No token received' };
        }
        
        // Ensure token is stored as string
        const tokenString = String(tokenFromBackend);
        console.log('Storing token as string:', tokenString.substring(0, 20) + '...');
        console.log('Token segments after conversion:', tokenString.split('.').length);
        
        localStorage.setItem('authToken', tokenString);
        setUser(user);
        return { success: true };
        
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
};



  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};