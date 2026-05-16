// context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useWishlist } from '../hooks/useWishlist';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('customerToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // We'll get wishlist functions from the hook, but need to avoid circular dependency
  // Instead, we'll use a ref to store the sync function
  const [wishlistSync, setWishlistSync] = useState(null);

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data.data);
      setIsAuthenticated(true);
      
      // Sync wishlist after user is loaded
      if (wishlistSync) {
        await wishlistSync();
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      const { token, customer } = response.data;
      
      localStorage.setItem('customerToken', token);
      localStorage.setItem('customer', JSON.stringify(customer));
      
      setToken(token);
      setUser(customer);
      setIsAuthenticated(true);
      
      // Sync wishlist after successful login
      if (wishlistSync) {
        await wishlistSync();
      }
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { token, customer } = response.data;
      
      localStorage.setItem('customerToken', token);
      localStorage.setItem('customer', JSON.stringify(customer));
      
      setToken(token);
      setUser(customer);
      setIsAuthenticated(true);
      
      // Sync wishlist after successful registration
      if (wishlistSync) {
        await wishlistSync();
      }
      
      toast.success('Registration successful! Please verify your email.');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authService.updateProfile(data);
      setUser(response.data.data);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
      return false;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password change failed');
      return false;
    }
  };

  const uploadProfileImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await authService.uploadProfileImage(formData);
      setUser(prev => ({ ...prev, profileImage: response.data.data }));
      toast.success('Profile image updated');
      return true;
    } catch (error) {
      toast.error('Image upload failed');
      return false;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email);
      toast.success('Password reset email sent');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
      return false;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      return false;
    }
  };

  const verifyEmail = async (token) => {
    try {
      await authService.verifyEmail(token);
      toast.success('Email verified successfully');
      await loadUser();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify email');
      return false;
    }
  };

  const resendVerification = async (email) => {
    try {
      await authService.resendVerification(email);
      toast.success('Verification email sent');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
      return false;
    }
  };

  // Address Management
  const addAddress = async (address) => {
    try {
      const response = await authService.addAddress(address);
      setUser(prev => ({ ...prev, addresses: response.data.data }));
      toast.success('Address added successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address');
      return false;
    }
  };

  const updateAddress = async (addressId, address) => {
    try {
      const response = await authService.updateAddress(addressId, address);
      setUser(prev => ({ ...prev, addresses: response.data.data }));
      toast.success('Address updated successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update address');
      return false;
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const response = await authService.deleteAddress(addressId);
      setUser(prev => ({ ...prev, addresses: response.data.data }));
      toast.success('Address deleted successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
      return false;
    }
  };

  const getDefaultAddress = () => {
    return user?.addresses?.find(addr => addr.isDefault) || user?.addresses?.[0];
  };

  // Stats
  const getStats = async () => {
    try {
      const response = await authService.getStats();
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  };

  // Role and permission checks
  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return false;
  };

  const isEmailVerified = () => {
    return user?.isEmailVerified || false;
  };

  const isAccountActive = () => {
    return user?.isActive !== false;
  };

  // Register wishlist sync function
  const registerWishlistSync = (syncFunction) => {
    setWishlistSync(() => syncFunction);
  };

  const value = {
    user,
    loading,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    uploadProfileImage,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress,
    getStats,
    hasRole,
    isEmailVerified,
    isAccountActive,
    registerWishlistSync,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};