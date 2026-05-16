// pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { useQuery } from 'react-query';
import { productService } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import Loader from '../components/common/Loader';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const Home = () => {
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery(
    'featured-products',
    () => productService.getFeaturedProducts().then(res => res.data.data)
  );

  const { data: newArrivals, isLoading: newArrivalsLoading } = useQuery(
    'new-arrivals',
    () => productService.getNewArrivals().then(res => res.data.data)
  );

  const banners = [
    {
      id: 1,
      title: 'Summer Sale',
      subtitle: 'Up to 50% Off',
      description: 'Shop the latest summer collection',
      image: '/images/banner1.jpg',
      cta: 'Shop Now',
      link: '/shop?category=summer',
      bgColor: 'bg-gradient-to-r from-orange-500 to-red-500'
    },
    {
      id: 2,
      title: 'Electronics',
      subtitle: 'New Arrivals',
      description: 'Latest tech at best prices',
      image: '/images/banner2.jpg',
      cta: 'Explore',
      link: '/shop?category=electronics',
      bgColor: 'bg-gradient-to-r from-blue-500 to-purple-500'
    },
    {
      id: 3,
      title: 'Fashion',
      subtitle: 'Trendy Collection',
      description: 'Stay stylish this season',
      image: '/images/banner3.jpg',
      cta: 'Shop Fashion',
      link: '/shop?category=fashion',
      bgColor: 'bg-gradient-to-r from-pink-500 to-rose-500'
    }
  ];

  const categories = [
    { id: 1, name: 'Electronics', icon: '📱', count: 245, color: 'bg-blue-500' },
    { id: 2, name: 'Fashion', icon: '👕', count: 189, color: 'bg-pink-500' },
    { id: 3, name: 'Home & Living', icon: '🏠', count: 156, color: 'bg-green-500' },
    { id: 4, name: 'Books', icon: '📚', count: 98, color: 'bg-purple-500' },
    { id: 5, name: 'Sports', icon: '⚽', count: 134, color: 'bg-orange-500' },
    { id: 6, name: 'Toys', icon: '🎮', count: 87, color: 'bg-red-500' },
  ];

  const features = [
    { icon: '🚚', title: 'Free Shipping', description: 'On orders over $50' },
    { icon: '🔄', title: '30-Day Returns', description: 'Easy returns policy' },
    { icon: '💳', title: 'Secure Payment', description: '100% secure transactions' },
    { icon: '🎁', title: 'Gift Cards', description: 'For every occasion' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        effect="fade"
        className="h-[500px] md:h-[600px]"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className={`relative h-full ${banner.bgColor}`}>
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative h-full flex items-center justify-center text-center text-white">
                <div className="px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <p className="text-lg md:text-xl uppercase tracking-wider mb-2">
                      {banner.subtitle}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                      {banner.title}
                    </h1>
                    <p className="text-base md:text-lg mb-8 max-w-md mx-auto">
                      {banner.description}
                    </p>
                    <Link
                      to={banner.link}
                      className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
                    >
                      {banner.cta}
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of categories and find exactly what you're looking for
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Link
                  to={`/shop?category=${category.name.toLowerCase()}`}
                  className="block text-center"
                >
                  <div className={`${category.color} w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 shadow-lg`}>
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.count} products</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our hand-picked selection of trending products
            </p>
          </motion.div>

          {featuredLoading ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              New Arrivals
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Check out the latest products added to our collection
            </p>
          </motion.div>

          {newArrivalsLoading ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals?.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
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

      {/* Newsletter Section */}
      <section className="py-16 bg-primary-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-primary-100 mb-8 max-w-md mx-auto">
              Get the latest updates on new products and upcoming sales
            </p>
            <form className="max-w-md mx-auto flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;