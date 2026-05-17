// src/pages/HomePage.jsx - ULTRA PREMIUM VERSION
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import toast from 'react-hot-toast';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterName, setNewsletterName] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchAllData();
    window.scrollTo(0, 0);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [featuredRes, newRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { params: { isFeatured: true, limit: 8 } }),
        axios.get(`${API_URL}/products`, { params: { sort: '-createdAt', limit: 8 } }),
        axios.get(`${API_URL}/categories`, { params: { status: 'active', limit: 20 } })
      ]);
      
      setFeaturedProducts(featuredRes.data.data || []);
      setNewArrivals(newRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      
      // Sample testimonials
      setTestimonials([
        { id: 1, name: "Sarah Johnson", role: "Fashion Blogger", rating: 5, text: "Absolutely love the quality! Best shopping experience ever.", image: "https://randomuser.me/api/portraits/women/1.jpg" },
        { id: 2, name: "Michael Chen", role: "Tech Enthusiast", rating: 5, text: "Fast shipping and premium products. Will definitely shop again!", image: "https://randomuser.me/api/portraits/men/2.jpg" },
        { id: 3, name: "Emma Williams", role: "Fashion Designer", rating: 5, text: "The variety and quality are unmatched. Highly recommended!", image: "https://randomuser.me/api/portraits/women/3.jpg" }
      ]);
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
      await axios.post(`${API_URL}/newsletter/subscribe`, {
        email: newsletterEmail,
        name: newsletterName
      });
      toast.success('Successfully subscribed to newsletter! Check your email for welcome offer.');
      setNewsletterEmail('');
      setNewsletterName('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  // Hero slides data
  const heroSlides = [
    {
      title: "Premium Collection 2024",
      subtitle: "Discover the latest trends",
      bgImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920",
      color: "from-amber-600 to-orange-600"
    },
    {
      title: "Summer Sale",
      subtitle: "Up to 50% off",
      bgImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920",
      color: "from-pink-600 to-rose-600"
    },
    {
      title: "New Arrivals",
      subtitle: "Shop the latest fashion",
      bgImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920",
      color: "from-blue-600 to-cyan-600"
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Slider */}
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        navigation
        className="h-screen"
      >
        {heroSlides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div 
              className="relative h-screen bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url(${slide.bgImage})` }}
            >
              <div className="absolute inset-0 bg-black/30" />
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative h-full flex items-center justify-center text-center"
              >
                <div className="text-white px-4">
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4"
                  >
                    {slide.title}
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl md:text-2xl mb-8"
                  >
                    {slide.subtitle}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Link 
                      to="/shop" 
                      className="inline-block px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:scale-105 transition-transform duration-300 shadow-2xl"
                    >
                      Shop Now
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Categories Section - Premium */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-indigo-600 font-semibold uppercase tracking-wider text-sm">Shop by Category</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-4">Browse Categories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover our curated collection of premium products</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.slice(0, 8).map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer"
              >
                <Link to={`/shop?category=${category.slug}`}>
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={category.image?.url || `https://placehold.co/400x400/4F46E5/white?text=${category.name}`}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-center pb-6">
                    <h3 className="text-white text-xl font-bold text-center group-hover:text-indigo-300 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number={50000} suffix="+" label="Happy Customers" />
            <StatCard number={1000} suffix="+" label="Products" />
            <StatCard number={50} suffix="+" label="Brands" />
            <StatCard number={30} suffix="+" label="Countries" />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-indigo-600 font-semibold uppercase tracking-wider text-sm">Our Best Sellers</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-4">Featured Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Hand-picked premium products just for you</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 }
              }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="pb-12"
            >
              {featuredProducts.map((product) => (
                <SwiperSlide key={product._id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* Banner Section */}
      <section className="relative py-32 bg-fixed bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/90" />
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Limited Time Offer</h2>
            <p className="text-xl mb-8">Get up to 50% off on selected items</p>
            <Link to="/shop" className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-2xl">
              Shop Sale
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-indigo-600 font-semibold uppercase tracking-wider text-sm">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-4">What Our Customers Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Join thousands of satisfied customers worldwide</p>
          </motion.div>

          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 }
            }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            className="pb-12"
          >
            {testimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <motion.div 
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-2xl p-8 shadow-lg text-center"
                >
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden">
                    <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Premium Newsletter Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="white" />
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
            className="max-w-3xl mx-auto text-center text-white"
          >
            <div className="text-6xl mb-6">📧</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Join Our Newsletter</h2>
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
                className="px-8 py-3 bg-white text-indigo-600 rounded-full font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            
            <p className="text-sm mt-6 opacity-75">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-12 bg-white border-t border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[1,2,3,4,5,6].map((brand) => (
              <motion.img
                key={brand}
                whileHover={{ scale: 1.1 }}
                src={`https://placehold.co/150x60/4F46E5/white?text=Brand${brand}`}
                alt={`Brand ${brand}`}
                className="h-12 opacity-60 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ number, suffix, label }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.5 });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-bold">
        {inView ? <CountUp end={number} duration={2.5} /> : 0}{suffix}
      </div>
      <p className="text-sm md:text-base mt-2 opacity-80">{label}</p>
    </motion.div>
  );
};

export default HomePage;