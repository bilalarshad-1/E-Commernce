// context/CartContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Update totals whenever cart changes
  useEffect(() => {
    calculateTotals();
  }, [cartItems]);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Failed to parse cart:', error);
        setCartItems([]);
      }
    }
  };

  const saveCart = (items) => {
    localStorage.setItem('cart', JSON.stringify(items));
    setCartItems(items);
  };

  const calculateTotals = () => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartTotal(total);
    setCartCount(count);
  };

  const addToCart = (product, quantity = 1, variation = null) => {
    setLoading(true);
    
    const existingItemIndex = cartItems.findIndex(
      item => item.productId === product._id && 
      item.variationId === (variation?._id || null)
    );

    let newCart;
    if (existingItemIndex > -1) {
      // Update existing item
      newCart = [...cartItems];
      const newQuantity = newCart[existingItemIndex].quantity + quantity;
      const maxStock = variation?.stock || product.inventory?.currentStock;
      
      if (newQuantity > maxStock) {
        toast.error(`Only ${maxStock} items available in stock`);
        setLoading(false);
        return;
      }
      
      newCart[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      const maxStock = variation?.stock || product.inventory?.currentStock;
      if (quantity > maxStock) {
        toast.error(`Only ${maxStock} items available in stock`);
        setLoading(false);
        return;
      }
      
      newCart = [...cartItems, {
        productId: product._id,
        productName: product.productName,
        productImage: product.mainImage?.url || product.images?.[0]?.url,
        price: variation?.price || product.price,
        originalPrice: product.price,
        quantity: quantity,
        variationId: variation?._id || null,
        variationName: variation?.name || null,
        sku: variation?.sku || product.sku,
        inStock: maxStock,
        weight: product.weight?.value || null
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
    
    const item = cartItems.find(
      item => item.productId === productId && item.variationId === variationId
    );
    
    if (item && quantity > item.inStock) {
      toast.error(`Only ${item.inStock} items available`);
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
    toast.success('Cart cleared');
  };

  const getCartTotal = () => cartTotal;
  
  const getCartCount = () => cartCount;
  
  const getSubtotal = () => cartTotal;
  
  const getShippingCost = () => {
    return cartTotal > 100 ? 0 : 10;
  };
  
  const getTax = () => {
    return cartTotal * 0.1; // 10% tax
  };
  
  const getGrandTotal = () => {
    return cartTotal + getShippingCost() + getTax();
  };
  
  const isInCart = (productId, variationId = null) => {
    return cartItems.some(
      item => item.productId === productId && item.variationId === variationId
    );
  };
  
  const getItemQuantity = (productId, variationId = null) => {
    const item = cartItems.find(
      item => item.productId === productId && item.variationId === variationId
    );
    return item ? item.quantity : 0;
  };

  const value = {
    cartItems,
    loading,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getSubtotal,
    getShippingCost,
    getTax,
    getGrandTotal,
    isInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};