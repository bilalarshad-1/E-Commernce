// src/pages/HomePage.jsx - DESICART ULTRA PREMIUM VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';
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
  FiShare2,
  FiEye,
  FiCheck,
  FiSmartphone,
  FiLaptop,
  FiWatch,
  FiHome,
  FiCamera,
  FiMusic,
  FiBook,
  FiBriefcase,
  FiGithub,
  FiTwitter,
  FiInstagram,
  FiFacebook,
  FiYoutube,
  FiLinkedin,
  FiPhoneCall,
  FiMessageCircle,
  FiAward as FiTrophy,
  FiThumbsUp,
  FiSmile,
  FiDroplet,
  FiSun,
  FiMoon,
  FiCloud,
  FiWind
} from 'react-icons/fi';

import { FaRupeeSign, FaHeart, FaShoppingCart, FaShareAlt, FaEye, FaCheckCircle, FaTruck, FaShieldAlt, FaHeadset, FaSyncAlt, FaGift, FaFire, FaClock, FaStar, FaUserFriends, FaStore, FaGlobe, FaCreditCard } from 'react-icons/fa';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

// ========== ULTRA PREMIUM PRODUCT CARD COMPONENT ==========
const PremiumProductCard = ({ product, type = "default", index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getBadge = () => {
    if (type === "deal") return (
      <motion.div 
        initial={{ x: -100, rotate: -45 }}
        animate={{ x: 0, rotate: 0 }}
        className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg z-20 flex items-center gap-1"
      >
        <FaFire className="w-3 h-3" /> FLASH DEAL
      </motion.div>
    );
    if (type === "new") return (
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg z-20"
      >
        🆕 JUST ARRIVED
      </motion.div>
    );
    if (type === "bestseller") return (
      <motion.div 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg z-20 flex items-center gap-1"
      >
        <FaTrophy className="w-3 h-3" /> BESTSELLER
      </motion.div>
    );
    if (product.discount > 30) return (
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg z-20"
      >
        {product.discount}% OFF
      </motion.div>
    );
    return null;
  };

  return (
    <>
      <motion.div 
        className="group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-3xl transition-all duration-500"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.6 }}
        viewport={{ once: true }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -12 }}
      >
        <Link to={`/product/${product._id}`}>
          {/* Image Container with Glass Effect */}
          <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Skeleton Loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
            )}
            <motion.img 
              src={product.mainImage?.url || `https://placehold.co/800x800/FF8C00/white?text=DesiCart+Premium`} 
              alt={product.productName}
              className={`w-full h-full object-cover transition-all duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              animate={{ scale: isHovered ? 1.15 : 1 }}
              transition={{ duration: 0.7 }}
            />
            
            {/* Overlay Gradient */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Badges */}
            {getBadge()}
            
            {/* Stock Badge */}
            {product.inventory?.currentStock === 0 && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
                <span className="bg-red-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg">Sold Out</span>
              </div>
            )}
            
            {/* Quick Action Buttons - Appear on Hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute right-4 top-20 flex flex-col gap-2 z-30"
                >
                  <motion.button 
                    whileHover={{ scale: 1.1, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-red-50 transition-all duration-300"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsWishlisted(!isWishlisted);
                      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!');
                    }}
                  >
                    <motion.div animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}>
                      <FaHeart className={`w-5 h-5 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                    </motion.div>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-50 transition-all duration-300"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowQuickView(true);
                    }}
                  >
                    <FaEye className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-green-50 transition-all duration-300"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.success('Link copied!');
                    }}
                  >
                    <FaShareAlt className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Add to Cart Button - Slides from bottom */}
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute bottom-0 left-0 right-0 p-4 z-30"
                >
                  <motion.button 
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-2xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAddedToCart(true);
                      toast.success('Added to cart!');
                      setTimeout(() => setIsAddedToCart(false), 2000);
                    }}
                  >
                    {isAddedToCart ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                        <FaCheckCircle className="w-5 h-5" /> Added!
                      </motion.div>
                    ) : (
                      <>
                        <FaShoppingCart className="w-5 h-5" /> Add to Cart
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Rating Badge */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 z-20">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className={`w-3 h-3 ${i < (product.rating || 4) ? 'text-yellow-400' : 'text-gray-400'}`} />
              ))}
              <span className="text-white text-xs font-medium ml-1">({product.totalReviews || 128})</span>
            </div>
          </div>
          
          {/* Product Info */}
          <div className="p-5">
            {/* Brand/Category Tag */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                {product.category?.name || 'Premium'}
              </span>
              {product.isVerified && (
                <FaCheckCircle className="w-3.5 h-3.5 text-blue-500" />
              )}
            </div>
            
            {/* Title */}
            <h3 className="font-bold text-charcoal text-lg mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors duration-300">
              {product.productName}
            </h3>
            
            {/* Description */}
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">
              {product.shortDescription || 'Premium quality product with amazing features and benefits for our valued customers.'}
            </p>
            
            {/* Price Section */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                {product.discount > 0 ? (
                  <>
                    <span className="text-2xl font-bold text-orange-500 flex items-center">
                      <FaRupeeSign className="w-4 h-4 mr-0.5" />{(product.price * (1 - product.discount / 100)).toFixed(2)}
                    </span>
                    <span className="text-gray-400 line-through text-sm flex items-center">
                      <FaRupeeSign className="w-3 h-3" />{product.price}
                    </span>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                      Save {product.discount}%
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-orange-500 flex items-center">
                    <FaRupeeSign className="w-4 h-4 mr-0.5" />{product.price}
                  </span>
                )}
              </div>
            </div>
            
            {/* Stock Status */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${product.inventory?.currentStock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={product.inventory?.currentStock > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.inventory?.currentStock > 0 ? `${product.inventory.currentStock}+ in stock` : 'Out of stock'}
                </span>
              </div>
              {product.freeShipping && (
                <div className="flex items-center gap-1 text-blue-600">
                  <FaTruck className="w-3 h-3" />
                  <span>Free Shipping</span>
                </div>
              )}
            </div>
            
            {/* Progress Bar for limited stock */}
            {product.inventory?.currentStock < 20 && product.inventory?.currentStock > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Hurry! Only {product.inventory.currentStock} left</span>
                  <span>{Math.round((product.inventory.currentStock / 50) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(product.inventory.currentStock / 50) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
      
      {/* Quick View Modal */}
      <AnimatePresence>
        {showQuickView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuickView(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-end">
                  <button onClick={() => setShowQuickView(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <img src={product.mainImage?.url} alt={product.productName} className="rounded-2xl w-full" />
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{product.productName}</h2>
                    <div className="flex items-center gap-2 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={`w-4 h-4 ${i < (product.rating || 4) ? 'text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-sm text-gray-500">({product.totalReviews || 128} reviews)</span>
                    </div>
                    <div className="text-3xl font-bold text-orange-500 mb-4 flex items-center gap-2">
                      <FaRupeeSign />{(product.price * (1 - (product.discount || 0) / 100)).toFixed(2)}
                      {product.discount > 0 && <span className="text-lg text-gray-400 line-through"><FaRupeeSign className="inline w-3 h-3"/>{product.price}</span>}
                    </div>
                    <p className="text-gray-600 mb-6">{product.description || product.shortDescription}</p>
                    <div className="flex gap-4">
                      <button className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition">
                        <FaShoppingCart /> Add to Cart
                      </button>
                      <button className="px-6 py-3 border-2 border-gray-300 rounded-xl font-bold hover:border-orange-500 hover:text-orange-500 transition">
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ========== HERO SECTION COMPONENT ==========
const HeroSection = () => {
  const heroSlides = [
    {
      title: "Summer Sale Extravaganza",
      subtitle: "Up to 70% off on selected items. Free shipping on orders over Rs. 5,000!",
      ctaText: "Shop Now",
      ctaLink: "/shop",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920",
      bgColor: "from-amber-50 to-orange-50"
    },
    {
      title: "Electronics Mega Deals",
      subtitle: "Latest gadgets at unbeatable prices. Limited time offer!",
      ctaText: "Explore Deals",
      ctaLink: "/shop?category=electronics",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1920",
      bgColor: "from-blue-50 to-cyan-50"
    },
    {
      title: "Pakistani Fashion Week",
      subtitle: "Traditional & modern fusion. Exclusive collection from local designers.",
      ctaText: "Shop Collection",
      ctaLink: "/shop?category=fashion",
      image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920",
      bgColor: "from-pink-50 to-rose-50"
    }
  ];

  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation, EffectFade]}
      effect="fade"
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      navigation={true}
      loop={true}
      className="hero-slider"
      style={{ 
        '--swiper-navigation-color': '#FF8C00',
        '--swiper-pagination-color': '#FF8C00',
        '--swiper-navigation-size': '24px'
      }}
    >
      {heroSlides.map((slide, index) => (
        <SwiperSlide key={index}>
          <div className={`relative h-[550px] md:h-[650px] overflow-hidden bg-gradient-to-r ${slide.bgColor}`}>
            <div className="absolute inset-0">
              <img 
                src={slide.image} 
                alt={slide.title}
                className="w-full h-full object-cover opacity-20"
              />
            </div>
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="inline-block bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                    Pakistan's #1 Store
                  </span>
                  <h1 className="text-5xl md:text-7xl font-bold text-dark mt-4 mb-6 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-dark/70 text-xl mb-8 max-w-xl">
                    {slide.subtitle}
                  </p>
                  <div className="flex gap-4">
                    <Link 
                      to={slide.ctaLink} 
                      className="inline-flex items-center gap-2 bg-orange-500 text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-orange-600 transition-all hover:scale-105 shadow-xl"
                    >
                      {slide.ctaText} <FiChevronRight className="w-5 h-5" />
                    </Link>
                    <Link 
                      to="/shop" 
                      className="inline-flex items-center gap-2 bg-white text-orange-500 px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all shadow-xl border-2 border-orange-500"
                    >
                      View Collections
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

// ========== STAT CARD WITH COUNTING ANIMATION ==========
const AnimatedStatCard = ({ number, suffix, label, icon: Icon, prefix = "" }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.5 });
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (inView) {
      let start = 0;
      const duration = 2500;
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
      initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
      animate={inView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
      transition={{ duration: 0.6, type: "spring" }}
      className="text-center group"
    >
      <motion.div 
        className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-all group-hover:scale-110"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className="w-10 h-10 text-white" />
      </motion.div>
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {prefix}{count}{suffix}
      </div>
      <p className="text-orange-100 text-sm md:text-base font-medium">{label}</p>
    </motion.div>
  );
};

// ========== CATEGORY CARD ==========
const CategoryCard = ({ category, index }) => {
  const icons = [FiSmartphone, FiLaptop, FiWatch, FiHome, FiCamera, FiMusic, FiBook, FiBriefcase];
  const Icon = icons[index % icons.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
    >
      <Link to={`/shop?category=${category.slug}`} className="block group">
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-12 h-12 text-orange-500" />
          </div>
          <h3 className="font-bold text-charcoal text-lg mb-1">{category.name}</h3>
          <p className="text-gray-500 text-sm">{category.productCount || 1000}+ Products</p>
        </div>
      </Link>
    </motion.div>
  );
};

// ========== TESTIMONIAL CARD ==========
const TestimonialCard = ({ testimonial, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-3xl p-8 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -mr-16 -mt-16 opacity-50" />
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-orange-200">
            <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-charcoal text-lg">{testimonial.name}</h4>
            <p className="text-gray-500 text-sm">{testimonial.role}</p>
          </div>
        </div>
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
          ))}
        </div>
        <p className="text-gray-600 italic leading-relaxed">"{testimonial.text}"</p>
        <div className="mt-4 flex items-center gap-2 text-green-600">
          <FaCheckCircle className="w-4 h-4" />
          <span className="text-sm">Verified Purchase</span>
        </div>
      </div>
    </motion.div>
  );
};

// ========== MAIN HOMEPAGE COMPONENT ==========
const HomePage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterName, setNewsletterName] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [activeTab, setActiveTab] = useState('featured');
  
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.1], ['transparent', 'white']);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      await axios.post(`${API_URL}/newsletter/subscribe`, { email: newsletterEmail, name: newsletterName });
      toast.success('Successfully subscribed!');
      setNewsletterEmail('');
      setNewsletterName('');
    } catch (error) {
      toast.error('Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const features = [
    { icon: FaTruck, title: "Free Shipping", desc: "On orders over Rs. 5,000", color: "from-blue-500 to-blue-600" },
    { icon: FaSyncAlt, title: "Easy Returns", desc: "30-day return policy", color: "from-green-500 to-green-600" },
    { icon: FaShieldAlt, title: "Secure Payment", desc: "100% secure transactions", color: "from-purple-500 to-purple-600" },
    { icon: FaHeadset, title: "24/7 Support", desc: "Pakistani customer service", color: "from-orange-500 to-red-500" }
  ];

  const stats = [
    { number: 500000, suffix: "+", label: "Happy Customers", icon: FaUserFriends, prefix: "" },
    { number: 10000, suffix: "+", label: "Products", icon: FaStore, prefix: "" },
    { number: 500, suffix: "+", label: "Brands", icon: FaGlobe, prefix: "" },
    { number: 100, suffix: "+", label: "Cities in Pakistan", icon: FaMapPin, prefix: "" }
  ];

  const testimonials = [
    { name: "Ayesha Khan", role: "Fashion Designer", rating: 5, text: "Absolutely love DesiCart! The quality is amazing and delivery is super fast. Best shopping experience in Pakistan!", image: "https://randomuser.me/api/portraits/women/1.jpg" },
    { name: "Bilal Ahmed", role: "Tech Enthusiast", rating: 5, text: "Great variety of products at amazing prices. Customer service is excellent. Will definitely shop again!", image: "https://randomuser.me/api/portraits/men/2.jpg" },
    { name: "Fatima Riaz", role: "Home Maker", rating: 5, text: "I've become a regular customer. The quality exceeded my expectations. Highly recommend DesiCart!", image: "https://randomuser.me/api/portraits/women/3.jpg" },
    { name: "Hamza Ali", role: "Business Owner", rating: 5, text: "Best online shopping platform in Pakistan. Fast delivery and great customer support!", image: "https://randomuser.me/api/portraits/men/4.jpg" }
  ];

  const productTabs = [
    { id: 'featured', label: 'Featured', icon: FaStar, products: featuredProducts },
    { id: 'bestsellers', label: 'Best Sellers', icon: FaTrophy, products: bestSellers },
    { id: 'new', label: 'New Arrivals', icon: FaClock, products: newArrivals }
  ];

  return (
    <>
      <Helmet>
        <title>DesiCart - Pakistan's #1 Online Shopping Store</title>
        <meta name="description" content="Shop the best products at amazing prices. Free shipping across Pakistan. Best deals on electronics, fashion, home & more." />
      </Helmet>

      <div className="overflow-hidden">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Bar - White Background */}
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-all duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-charcoal text-base mb-1">{feature.title}</h3>
                  <p className="text-gray-500 text-xs">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
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
              <h2 className="text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">Browse Categories</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Discover our curated collection of premium products</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {categories.slice(0, 12).map((category, index) => (
                <CategoryCard key={category._id || index} category={category} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Flash Sale Section - Deep Orange Background */}
        {dealsProducts.length > 0 && (
          <section className="py-20 bg-deep-orange relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
                {dealsProducts.slice(0, 8).map((product, index) => (
                  <PremiumProductCard key={product._id || index} product={product} type="deal" index={index} />
                ))}
              </div>
              
              <div className="text-center mt-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/shop?on-sale=true" 
                    className="inline-flex items-center gap-2 bg-white text-deep-orange px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl"
                  >
                    View All Deals <FiChevronRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="2" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pattern)" />
            </svg>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <AnimatedStatCard key={index} {...stat} />
              ))}
            </div>
          </div>
        </section>

        {/* Products Section with Tabs */}
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
              <h2 className="text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">Our Best Products</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Hand-picked premium products just for you</p>
            </motion.div>

            {/* Tabs */}
            <div className="flex justify-center gap-3 mb-12 flex-wrap">
              {productTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-orange-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-orange-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7"
                >
                  {productTabs.find(t => t.id === activeTab)?.products.slice(0, 8).map((product, index) => (
                    <PremiumProductCard key={product._id || index} product={product} index={index} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* Brand Showcase Section */}
        <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by 500,000+ Customers</h2>
              <p className="text-gray-300 mb-12">Shop from Pakistan's most trusted brands</p>
            </motion.div>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-70">
              {["Khaadi", "Sapphire", "Gul Ahmed", "Alkaram", "ChenOne", "Outfitters", "Ego", "Bonanza"].map((brand, index) => (
                <motion.div
                  key={brand}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-28 h-28 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all">
                    <span className="font-bold text-white text-sm">{brand}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="relative py-28 bg-fixed bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1920')" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-900/95 to-red-900/95" />
          <div className="container mx-auto px-4 relative z-10 text-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="inline-block"
              >
                <FaGift className="w-20 h-20 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-bold mb-4">Eid Special Collection!</h2>
              <p className="text-2xl md:text-3xl mb-4">Get Extra 20% OFF on prepaid orders</p>
              <p className="text-xl mb-8 opacity-90">Use code: <span className="font-mono bg-white/20 px-6 py-2 rounded-xl">DESICART20</span></p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/shop" className="inline-flex items-center gap-3 bg-white text-orange-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl">
                  Shop Now <FiChevronRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-orange-500 font-bold uppercase tracking-wider text-sm bg-orange-100 px-4 py-1.5 rounded-full inline-block mb-3">
                Testimonials
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">What Our Customers Say</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Join millions of happy DesiCart customers</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="relative py-24 overflow-hidden bg-gradient-to-r from-orange-600 to-red-600">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pattern2" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M40 40 L80 0 M0 40 L40 80" stroke="white" strokeWidth="2" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pattern2)" />
            </svg>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center text-white"
            >
              <motion.div 
                className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <FiMail className="w-12 h-12" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Join the DesiCart Family</h2>
              <p className="text-xl mb-8 opacity-90">
                Subscribe to get special offers, free giveaways, and exclusive deals.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Your name"
                  value={newsletterName}
                  onChange={(e) => setNewsletterName(e.target.value)}
                  className="flex-1 px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/50"
                />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/50"
                />
                <motion.button
                  type="submit"
                  disabled={subscribing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-white text-orange-600 rounded-full font-bold hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'} <FiSend className="w-5 h-5" />
                </motion.button>
              </form>
              
              <p className="text-sm mt-6 opacity-75">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;