// src/pages/HomePage.jsx - DESICART PREMIUM EDITION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';

// Import existing components
import HeroSection from '../components/HeroSection';
import ProductCard from '../components/';

// Icons
import { 
  FiTruck, 
  FiRefreshCw, 
  FiShield, 
  FiHeadphones,
  FiStar,
  FiHeart,
  FiShoppingCart,
  FiUser,
  FiAward,
  FiPackage,
  FiMapPin,
  FiMail,
  FiSend,
  FiChevronRight,
  FiTrendingUp,
  FiClock,
  FiZap,
  FiGift,
  FiDollarSign,
  FiPercent,
  FiSmile,
  FiThumbsUp,
  FiCoffee,
  FiShoppingBag,
  FiWatch,
  FiSmartphone,
  FiHome,
  FiCamera,
  FiMusic,
  FiBookOpen,
  FiBriefcase,
  FiCloud,
  FiSun,
  FiMoon
} from 'react-icons/fi';

import { 
  FaRupeeSign, 
  FaFire, 
  FaGift, 
  FaTruck, 
  FaShieldAlt, 
  FaHeadset, 
  FaSyncAlt,
  FaCheckCircle,
  FaClock,
  FaStar,
  FaUserFriends,
  FaStore,
  FaGlobe
} from 'react-icons/fa';

// Animated Counter Component
const AnimatedCounter = ({ target, suffix = "", label, icon: Icon, prefix = "" }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (inView) {
      let start = 0;
      const duration = 2500;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [inView, target]);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center group"
    >
      <motion.div 
        className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-all duration-300"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className="w-10 h-10 text-white" />
      </motion.div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-2">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <p className="text-orange-100 text-sm md:text-base font-medium">{label}</p>
    </motion.div>
  );
};

// Category Card Component
const CategoryCard = ({ category, index }) => {
  const categoryIcons = [
    FiSmartphone, FiWatch, FiHome, FiCamera, 
    FiMusic, FiBookOpen, FiBriefcase, FiShoppingBag,
    FiCloud, FiSun, FiMoon, FiCoffee
  ];
  const Icon = categoryIcons[index % categoryIcons.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link to={`/shop?category=${category.slug}`}>
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-orange-500 transition-colors">
            {category.name}
          </h3>
          <p className="text-gray-500 text-sm">{category.productCount || 500}+ Items</p>
        </div>
      </Link>
    </motion.div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className="text-center group"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300">
        <Icon className="w-10 h-10 text-white" />
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </motion.div>
  );
};

// Deal Timer Component
const DealTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-4 justify-center mb-8">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 min-w-[70px]">
            <span className="text-3xl font-bold text-white">{String(value).padStart(2, '0')}</span>
          </div>
          <p className="text-white/80 text-xs mt-1 capitalize">{unit}</p>
        </div>
      ))}
    </div>
  );
};

// Trust Badge Component
const TrustBadge = ({ icon: Icon, text, subtext }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"
    >
      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="font-bold text-white text-sm">{text}</p>
        <p className="text-white/70 text-xs">{subtext}</p>
      </div>
    </motion.div>
  );
};

