import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { FiShoppingCart, FiHeart, FiUser, FiMenu, FiX, FiSearch, FiLogOut } from 'react-icons/fi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${searchTerm}`);
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-sm py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            DesiCart
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-indigo-600 transition">Home</Link>
            <Link to="/shop" className="text-gray-700 hover:text-indigo-600 transition">Shop</Link>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FiSearch className="text-gray-400" />
              </button>
            </form>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <Link to="/wishlist" className="relative">
              <FiHeart className="text-2xl text-gray-700 hover:text-red-500 transition" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            
            <Link to="/cart" className="relative">
              <FiShoppingCart className="text-2xl text-gray-700 hover:text-indigo-600 transition" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <FiUser className="text-indigo-600" />
                  </div>
                  <span className="text-gray-700">{user?.firstName || 'Account'}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Dashboard</Link>
                  <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Orders</Link>
                  <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</Link>
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center gap-2">
                    <FiLogOut /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary px-4 py-2 text-sm">Login</Link>
            )}

            {/* Mobile Menu Button */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
              {isOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <Link to="/" className="block text-gray-700 hover:text-indigo-600" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/shop" className="block text-gray-700 hover:text-indigo-600" onClick={() => setIsOpen(false)}>Shop</Link>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg"
              />
              <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <FiSearch className="text-gray-400" />
              </button>
            </form>
            {!isAuthenticated && (
              <Link to="/login" className="block btn-primary text-center" onClick={() => setIsOpen(false)}>Login</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;