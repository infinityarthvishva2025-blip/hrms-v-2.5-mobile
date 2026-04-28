import React, { createContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { login as loginApi, logout as logoutApi, getMe } from '../api/auth.api';
import Toast from 'react-native-toast-message';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = await storage.getAccessToken();
      const userData = await storage.getUserInfo();
      
      if (token && userData) {
        setUser(userData);
        // Silently refresh profile data.
        // If the token is expired, the 'client' interceptor will handle the refresh automatically.
        try {
          const res = await getMe();
          if (res.data?.data) {
            setUser(res.data.data);
            await storage.setUserInfo(res.data.data);
          }
        } catch (err) {
          console.error("Session check failed, possibly expired:", err.message);
          // Only clear session if it's truly unrecoverable (done by interceptor usually)
        }
      } else {
        await storage.clearAll();
      }
    } catch (e) {
      console.error(e);
      await storage.clearAll();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials) => {
    const { data } = await loginApi(credentials);
    const { accessToken, refreshToken, employee } = data.data;

    await storage.setAccessToken(accessToken);
    await storage.setRefreshToken(refreshToken);
    await storage.setUserInfo(employee);

    setUser(employee);
    Toast.show({
      type: 'success',
      text1: 'Login Successful',
      text2: `Welcome back, ${employee.name}`
    });
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error(error);
    } finally {
      await storage.clearAll();
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const { data } = await getMe();
      if (data?.data) {
         setUser(data.data);
         await storage.setUserInfo(data.data);
      }
    } catch (e) {
      console.error("Failed to refresh profile", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
