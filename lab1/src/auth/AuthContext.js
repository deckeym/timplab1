import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { registerUnauthorizedHandler, setAuthToken } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
      setAuthToken('');
    });

    const bootstrap = async () => {
      try {
        const response = await api.get('/auth/validate');
        setUser(response.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const register = async ({ username, email, password }) => {
    await api.post('/auth/register', { username, email, password });
  };

  const login = async ({ username, password }) => {
    const response = await api.post('/auth/login', { username, password });
    setAuthToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Игнорируем сетевые ошибки на выходе
    }
    setAuthToken('');
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    register,
    login,
    logout
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
