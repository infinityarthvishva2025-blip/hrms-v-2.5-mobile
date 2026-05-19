import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '../utils/storage';
import { login as loginApi, logout as logoutApi, getMe } from '../api/auth.api';
import client, { setSessionExpiredHandler } from '../api/client';
import Toast from 'react-native-toast-message';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tracks the ID of the in-flight background session check.
  // Setting it to null cancels the check before it can mutate state.
  const bgCheckIdRef = useRef(null);

  // Register a handler so the axios interceptor can call setUser(null)
  // when a refresh token rotation fails (keeps React state in sync).
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = await storage.getAccessToken();
      const userData = await storage.getUserInfo();

      if (token && userData) {
        setUser(userData);
        // Show the dashboard immediately from cache, then silently validate.
        setLoading(false);

        // Stamp this check so login() can cancel it.
        const checkId = Symbol();
        bgCheckIdRef.current = checkId;

        try {
          // _skipRefresh: true prevents the 401 interceptor from attempting
          // a token rotation here, which would race with a concurrent login().
          const res = await client.get('/auth/me', { _skipRefresh: true });

          // Only update state if this check hasn't been cancelled by login().
          if (bgCheckIdRef.current === checkId && res.data?.data) {
            setUser(res.data.data);
            await storage.setUserInfo(res.data.data);
          }
        } catch (err) {
          // Token is expired/invalid. The _skipRefresh flag means the interceptor
          // will NOT try to rotate tokens here — it just rejects silently.
          // The user will need to log in again; their state is cleared by the
          // session-expired handler if the refresh had already been attempted.
          if (bgCheckIdRef.current === checkId) {
            await storage.clearAll();
            setUser(null);
          }
        }
      } else {
        await storage.clearAll();
        setLoading(false);
      }
    } catch (e) {
      console.error('initAuth error:', e);
      await storage.clearAll();
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials) => {
    // Cancel any in-flight background session check.
    // This prevents the background getMe()'s 401 from racing with
    // the fresh tokens we're about to receive and store.
    bgCheckIdRef.current = null;

    const { data } = await loginApi(credentials);
    const { accessToken, refreshToken, employee } = data.data;

    await storage.setAccessToken(accessToken);
    await storage.setRefreshToken(refreshToken);
    await storage.setUserInfo(employee);

    setUser(employee);
    Toast.show({
      type: 'success',
      text1: 'Login Successful',
      text2: `Welcome back, ${employee.name}`,
    });
  };

  const logout = async () => {
    bgCheckIdRef.current = null;
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API error:', error);
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
      console.error('Failed to refresh profile', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
