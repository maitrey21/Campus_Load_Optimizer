import { createContext, useContext, useState, useEffect } from 'react';
import api from '../apis/api'
import { mockData } from '../services/mockData';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { token } = api.getTokens();
      if (token) {
        // Verify with backend via API (encapsulates refresh logic)
        const response = await api.getCurrentUser();
        if (response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
        } else {
          throw new Error('Invalid user data');
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      api.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      const { user: userData } = response;
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email, password, name, role) => {
    try {
      const response = await api.signup(email, password, name, role);
      // Backend might return token immediately or require email confirmation
      if (response.token && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
      }
      return response; // Pass through mostly for email confirmation message
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      api.clearAuth();
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};