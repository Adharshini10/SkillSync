import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  isAuthenticated as checkAuth,
} from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => checkAuth());

  useEffect(() => {
    const currentToken = getToken();
    const currentUser = getUser();
    setToken(currentToken);
    setUser(currentUser);
    setIsAuthenticated(Boolean(currentToken));
  }, []);

  /**
   * Log in user: stores token & user info in localStorage and state.
   */
  const login = (jwtToken, userInfo = null) => {
    saveToken(jwtToken);
    if (userInfo) {
      saveUser(userInfo);
    }
    setToken(jwtToken);
    setUser(userInfo);
    setIsAuthenticated(true);
  };

  /**
   * Log out user: clears localStorage and state.
   */
  const logout = () => {
    removeToken();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
