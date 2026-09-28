import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userType, setUserType] = useState(localStorage.getItem('userType'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const authLoaded = useRef(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Set axios header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Load user once on mount
  useEffect(() => {
  if (authLoaded.current) return;

  const storedToken = localStorage.getItem('token');
  const storedType = localStorage.getItem('userType');

  console.log(
    `[AUTH INIT] token=${storedToken ? 'YES(' + storedToken.substring(0, 20) + '...)' : 'NO'} userType=${storedType}`
  );

  if (!storedToken) {
    setLoading(false);
    authLoaded.current = true;
    return;
  }

  const type = storedType || 'therapist';
  const endpoint = type === 'client' ? '/auth/client/me' : '/auth/me';
  const fullUrl = `${API_URL}${endpoint}`;

  console.log(`[AUTH] Fetching: ${fullUrl}`);

  axios.get(fullUrl)
    .then(res => {
      console.log('[AUTH] Success:', JSON.stringify(res.data));
      const data = res.data.client || res.data.therapist;
      setUser({ ...data, userType: type });
      setUserType(type);
    })
    .catch(err => {
      console.log(
        `[AUTH] FAILED status=${err.response?.status} msg=${err.response?.data?.message || err.message}`
      );
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('clientData');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      setUserType(null);
    })
    .finally(() => {
      setLoading(false);
      authLoaded.current = true;
    });
}, [API_URL]);

  const setAuth = (newToken, type, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userType', type);
    if (type === 'client') {
      localStorage.setItem('clientData', JSON.stringify(userData));
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUserType(type);
    setUser({ ...userData, userType: type });
    setLoading(false);
    authLoaded.current = true;
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('clientData');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setUserType(null);
    setLoading(false);
    authLoaded.current = true;
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setAuth(res.data.token, 'therapist', res.data.therapist);
      navigate('/therapist/dashboard', { replace: true });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, data);
      setAuth(res.data.token, 'therapist', res.data.therapist);
      navigate('/therapist/dashboard', { replace: true });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const clientLogin = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/client/login`, { email, password });
      setAuth(res.data.token, 'client', res.data.client);
      navigate('/client/dashboard', { replace: true });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const clientRegister = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/auth/client/register`, data);
      setAuth(res.data.token, 'client', res.data.client);
      navigate('/client/dashboard', { replace: true });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  const value = {
    user,
    token,
    userType,
    loading,
    error,
    login,
    register,
    clientLogin,
    clientRegister,
    logout,
    updateUser,
    // KEY FIX: Only auth is "true" once we have BOTH token AND user
    isAuthenticated: !!token && !!user && !loading,
    isTherapist: userType === 'therapist',
    isClient: userType === 'client'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};