import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  googleLoginUser,
  googleRegisterUser,
  logoutUser,
  updateUserProfile,
  uploadAvatarApi,
  deleteAvatarApi,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check current session on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCurrentUser();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 simply means guest/unauthenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await loginUser({ email, password });
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Register handler
  const register = async (formData) => {
    setError(null);
    try {
      const res = await registerUser(formData);
      const registeredUser = res.user || res.data;
      if (res.success && registeredUser) {
        setUser(registeredUser);
        return { success: true, user: registeredUser, message: res.message };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Google Login handler (sign-in only)
  const googleLogin = async (credential) => {
    setError(null);
    try {
      const res = await googleLoginUser(credential);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Google login failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google login failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Google Register handler (create account only)
  const googleRegister = async (credential, role, extraData) => {
    setError(null);
    try {
      const res = await googleRegisterUser(credential, role, extraData);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Google registration failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google registration failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setUser(null);
    }
  };

  // Update Profile handler
  const updateProfile = async (data) => {
    setError(null);
    try {
      const res = await updateUserProfile(data);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user, message: res.message };
      }
      return { success: false, message: res.message || 'Profile update failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Profile update failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Upload Avatar handler
  const uploadAvatar = async (file) => {
    setError(null);
    try {
      const res = await uploadAvatarApi(file);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user, avatar: res.avatar, message: res.message };
      }
      return { success: false, message: res.message || 'Avatar upload failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Avatar upload failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Remove Avatar handler
  const removeAvatar = async () => {
    setError(null);
    try {
      const res = await deleteAvatarApi();
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user, message: res.message };
      }
      return { success: false, message: res.message || 'Avatar removal failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Avatar removal failed';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    register,
    googleLogin,
    googleRegister,
    logout,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    refreshUser,
    isAuthenticated: !!user,
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
