import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext({});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      loadLocalCart();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && cartItems.length > 0) {
      saveLocalCart();
    }
    updateSummary();
  }, [cartItems]);

  const loadLocalCart = () => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
  };

  const saveLocalCart = () => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartService.getCart();
      setCartItems(response.data.data || []);
    } catch (error) {
      console.error('Fetch cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSummary = () => {
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartCount(count);
    setCartTotal(total);
  };

  const addToCart = async (product, quantity = 1, variation = null, color = null) => {
    const itemKey = `${product._id}-${variation?._id || ''}-${color?._id || ''}`;
    const existingItem = cartItems.find(item => item.cartKey === itemKey);

    if (existingItem) {
      updateQuantity(itemKey, existingItem.quantity + quantity);
      return;
    }

    const newItem = {
      cartKey: itemKey,
      productId: product._id,
      name: product.productName,
      price: variation?.price || color?.price || product.price,
      image: product.mainImage?.url || 'https://via.placeholder.com/100',
      quantity,
      variation: variation ? { id: variation._id, name: variation.name } : null,
      color: color ? { id: color._id, name: color.name, code: color.code } : null,
      inStock: variation?.stock || product.inventory?.currentStock || 999
    };

    if (isAuthenticated) {
      try {
        await cartService.addToCart(newItem);
        await fetchCart();
      } catch (error) {
        console.error('Add to cart error:', error);
        toast.error('Failed to add to cart');
        return;
      }
    } else {
      setCartItems(prev => [...prev, newItem]);
    }
    toast.success(`Added ${quantity} × ${product.productName} to cart`);
  };

  const updateQuantity = async (cartKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    if (isAuthenticated) {
      try {
        await cartService.updateQuantity(cartKey, quantity);
        await fetchCart();
      } catch (error) {
        console.error('Update quantity error:', error);
        toast.error('Failed to update quantity');
      }
    } else {
      setCartItems(prev =>
        prev.map(item => item.cartKey === cartKey ? { ...item, quantity } : item)
      );
    }
  };

  const removeFromCart = async (cartKey) => {
    if (isAuthenticated) {
      try {
        await cartService.removeFromCart(cartKey);
        await fetchCart();
      } catch (error) {
        console.error('Remove from cart error:', error);
        toast.error('Failed to remove item');
      }
    } else {
      setCartItems(prev => prev.filter(item => item.cartKey !== cartKey));
    }
    toast.success('Item removed from cart');
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartService.clearCart();
        await fetchCart();
      } catch (error) {
        console.error('Clear cart error:', error);
      }
    } else {
      setCartItems([]);
      localStorage.removeItem('cart');
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartTotal,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};