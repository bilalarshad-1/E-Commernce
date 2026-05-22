import React, { createContext, useState, useContext, useEffect } from 'react';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext({});

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      loadLocalWishlist();
    }
  }, [isAuthenticated]);

  const loadLocalWishlist = () => {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      try {
        setWishlistItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load wishlist:', e);
      }
    }
  };

  const saveLocalWishlist = () => {
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
  };

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await wishlistService.getWishlist();
      setWishlistItems(response.data.data || []);
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product) => {
    if (isAuthenticated) {
      try {
        await wishlistService.addToWishlist(product._id);
        await fetchWishlist();
      } catch (error) {
        console.error('Add to wishlist error:', error);
        toast.error('Failed to add to wishlist');
        return;
      }
    } else {
      if (!wishlistItems.some(item => item._id === product._id)) {
        setWishlistItems(prev => [...prev, product]);
        saveLocalWishlist();
      }
    }
    toast.success('Added to wishlist');
  };

  const removeFromWishlist = async (productId) => {
    if (isAuthenticated) {
      try {
        await wishlistService.removeFromWishlist(productId);
        await fetchWishlist();
      } catch (error) {
        console.error('Remove from wishlist error:', error);
        toast.error('Failed to remove from wishlist');
        return;
      }
    } else {
      setWishlistItems(prev => prev.filter(item => item._id !== productId));
      saveLocalWishlist();
    }
    toast.success('Removed from wishlist');
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item._id === productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      loading,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
};