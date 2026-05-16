// hooks/useWishlist.js
import { useContext, useEffect } from 'react';
import { WishlistContext } from '../context/WishlistContext';
import { useAuth } from './useAuth.jsx';

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

// Alternative: Create a separate hook for wishlist sync
export const useWishlistSync = () => {
  const { syncWishlistAfterLogin } = useWishlist();
  const { registerWishlistSync } = useAuth();

  useEffect(() => {
    // Register the sync function with AuthContext
    if (registerWishlistSync && syncWishlistAfterLogin) {
      registerWishlistSync(syncWishlistAfterLogin);
    }
  }, [registerWishlistSync, syncWishlistAfterLogin]);
};