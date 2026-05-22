import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import ProductCard from '../components/common/ProductCard';
import Layout from '../components/Layout/Layout';
import { motion } from 'framer-motion';
import { FiTruck, FiShield, FiRefreshCw, FiHeadphones, FiArrowRight } from 'react-icons/fi';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [featuredRes, productsRes] = await Promise.all([
        productService.getFeaturedProducts(8),
        productService.getProducts({ limit: 12, sort: '-createdAt' })
      ]);
      setFeaturedProducts(featuredRes.data.data || []);
      setNewArrivals(productsRes.data.data?.slice(0, 8) || []);
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: FiTruck, title: 'Free Shipping', description: 'On orders over $100' },
    { icon: FiShield, title: 'Secure Payment', description: '100% secure transactions' },
    { icon: FiRefreshCw, title: 'Easy Returns', description: '30-day return policy' },
    { icon: FiHeadphones, title: '24/7 Support', description: 'Dedicated support team' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Shop the Best Products at Amazing Prices
              </h1>
              <p className="text-lg mb-8 text-indigo-100">
                Discover thousands of products from top brands. Free shipping on orders over $100.
              </p>
              <Link to="/shop" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                Shop Now <FiArrowRight />
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden md:block"
            >
              <img src="/hero-image.png" alt="Shopping" className="w-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="text-2xl text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
            <p className="text-gray-600">Hand-picked products just for you</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Banner */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Summer Sale!</h2>
          <p className="text-xl mb-6">Get up to 50% off on selected items</p>
          <Link to="/shop" className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Shop Sale
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-2">New Arrivals</h2>
            <p className="text-gray-600">Check out our latest products</p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} type="new" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;