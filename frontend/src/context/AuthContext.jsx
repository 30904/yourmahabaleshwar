import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOtp, setPendingOtp] = useState(null);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const persistSession = (payload) => {
    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('refreshToken', payload.refreshToken);
    setUser(payload.user);
    setPendingOtp(null);
    return payload.user;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.data?.requiresOtp) {
      setPendingOtp({
        ...data.data,
        purpose: 'LOGIN',
        identifier: data.data.phone || data.data.email,
      });
      return { requiresOtp: true, ...data.data };
    }
    return persistSession(data.data);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    if (data.data?.requiresOtp) {
      setPendingOtp({
        ...data.data,
        purpose: 'SIGNUP',
        identifier: data.data.phone || data.data.email,
      });
      return { requiresOtp: true, ...data.data };
    }
    return persistSession(data.data);
  };

  const sendOtp = async ({ identifier, channel, purpose }) => {
    const { data } = await api.post('/auth/otp/send', { identifier, channel, purpose });
    setPendingOtp((prev) => ({
      ...(prev || {}),
      ...data.data,
      identifier,
      purpose,
      channel,
    }));
    return data.data;
  };

  const verifyOtp = async ({ identifier, code, purpose }) => {
    const { data } = await api.post('/auth/otp/verify', {
      identifier: identifier || pendingOtp?.identifier,
      code,
      purpose: purpose || pendingOtp?.purpose || 'LOGIN',
    });
    return persistSession(data.data);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setPendingOtp(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingOtp,
        setPendingOtp,
        login,
        register,
        sendOtp,
        verifyOtp,
        logout,
        loadUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
