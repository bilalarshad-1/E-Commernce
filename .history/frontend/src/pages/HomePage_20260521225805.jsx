// src/pages/HomePage.jsx - DESICART PREMIUM EDITION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';

// Import existing components
import HeroSection from '../components/HeroSection';
import ProductCard from '../components/Layout/ProductCard';

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
  FiThumbsUp
} from 'react-icons/fi';

import { 
  FaRupeeSign, 
  FaFire, 
  FaGift, 
  FaTruck, 
  FaShieldAlt, 
  FaHeadset, 
  FaSyncAlt,
  FaCheckCircle
} from 'react-icons/fa';

// Stat Card Component with Counter
const StatCard = ({ number, suffix, label, icon: Icon }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.5 });
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (inView) {
      let start = 0;
      const duration = 2000;
      const increment = number / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= number) {
          setCount(number);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [inView, number]);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all">
        <Icon className="w-10 h-10 text-white" />
      </div>
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {count}{suffix}
      </div>
      <p className="text-orange-100 text-sm md:text-base">{label}</p>
    </motion.div>
  );
};

// Category Card Component with Link
const CategoryCard = ({ category, index }) => {
  return (
    <motion.div
      key={category._id}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      <Link to={`/shop?category=${category.slug}`} className="block group">
        <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 relative shadow-lg hover:shadow-2xl transition-all duration-300">
          {category.image?.url ? (
            <img 
              src={category.image.url} 
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FiPackage className="w-12 h-12 text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <h3 className="absolute bottom-4 left-0 right-0 text-white font-bold text-center text-base">
            {category.name}
          </h3>
          <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            {category.productCount || 500}+ Items
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

// Feature Box Component
const FeatureBox = ({ icon: Icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className="text-center group cursor-pointer"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-all duration-300">
        <Icon className="w-10 h-10 text-white" />
      </div>
      <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-orange-500 transition-colors">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </motion.div>
  );
};

const HomePage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterName, setNewsletterName] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Derive product sections
  const featuredProducts = allProducts.filter(p => p.isFeatured).slice(0, 8);
  const dealsProducts = allProducts.filter(p => p.discount > 0).slice(0, 8);
  const newArrivals = [...allProducts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  const bestSellers = [...allProducts].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 8);

  useEffect(() => {
    fetchAllData();
    window.scrollTo(0, 0);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { params: { status: 'active', isPublished: true, limit: 50 } }),
        axios.get(`${API_URL}/categories`, { params: { status: 'active', limit: 12 } })
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

  // Calculate real statistics from API data
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
        {/* 1. Hero Section - Imported from existing component */}
        <HeroSection />

        {/* 2. Four Feature Boxes - Free Delivery, Easy Returns, Secure Payment, 24/7 Support */}
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureBox 
                icon={FaTruck} 
                title="Free Shipping" 
                description="On orders over Rs. 5,000"
                delay={0}
              />
              <FeatureBox 
                icon={FaSyncAlt} 
                title="Easy Returns" 
                description="30-day return policy"
                delay={0.1}
              />
              <FeatureBox 
                icon={FaShieldAlt} 
                title="Secure Payment" 
                description="100% secure transactions"
                delay={0.2}
              />
              <FeatureBox 
                icon={FaHeadset} 
                title="24/7 Support" 
                description="Pakistani customer service"
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* 3. Categories Section - With links to category pages */}
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

        {/* 4. Products Section - Featured Products */}
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">Featured Products</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Hand-picked premium products just for you</p>
            </motion.div>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <ProductCard product={product} type="featured" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Flash Sale Section - Deep Orange Background */}
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
                className="text-center mb-12"
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
                <p className="text-white/80 text-lg max-w-2xl mx-auto">Limited time offers - Grab them before they're gone!</p>
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

        {/* 5. Numbers Section - Statistics */}
        <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="2" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pattern)" />
            </svg>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Achievements</h2>
              <p className="text-orange-100 text-lg max-w-2xl mx-auto">Making shopping easier for millions of Pakistanis</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard number={500000} suffix="+" label="Happy Customers" icon={FiUser} />
              <StatCard number={totalProducts} suffix="+" label="Products" icon={FiPackage} />
              <StatCard number={totalCategories} suffix="+" label="Categories" icon={FiAward} />
              <StatCard number={100} suffix="+" label="Cities in Pakistan" icon={FiMapPin} />
            </div>
          </div>
        </section>

        {/* 6. Banner Section - Special Offer */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600" />
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="bannerPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M30 30 L60 0 M0 30 L30 60" stroke="white" strokeWidth="2" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#bannerPattern)" />
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
              <p className="text-xl text-white/80 mb-8">Use code: <span className="font-mono bg-white/20 px-6 py-2 rounded-xl">WELCOME20</span></p>
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

        {/* 7. Newsletter Section - Subscribe */}
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Subscribe to Our Newsletter</h2>
              <p className="text-gray-600 text-lg mb-8">
                Get exclusive deals, early access to sales, and special offers delivered to your inbox!
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