// context/CartContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  };

  const saveCart = (items) => {
    localStorage.setItem('cart', JSON.stringify(items));
    setCartItems(items);
  };

  const addToCart = (product, quantity = 1, variation = null) => {
    setLoading(true);
    const existingItem = cartItems.find(
      item => item.productId === product._id && 
      item.variationId === (variation?._id || null)
    );

    let newCart;
    if (existingItem) {
      newCart = cartItems.map(item =>
        item === existingItem
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cartItems, {
        productId: product._id,
        productName: product.productName,
        productImage: product.mainImage?.url,
        price: variation?.price || product.price,
        originalPrice: product.price,
        quantity,
        variationId: variation?._id || null,
        variationName: variation?.name || null,
        sku: variation?.sku || product.sku,
        inStock: variation?.stock || product.inventory?.currentStock
      }];
    }
    
    saveCart(newCart);
    toast.success(`${product.productName} added to cart`);
    setLoading(false);
  };

  const removeFromCart = (productId, variationId = null) => {
    const newCart = cartItems.filter(
      item => !(item.productId === productId && item.variationId === variationId)
    );
    saveCart(newCart);
    toast.success('Item removed from cart');
  };

  const updateQuantity = (productId, variationId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId, variationId);
      return;
    }
    
    const newCart = cartItems.map(item =>
      item.productId === productId && item.variationId === variationId
        ? { ...item, quantity }
        : item
    );
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};