import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Layout from './components/Layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WishlistPage from './pages/WishlistPage';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/ProfilePage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

// Wrap page with Layout
const PageWrapper = ({ children }) => <Layout>{children}</Layout>;

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Routes>
            {/* Public Routes with Layout */}
            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
            <Route path="/shop" element={<PageWrapper><ShopPage /></PageWrapper>} />
            <Route path="/product/:id" element={<PageWrapper><ProductDetailPage /></PageWrapper>} />
            <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/checkout" element={<ProtectedRoute><PageWrapper><CheckoutPage /></PageWrapper></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><PageWrapper><OrdersPage /></PageWrapper></ProtectedRoute>} />
            <Route path="/order/:id" element={<ProtectedRoute><PageWrapper><OrderDetailPage /></PageWrapper></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><PageWrapper><WishlistPage /></PageWrapper></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
            
            {/* 404 */}
            <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
          </Routes>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  </div>
);

export default App;