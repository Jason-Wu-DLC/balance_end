import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check if the user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          // Get user info with the token
          const response = await axios.get('/api/user-info/', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setUser(response.data);
        } catch (error) {
          // If the token is invalid, clear it
          console.error('Authentication error:', error);
          localStorage.removeItem('authToken');
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = (token, userData) => {
    localStorage.setItem('authToken', token);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    setUser(userData);
    return true;
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem('authToken') !== null;
  };
  
  // Context values to provide
  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;