import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const apiHost = window.location.hostname || 'localhost';
export const API_URL = import.meta.env.VITE_API_URL || `http://${apiHost}:5000/api`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tv_token') || null);
  const [loading, setLoading] = useState(true);

  // Hydrate user profile on load if token exists
  useEffect(() => {
    async function loadUserProfile() {
      const storedToken = localStorage.getItem('tv_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setToken(storedToken);
        } else {
          // Token is invalid or expired — wipe it cleanly
          console.warn('Stored token is invalid, clearing session.');
          localStorage.removeItem('tv_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        localStorage.removeItem('tv_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, []); // Run only once on mount

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('tv_token', data.token);
    setToken(data.token);
    setUser(data.user);
    // Reset notification flag so popup shows on every fresh login
    sessionStorage.removeItem('has_seen_login_notification');
    return data.user;
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    localStorage.setItem('tv_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const googleLogin = async (credential) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Google authentication failed');
    }

    localStorage.setItem('tv_token', data.token);
    setToken(data.token);
    setUser(data.user);
    // Reset notification flag so popup shows on every fresh login
    sessionStorage.removeItem('has_seen_login_notification');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('tv_token');
    // Clear notification flag so popup shows again on next login
    sessionStorage.removeItem('has_seen_login_notification');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    if (!token) return;

    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    if (data.token) {
      localStorage.setItem('tv_token', data.token);
      setToken(data.token);
    }
    setUser(data.user);
    return data.user;
  };

  const forgotPassword = async (email) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Forgot password request failed');
    }
    return data;
  };

  const resetPassword = async (token, newPassword) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Reset password failed');
    }
    return data;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    googleLogin,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    isAdmin: user?.role === 'admin'
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