// Main HomePage Component
const HomePage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('featured');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterName, setNewsletterName] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Filter products based on active tab
  const getFilteredProducts = () => {
    switch(activeTab) {
      case 'featured':
        return allProducts.filter(p => p.isFeatured).slice(0, 8);
      case 'bestselling':
        return [...allProducts].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 8);
      case 'new':
        return [...allProducts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
      case 'discounted':
        return allProducts.filter(p => p.discount > 0).slice(0, 8);
      default:
        return allProducts.slice(0, 8);
    }
  };

  const dealsProducts = allProducts.filter(p => p.discount > 0).slice(0, 8);

  useEffect(() => {
    fetchAllData();
    window.scrollTo(0, 0);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { 
          params: { status: 'active', isPublished: true, limit: 50 } 
        }),
        axios.get(`${API_URL}/categories`, { 
          params: { status: 'active', limit: 12 } 
        })
      ]);
      
      setAllProducts(productsRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast.error('Please enter your email');
      return;
    }
    
    setSubscribing(true);
    try {
      await axios.post(`${API_URL}/newsletter/subscribe`, {
        email: newsletterEmail,
        name: newsletterName
      });
      toast.success('Successfully subscribed! 🎉');
      setNewsletterEmail('');
      setNewsletterName('');
    } catch (error) {
      toast.error('Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  // Real statistics from API data
  const totalProducts = allProducts.length;
  const totalCategories = categories.length;
  const avgRating = allProducts.length > 0 
    ? (allProducts.reduce((sum, p) => sum + (p.rating || 4), 0) / allProducts.length).toFixed(1)
    : 4.8;

  return (
    <>
      <Helmet>
        <title>DesiCart - Pakistan's #1 Online Shopping Store</title>
        <meta name="description" content="Shop the best products at amazing prices. Free shipping across Pakistan. Best deals on electronics, fashion, home & more." />
      </Helmet>

      <div className="overflow-hidden">
        {/* Hero Section - Imported from existing component */}
        <HeroSection />

        {/* Features Section - Attracts customers with benefits */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <FeatureCard 
                icon={FaTruck} 
                title="Free Shipping" 
                description="On orders over Rs. 5,000"
                delay={0}
              />
              <FeatureCard 
                icon={FaSyncAlt} 
                title="Easy Returns" 
                description="30-day return policy"
                delay={0.1}
              />
              <FeatureCard 
                icon={FaShieldAlt} 
                title="Secure Payment" 
                description="100% secure transactions"
                delay={0.2}
              />
              <FeatureCard 
                icon={FaHeadset} 
                title="24/7 Support" 
                description="Pakistani customer service"
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* Categories Section - Same as previous but enhanced */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-orange-500 font-bold uppercase tracking-wider text-sm bg-orange-100 px-4 py-1.5 rounded-full inline-block mb-3">
                Shop by Category
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">Browse Categories</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Discover our curated collection of premium products</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.slice(0, 12).map((category, index) => (
                <CategoryCard key={category._id} category={category} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Flash Sale Section - Deep Orange Background with Timer */}
        {dealsProducts.length > 0 && (
          <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <motion.div 
                  className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-2 rounded-full mb-4 backdrop-blur-sm"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <FaFire className="w-5 h-5" />
                  <span className="font-bold">FLASH SALE</span>
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">LIMITED TIME</span>
                </motion.div>
                <h2 className="text-5xl md:text-6xl font-bold text-white mt-2 mb-4">Hot Deals 🔥</h2>
                <p className="text-white/80 text-lg max-w-2xl mx-auto mb-6">Limited time offers - Grab them before they're gone!</p>
                <DealTimer />
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dealsProducts.slice(0, 8).map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <ProductCard product={product} type="deal" />
                  </motion.div>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/shop?on-sale=true" 
                    className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all shadow-2xl"
                  >
                    View All Deals <FiChevronRight />
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* Customer Trust & Statistics Section */}
        <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Community Trusts Us</h2>
              <p className="text-orange-100 text-lg max-w-2xl mx-auto">Join thousands of satisfied customers across Pakistan</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <AnimatedCounter 
                target={totalProducts} 
                suffix="+" 
                label="Premium Products" 
                icon={FaStore}
              />
              <AnimatedCounter 
                target={totalCategories} 
                suffix="+" 
                label="Categories" 
                icon={FaGlobe}
              />
              <AnimatedCounter 
                target={parseFloat(avgRating) * 1000} 
                suffix="+" 
                label="5-Star Reviews" 
                icon={FaStar}
              />
              <AnimatedCounter 
                target={100} 
                suffix="+" 
                label="Cities in Pakistan" 
                icon={FaMapPin}
              />
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <TrustBadge icon={FaCheckCircle} text="100% Authentic" subtext="Genuine Products" />
              <TrustBadge icon={FaTruck} text="Fast Delivery" subtext="1-3 Business Days" />
              <TrustBadge icon={FaShieldAlt} text="Secure Payments" subtext="COD & Card" />
              <TrustBadge icon={FaHeadset} text="24/7 Support" subtext="Customer Care" />
            </div>
          </div>
        </section>

        {/* Products Section with Tabs - Using ProductCard component */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-orange-500 font-bold uppercase tracking-wider text-sm bg-orange-100 px-4 py-1.5 rounded-full inline-block mb-3">
                Premium Collection
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">Shop By Trends</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Discover products that match your style and needs</p>
            </motion.div>

            {/* Tab Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {[
                { id: 'featured', label: '⭐ Featured', color: 'orange' },
                { id: 'bestselling', label: '🏆 Best Selling', color: 'amber' },
                { id: 'new', label: '🆕 New Arrivals', color: 'green' },
                { id: 'discounted', label: '🔥 On Sale', color: 'red' }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    activeTab === tab.id 
                      ? `bg-${tab.color}-500 text-white shadow-lg` 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-orange-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {getFilteredProducts().map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard 
                      product={product} 
                      type={activeTab === 'discounted' ? 'deal' : activeTab === 'new' ? 'new' : activeTab === 'bestselling' ? 'bestseller' : 'default'}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* View All Button */}
            {!loading && getFilteredProducts().length > 0 && (
              <div className="text-center mt-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/shop" 
                    className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition-all shadow-lg"
                  >
                    View All Products <FiChevronRight />
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </section>

        {/* Special Offer Banner - Attracts customers with deals */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600" />
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="3" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pattern)" />
            </svg>
          </div>
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block"
              >
                <FaGift className="w-20 h-20 text-white mx-auto mb-6" />
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">Special Welcome Offer!</h2>
              <p className="text-2xl md:text-3xl text-white/90 mb-4">Get 20% OFF on your first order</p>
              <p className="text-xl text-white/80 mb-8">Use code: <span className="font-mono bg-white/20 px-4 py-2 rounded-lg">WELCOME20</span></p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  to="/shop" 
                  className="inline-flex items-center gap-2 bg-white text-orange-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl"
                >
                  Shop Now <FiChevronRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Newsletter Section - Build customer base */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <FiMail className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Don't Miss Out!</h2>
              <p className="text-gray-600 text-lg mb-8">
                Subscribe to get exclusive deals, early access to sales, and special offers!
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Your name"
                  value={newsletterName}
                  onChange={(e) => setNewsletterName(e.target.value)}
                  className="flex-1 px-6 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 px-6 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe Now'} <FiSend />
                </button>
              </form>
              
              <p className="text-sm text-gray-500 mt-6">
                Join 50,000+ subscribers • No spam, unsubscribe anytime
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;