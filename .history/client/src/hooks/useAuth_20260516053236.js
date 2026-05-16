// hooks/useAuth.js (partial update)
import useWishlist from './useWishlist';

const useAuth = () => {
  // ... existing auth logic
  const { syncWishlistAfterLogin } = useWishlist();
  
  const login = async (credentials) => {
    // ... existing login logic
    
    if (response.success) {
      // After successful login, sync wishlist
      await syncWishlistAfterLogin();
    }
  };
  
  // ... rest of the hook
};