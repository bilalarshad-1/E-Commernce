import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { orderService } from '../services/orderService';
import Layout from '../components/Layout/Layout';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiPackage,
  FiHeart,
  FiShoppingBag,
  FiDollarSign,
  FiTruck,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiArrowRight,
  FiSettings,
  FiLogOut,
  FiMapPin,
  FiMail,
  FiPhone,
  FiCalendar,
  FiEye,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [recentOrders, setRecentOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    delivered: 0,
    pending: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getMyOrders({ limit: 10 });
      const orders = response.data.data || [];
      setRecentOrders(orders);
      
      // Calculate statistics
      const stats = {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
        delivered: orders.filter(o => o.status === 'delivered').length,
        pending: orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      };
      setOrderStats(stats);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: FiCheckCircle },
      processing: { color: 'bg-purple-100 text-purple-800', icon: FiRefreshCw },
      shipped: { color: 'bg-indigo-100 text-indigo-800', icon: FiTruck },
      out_for_delivery: { color: 'bg-orange-100 text-orange-800', icon: FiTruck },
      delivered: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FiXCircle }
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${c.color}`}>
        <Icon className="h-3 w-3" /> {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Chart data
  const monthlySpending = [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 0 },
    { month: 'May', amount: 0 },
    { month: 'Jun', amount: 0 }
  ];

  recentOrders.forEach(order => {
    const month = new Date(order.createdAt).getMonth();
    if (month < 6) {
      monthlySpending[month].amount += order.total;
    }
  });

  const orderStatusData = [
    { name: 'Delivered', value: orderStats.delivered, color: '#10b981' },
    { name: 'Pending', value: orderStats.pending, color: '#f59e0b' },
    { name: 'Cancelled', value: orderStats.cancelled, color: '#ef4444' }
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const QuickActionCard = ({ title, icon: Icon, onClick, color }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-all"
    >
      <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
    </motion.button>
  );

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white"
          >
            <div className="flex flex-wrap justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user?.firstName || 'Customer'}! 👋
                </h1>
                <p className="text-indigo-100">
                  Here's what's happening with your account today.
                </p>
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0">
                <Link to="/profile" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2">
                  <FiSettings /> Edit Profile
                </Link>
                <button onClick={logout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2">
                  <FiLogOut /> Logout
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Orders" 
              value={orderStats.totalOrders} 
              icon={FiPackage} 
              color="bg-blue-500"
            />
            <StatCard 
              title="Total Spent" 
              value={`$${orderStats.totalSpent.toFixed(2)}`} 
              icon={FiDollarSign} 
              color="bg-green-500"
            />
            <StatCard 
              title="Wishlist Items" 
              value={wishlistItems.length} 
              icon={FiHeart} 
              color="bg-red-500"
            />
            <StatCard 
              title="Cart Items" 
              value={cartCount} 
              icon={FiShoppingBag} 
              color="bg-purple-500"
              subtitle="Ready to checkout"
            />
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 mb-6 border-b">
            {[
              { id: 'overview', label: 'Overview', icon: FiUser },
              { id: 'orders', label: 'Recent Orders', icon: FiPackage },
              { id: 'analytics', label: 'Analytics', icon: FiDollarSign }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Quick Actions */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <QuickActionCard title="Shop Now" icon={FiShoppingBag} onClick={() => window.location.href = '/shop'} color="bg-indigo-600" />
                    <QuickActionCard title="My Orders" icon={FiPackage} onClick={() => window.location.href = '/orders'} color="bg-blue-600" />
                    <QuickActionCard title="Wishlist" icon={FiHeart} onClick={() => window.location.href = '/wishlist'} color="bg-red-600" />
                    <QuickActionCard title="Track Order" icon={FiTruck} onClick={() => window.location.href = '/orders'} color="bg-green-600" />
                    <QuickActionCard title="Support" icon={FiMail} onClick={() => window.location.href = '/contact'} color="bg-purple-600" />
                  </div>
                </div>

                {/* Profile Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiUser /> Profile Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiUser className="text-indigo-600" />
                        <span className="font-medium">Name:</span>
                        <span>{user?.firstName} {user?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiMail className="text-indigo-600" />
                        <span className="font-medium">Email:</span>
                        <span>{user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiPhone className="text-indigo-600" />
                        <span className="font-medium">Phone:</span>
                        <span>{user?.phone || 'Not provided'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCalendar className="text-indigo-600" />
                        <span className="font-medium">Member since:</span>
                        <span>{new Date(user?.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiMapPin className="text-indigo-600" />
                        <span className="font-medium">Default Address:</span>
                        <span>{user?.address ? `${user.address.city}, ${user.address.country}` : 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link to="/profile" className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1">
                      Edit Profile <FiArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FiClock /> Recent Activity
                    </h2>
                    <Link to="/orders" className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1">
                      View All <FiArrowRight />
                    </Link>
                  </div>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No orders yet</p>
                      <Link to="/shop" className="btn-primary inline-block mt-4">Start Shopping</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.slice(0, 5).map((order, index) => (
                        <div key={order._id} className="flex flex-wrap justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                          <div>
                            <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <p className="text-sm font-semibold text-gray-900 mt-1">${order.total.toFixed(2)}</p>
                          </div>
                          <Link to={`/order/${order._id}`} className="text-indigo-600 hover:text-indigo-700">
                            <FiEye className="h-5 w-5" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiPackage /> Recent Orders
                </h2>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">You haven't placed any orders yet</p>
                    <Link to="/shop" className="btn-primary inline-block mt-4">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map(order => (
                      <div key={order._id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {getStatusBadge(order.status)}
                            <p className="font-bold text-indigo-600">${order.total.toFixed(2)}</p>
                            <Link to={`/order/${order._id}`} className="btn-secondary text-sm py-2">
                              View Details
                            </Link>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="space-y-3">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-4">
                                <img src={item.productImage || 'https://via.placeholder.com/60'} alt={item.productName} className="w-12 h-12 object-cover rounded" />
                                <div className="flex-1">
                                  <p className="font-medium">{item.productName}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                                </div>
                                <p className="font-semibold">${item.total.toFixed(2)}</p>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-sm text-gray-500 text-center">+{order.items.length - 2} more items</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-center mt-6">
                      <Link to="/orders" className="btn-primary">View All Orders</Link>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Spending Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiDollarSign /> Monthly Spending
                  </h2>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlySpending}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                        <Bar dataKey="amount" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Order Status Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {orderStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Statistics</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-green-700">✅ Delivered Orders</span>
                        <span className="text-2xl font-bold text-green-700">{orderStats.delivered}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-700">⏳ Pending Orders</span>
                        <span className="text-2xl font-bold text-yellow-700">{orderStats.pending}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-red-700">❌ Cancelled Orders</span>
                        <span className="text-2xl font-bold text-red-700">{orderStats.cancelled}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-700">💰 Total Spent</span>
                        <span className="text-2xl font-bold text-blue-700">${orderStats.totalSpent.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Report */}
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Download Your Activity Report</h2>
                  <p className="text-gray-500 mb-4">Get a detailed summary of your orders and spending</p>
                  <button className="btn-primary inline-flex items-center gap-2">
                    <FiDownload /> Download Report
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;