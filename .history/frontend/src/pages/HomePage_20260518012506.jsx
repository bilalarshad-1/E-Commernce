// src/pages/HomePage.jsx - DESICART PAKISTAN EDITION
// Color Scheme: Header(White/Charcoal/Orange), Hero(SoftCream/Dark/Orange), 
// Product Cards(White/Dark/Orange), Flash Sale(Deep Orange/White/White Button), Footer(Charcoal/Light Gray/Orange Accent)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion, useScroll, useTransform } from 'framer-motion';
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
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiYoutube,
  FiPhone,
  FiMail as FiMailIcon
} from 'react-icons/fi';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

// Product Card Component - White Background, Dark Text, Orange CTA
const ProductCard = ({ product, type = "default" }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getBadge = () => {
    if (type === "deal") return <div className="absolute top-4 left-4 bg-deep-orange text-white px-3 py-1 rounded-full text-xs font-bold">🔥 DEAL</div>;
    if (type === "new") return <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">🆕 NEW</div>;
    if (type === "bestseller") return <div className="absolute top-4 left-4 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold">⭐ BESTSELLER</div>;
    if (product.isFeatured) return <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">Featured</div>;
    return null;
  };
  
  return (
    <motion.div 
      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product._id}`}>
        <div className="relative overflow-hidden aspect-square">
          <img 
            src={product.mainImage?.url || 'https://placehold.co/600x600/FF8C00/white?text=DesiCart'} 
            alt={product.productName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {getBadge()}
          {product.discount > 0 && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {product.discount}% OFF
            </div>
          )}
          {product.inventory?.currentStock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">Sold Out</span>
            </div>
          )}
          <button 
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.success('Added to wishlist!');
            }}
          >
            <FiHeart className="text-gray-600 hover:text-red-500" />
          </button>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4 z-10"
            >
              <button 
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast.success('Added to cart!');
                }}
              >
                <FiShoppingCart /> Add to Cart
              </button>
            </motion.div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <FiStar key={i} className={`w-4 h-4 ${i < (product.rating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
            ))}
            <span className="text-xs text-gray-500 ml-2">({product.totalReviews || 0})</span>
          </div>
          <h3 className="font-bold text-charcoal text-lg mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors">
            {product.productName}
          </h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.shortDescription}</p>
          <div className="flex items-center justify-between">
            <div>
              {product.discount > 0 ? (
                <>
                  <span className="text-2xl font-bold text-orange-500">Rs. {(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
                  <span className="text-gray-400 line-through text-sm ml-2">Rs. {product.price}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-orange-500">Rs. {product.price}</span>
              )}
            </div>
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {product.inventory?.currentStock > 0 ? 'In Stock' : 'Out of Stock'}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// Hero Slide Component - Soft Cream Background, Dark Text, Orange CTA
const HeroSlide = ({ title, subtitle, ctaText, ctaLink, image, isActive }) => {
  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Soft Cream Background */}
      <div className="absolute inset-0 bg-soft-cream">
        {image && (
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover opacity-30"
          />
        )}
      </div>
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-orange-500 font-semibold uppercase tracking-wider text-sm">Pakistan's No.1 Store</span>
            <h1 className="text-4xl md:text-6xl font-bold text-dark mt-4 mb-4">
              {title}
            </h1>
            <p className="text-dark/70 text-lg mb-8">
              {subtitle}
            </p>
            <Link 
              to={ctaLink} 
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-orange-600 transition-all hover:scale-105 shadow-lg"
            >
              {ctaText} <FiChevronRight />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
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
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {count}{suffix}
      </div>
      <div className="flex items-center justify-center gap-2 text-orange-200">
        <Icon className="w-5 h-5" />
        <p className="text-sm md:text-base">{label}</p>
      </div>
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
  
  const { scrollYProgress } = useScroll();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Derive all sections from single products API call
  const featuredProducts = allProducts.filter(p => p.isFeatured).slice(0, 8);
  const dealsProducts = allProducts.filter(p => p.discount > 0).slice(0, 8);
  const newArrivals = [...allProducts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  const bestSellers = [...allProducts].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 8);
  const recommendedProducts = allProducts.slice(0, 8);

  // Hero slides data
  const heroSlides = [
    {
      title: "Summer Sale Extravaganza",
      subtitle: "Up to 70% off on selected items. Free shipping on orders over Rs. 5,000!",
      ctaText: "Shop Now",
      ctaLink: "/shop",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920"
    },
    {
      title: "Electronics Mega Deals",
      subtitle: "Latest gadgets at unbeatable prices. Limited time offer!",
      ctaText: "Explore Deals",
      ctaLink: "/shop?category=electronics",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1920"
    },
    {
      title: "Pakistani Fashion Week",
      subtitle: "Traditional & modern fusion. Exclusive collection from local designers.",
      ctaText: "Shop Collection",
      ctaLink: "/shop?category=fashion",
      image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920"
    }
  ];

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
      // Use mock data for demo
      setAllProducts([]);
      setCategories([]);
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
      toast.success('Successfully subscribed! Check your email for welcome offer.');
      setNewsletterEmail('');
      setNewsletterName('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const features = [
    { icon: FiTruck, title: "Free Shipping", desc: "On orders over Rs. 5,000" },
    { icon: FiRefreshCw, title: "Easy Returns", desc: "30-day return policy" },
    { icon: FiShield, title: "Secure Payment", desc: "100% secure transactions" },
    { icon: FiHeadphones, title: "24/7 Support", desc: "Pakistani customer service" }
  ];

  const brands = ["Khaadi", "Sapphire", "Gul Ahmed", "Alkaram", "ChenOne", "Outfitters", "Ego", "Bonanza"];

  return (
    <>
      <Helmet>
        <title>DesiCart - Pakistan's #1 Online Shopping Store</title>
        <meta name="description" content="Shop the best products at amazing prices. Free shipping across Pakistan. Best deals on electronics, fashion, home & more." />
      </Helmet>

      <div className="overflow-hidden">
        {/* Hero Slider - Soft Cream Background */}
        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={true}
          loop={true}
          className="hero-slider"
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={index}>
              {({ isActive }) => (
                <HeroSlide {...slide} isActive={isActive} />
              )}
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Features Section - White Background, Charcoal Text */}
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-100 transition-colors">
                    <feature.icon className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="font-bold text-charcoal text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-orange-500 font-semibold uppercase tracking-wider text-sm">Shop by Category</span>
              <h2 className="text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">Browse Categories</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Discover our curated collection of premium products</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.slice(0, 12).map((category, index) => (
                <motion.div
                  key={category._id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Link to={`/shop?category=${category.slug}`} className="block group">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 relative">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <h3 className="absolute bottom-4 left-0 right-0 text-white font-bold text-center text-sm">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Flash Sale Section - Deep Orange Background, White Text, White Button */}
        {dealsProducts.length > 0 && (
          <section className="py-20 bg-deep-orange">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full mb-4 backdrop-blur-sm">
                  <FiZap className="w-5 h-5" />
                  <span className="font-semibold">FLASH SALE</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">Hot Deals 🔥</h2>
                <p className="text-white/80 max-w-2xl mx-auto">Limited time offers - Grab them before they're gone!</p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dealsProducts.slice(0, 8).map((product, index) => (
                  <motion.div
                    key={product._id || index}
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
                <Link 
                  to="/shop?on-sale=true" 
                  className="inline-flex items-center gap-2 bg-white text-deep-orange px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
                >
                  View All Deals <FiChevronRight />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pattern)" />
            </svg>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard number={500000} suffix="+" label="Happy Customers" icon={FiUser} />
              <StatCard number={10000} suffix="+" label="Products" icon={FiPackage} />
              <StatCard number={500} suffix="+" label="Brands" icon={FiAward} />
              <StatCard number={50} suffix="+" label="Cities" icon={FiMapPin} />
            </div>
          </div>
        </section>

        {/* Featured Products - White Background, Dark Text, Orange CTA */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-orange-500 font-semibold uppercase tracking-wider text-sm">Best Sellers</span>
              <h2 className="text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">Featured Products</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Hand-picked premium products just for you</p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product, index) => (
                  <motion.div
                    key={product._id || index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* New Arrivals */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full mb-4">
                <FiClock className="w-5 h-5" />
                <span className="font-semibold">JUST ARRIVED</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">New Arrivals</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Be the first to get our latest products</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product._id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ProductCard product={product} type="new" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pakistani Heritage Banner */}
        <section className="relative py-24 bg-fixed bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1920')" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-900/95 to-red-900/95" />
          <div className="container mx-auto px-4 relative z-10 text-center text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <FiGift className="w-16 h-16 mx-auto mb-6" />
              <h2 className="text-4xl md:text-6xl font-bold mb-4">Eid Special Collection!</h2>
              <p className="text-xl md:text-2xl mb-4">Get Extra 20% OFF on prepaid orders</p>
              <p className="text-lg mb-8 opacity-90">Use code: <span className="font-mono bg-white/20 px-4 py-2 rounded-lg">DESICART20</span></p>
              <Link to="/shop" className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-2xl">
                Shop Now <FiChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Best Sellers Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-full mb-4">
                <FiTrendingUp className="w-5 h-5" />
                <span className="font-semibold">CUSTOMER FAVORITES</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-dark mt-2 mb-4">Best Sellers</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Our most popular products loved by thousands</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product._id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ProductCard product={product} type="bestseller" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section - Deep Orange Background */}
        <section className="relative py-24 overflow-hidden bg-deep-orange">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pattern2" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M30 30 L60 0 M0 30 L30 60" stroke="white" strokeWidth="1" fill="none" />
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
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FiMail className="w-10 h-10" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Join the DesiCart Family</h2>
              <p className="text-lg mb-8 opacity-90">
                Subscribe to get special offers, free giveaways, and exclusive deals.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Your name"
                  value={newsletterName}
                  onChange={(e) => setNewsletterName(e.target.value)}
                  className="flex-1 px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <input
                  type="email"
                  placeholder="Your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-8 py-3 bg-white text-orange-600 rounded-full font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'} <FiSend />
                </button>
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