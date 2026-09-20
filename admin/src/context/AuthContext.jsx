import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || null;
  });

  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loadingAuth, setLoadingAuth] = useState(true);

  const logout = useCallback((showToast = true) => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');

    if (showToast) {
      toast.info('Anda telah keluar dari Panel Administrator.');
    }
  }, []);

  // Sync state when global api interceptor detects 401 session expiration
  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setAdminUser(null);
    };
    window.addEventListener('admin-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('admin-auth-expired', handleAuthExpired);
  }, []);

  // Verify stored token on initial load
  useEffect(() => {
    const verifyStoredAuth = async () => {
      const activeToken = token;
      if (!activeToken) {
        setLoadingAuth(false);
        return;
      }

      try {
        const response = await api.get(`/api/user/admin-check`);

        if (response.data.success) {
          setAdminUser(response.data.user);
        } else {
          logout(false);
        }
      } catch (error) {
        console.warn('Session expired or invalid token:', error?.response?.data?.message || error.message);
        if (error.response?.status === 401 || error.response?.status === 403) {
          logout(false);
        }
      } finally {
        setLoadingAuth(false);
      }
    };

    verifyStoredAuth();
  }, [token, logout]);

  const login = async (email, password, rememberMe = true) => {
    try {
      const response = await api.post(`/api/user/admin-login`, {
        email: email.trim(),
        password
      });

      if (response.data.success) {
        const receivedToken = response.data.token;
        const userObj = response.data.user;

        setToken(receivedToken);
        setAdminUser(userObj);

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('adminToken', receivedToken);
        storage.setItem('adminUser', JSON.stringify(userObj));

        // Clear opposite storage
        if (rememberMe) {
          sessionStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminUser');
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }

        toast.success(response.data.message || 'Login berhasil! Selamat datang.');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Login gagal.');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan saat menghubungkan ke server.';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };


  const role = (adminUser?.role === 'admin') ? 'manager' : (adminUser?.role || 'kasir');
  const isManager = role === 'manager' || role === 'admin';
  const isKasir = role === 'kasir' || role === 'kitchen';

  const value = {
    token,
    adminUser,
    role,
    isManager,
    isKasir,
    isAuthenticated: !!token,
    loadingAuth,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
