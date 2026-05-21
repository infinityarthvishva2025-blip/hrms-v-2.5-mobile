import axios from 'axios';
import { storage } from '../utils/storage';
import Toast from 'react-native-toast-message';
import config from '../constants/config';

const client = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000, // 8s timeout to prevent hanging connections
});

// ─── HIGH-PERFORMANCE CACHE MEMORY ───────────────────────────────────────────
const getCache = new Map();
const CACHE_TTL = 7000; // 7 seconds in-memory cache TTL for GET requests

// Periodically clean up expired cache nodes to free memory
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of getCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      getCache.delete(key);
    }
  }
}, 30000);

// ─── Session Expired Callback ─────────────────────────────────────────────────
let _onSessionExpired = null;
export const setSessionExpiredHandler = (handler) => {
  _onSessionExpired = handler;
};

// ─── Request Interceptor: Attach Token, Caching & Deduplication ───────────────
client.interceptors.request.use(async (reqConfig) => {
  // 1. Attach Access Token
  const token = await storage.getAccessToken();
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Perform Performance GET Caching
  const method = reqConfig.method?.toLowerCase();
  if (method === 'get' && !reqConfig._bypassCache) {
    const cacheKey = reqConfig.url + JSON.stringify(reqConfig.params || {});

    // A. Check for cache hits
    const cached = getCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      // Return cached results instantly
      reqConfig.adapter = () => Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: reqConfig.headers,
        config: reqConfig,
      });
      return reqConfig;
    }
  }

  return reqConfig;
});

// ─── Response Interceptor: Caching, Auto-Retry & Token Refresh ───────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper for waiting during exponential backoff retries
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

client.interceptors.response.use(
  (response) => {
    const reqConfig = response.config;
    const method = reqConfig.method?.toLowerCase();

    // 1. Cache successful GET responses
    if (method === 'get' && !reqConfig._bypassCache && !response.headers['x-from-cache']) {
      const cacheKey = reqConfig.url + JSON.stringify(reqConfig.params || {});
      getCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // Reject immediately for login/refresh requests
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (originalRequest._skipRefresh) {
      return Promise.reject(error);
    }
    
    const method = originalRequest.method?.toLowerCase();

    // A. AUTOMATIC SILENT RETRY: Safe GET requests retry dynamically on network drop or 5xx
    const isNetworkError = !error.response || (error.response.status >= 500 && error.response.status <= 599);
    if (method === 'get' && isNetworkError) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount++;
        const backoffDelay = originalRequest._retryCount * 1000;
        console.warn(`[API Client] Network failure. Retrying ${originalRequest.url} (Attempt ${originalRequest._retryCount}/3) in ${backoffDelay}ms...`);
        await wait(backoffDelay);
        return client(originalRequest);
      }
    }

    // B. AUTH TOKEN ROTATION: Handle 401 Session refreshes
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(`${config.API_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        await storage.setAccessToken(newAccessToken);
        if (newRefreshToken) {
          await storage.setRefreshToken(newRefreshToken);
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await storage.clearAll();

        if (_onSessionExpired) _onSessionExpired();

        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please log in again.',
        });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
