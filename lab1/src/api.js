import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let accessToken = localStorage.getItem('accessToken') || '';
let onUnauthorized = null;

export const setAuthToken = (token) => {
  accessToken = token || '';
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const registerUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/refresh')) {
      original._retry = true;
      try {
        const refreshResp = await api.post('/auth/refresh');
        setAuthToken(refreshResp.data.accessToken);
        original.headers.Authorization = `Bearer ${refreshResp.data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        setAuthToken('');
        if (onUnauthorized) {
          onUnauthorized(refreshErr);
        }
      }
    }

    if ((error.response?.status === 401 || error.response?.status === 403) && onUnauthorized) {
      onUnauthorized(error);
    }

    return Promise.reject(error);
  }
);

export default api;
