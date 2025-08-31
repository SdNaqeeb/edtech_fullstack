import axios from "axios";
import { getErrorMessage } from "../utils/errorHandling";

// Token management utilities
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
const setTokens = (access, refresh) => {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};
const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("username");
  localStorage.removeItem("streakData");
  localStorage.removeItem("rewardData");
  localStorage.removeItem("completedChapters");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: "https://autogen.aieducator.com/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add JWT token to requests
    const token = getAccessToken();
    if (token && !config.url.includes('/api/token/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor with token refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle timeout errors
    if (error.code === "ECONNABORTED") {
      console.error("Request Timeout Error");
      return Promise.reject(new Error("Request timed out. Please try again."));
    }

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry for login or refresh endpoints
      if (originalRequest.url.includes('/api/token/')) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(new Error("No refresh token available"));
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${axiosInstance.defaults.baseURL}api/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access, refresh } = response.data;
        
        // Store new tokens
        if (refresh) {
          setTokens(access, refresh);
        } else {
          localStorage.setItem(TOKEN_KEY, access);
        }

        // Process queued requests with new token
        processQueue(null, access);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorMessage = getErrorMessage(error);
    return Promise.reject(new Error(errorMessage));
  }
);

// Authentication methods
axiosInstance.login = async (username, password) => {
  try {
    const response = await axiosInstance.post('/api/token/', {
      username,
      password
    });
    
    const { access, refresh, username: user, role, email, full_name } = response.data;
    
    // Store tokens and user info
    setTokens(access, refresh);
    localStorage.setItem('username', user);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('fullName', full_name);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

axiosInstance.logout = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    if (refreshToken) {
      // Call logout endpoint to blacklist the token
      await axiosInstance.post('/api/logout/', {
        refresh_token: refreshToken
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear tokens regardless of API call success
    clearTokens();
    window.location.href = "/login";
  }
};

axiosInstance.verifyToken = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await axiosInstance.post('/api/token/verify/', {
      token
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// File Upload Method with JWT
axiosInstance.uploadFile = async (url, formData, progressCallback) => {
  try {
    const response = await axiosInstance.post(url, formData, {
      timeout: 120000,
      onUploadProgress: (progressEvent) => {
        if (progressCallback && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          progressCallback(percentCompleted);
        }
      },
    });
    return response;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      error.friendlyMessage = "Upload timed out. Please try with a smaller image or check your connection.";
    } else if (error.response?.status === 413) {
      error.friendlyMessage = "File too large. Please upload a smaller image.";
    } else {
      error.friendlyMessage = "Error uploading file. Please try again.";
    }
    throw error;
  }
};

export default axiosInstance;