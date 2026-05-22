import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || 'Pakistan'
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(profileData);
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    const result = await changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
    
    if (result.success) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <p className="text-indigo-100 mt-1">Manage your account information</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiUser /> Profile Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'password'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiLock /> Change Password
              </button>
            </div>

            {/* Profile Form */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="input-field bg-gray-50"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiMapPin /> Shipping Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        name="address.street"
                        value={profileData.address.street}
                        onChange={handleProfileChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="address.city"
                        value={profileData.address.city}
                        onChange={handleProfileChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                      <input
                        type="text"
                        name="address.state"
                        value={profileData.address.state}
                        onChange={handleProfileChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        name="address.postalCode"
                        value={profileData.address.postalCode}
                        onChange={handleProfileChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        name="address.country"
                        value={profileData.address.country}
                        onChange={handleProfileChange}
                        className="input-field"
                      >
                        <option value="Pakistan">Pakistan</option>
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <FiSave />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Password Form */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <FiLock />}
                    Change Password
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;