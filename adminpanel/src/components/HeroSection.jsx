// components/HeroSection.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import { heroService } from '../services/heroApi';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const HeroSection = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroSlides();
  }, []);

  const fetchHeroSlides = async () => {
    try {
      const response = await heroService.getHeroSlides();
      setSlides(response.data.data);
    } catch (error) {
      console.error('Fetch hero slides error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to DesiCart</h1>
          <p className="text-xl mb-8">India's Premium Shopping Destination</p>
          <Link to="/shop" className="inline-block bg-white text-orange-600 px-8 py-3 rounded-full font-semibold">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
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
      {slides.map((slide, index) => (
        <SwiperSlide key={slide._id}>
          <div 
            className="relative h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `linear-gradient(to right, ${slide.overlayColor || 'rgba(0,0,0,0.5)'}), url(${slide.bgImage.url})` }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative h-full flex items-center"
            >
              <div className="container mx-auto px-4">
                <div className="max-w-3xl text-white">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl md:text-3xl font-semibold mb-2"
                  >
                    {slide.subtitle}
                  </motion.h2>
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
                    style={{ color: slide.textColor || '#FFFFFF' }}
                  >
                    {slide.title}
                  </motion.h1>
                  {slide.description && (
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="text-lg md:text-xl mb-8 text-gray-200"
                    >
                      {slide.description}
                    </motion.p>
                  )}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 }}
                  >
                    <Link 
                      to={slide.buttonUrl}
                      className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-2xl ${
                        slide.buttonStyle === 'primary' 
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : slide.buttonStyle === 'secondary'
                          ? 'bg-white text-gray-900 hover:bg-gray-100'
                          : 'border-2 border-white text-white hover:bg-white hover:text-gray-900'
                      }`}
                      style={{ backgroundColor: slide.buttonStyle === 'primary' ? slide.buttonColor : undefined }}
                    >
                      {slide.buttonText}
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default HeroSection;