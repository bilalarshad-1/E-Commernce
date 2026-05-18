import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTruck, FiLoader, FiMapPin, FiCalendar } from 'react-icons/fi';

const TrackingModal = ({ isOpen, onClose, onConfirm, order, updating }) => {
  const [trackingData, setTrackingData] = useState({
    number: order?.tracking?.number || '',
    carrier: order?.tracking?.carrier || '',
    url: order?.tracking?.url || '',
    estimatedDelivery: order?.tracking?.estimatedDelivery || ''
  });

  const carriers = [
    'USPS', 'UPS', 'FedEx', 'DHL', 'Canada Post', 
    'Royal Mail', 'Australia Post', 'China Post', 
    'Singapore Post', 'Other'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(trackingData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiTruck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Add Tracking Information</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Add tracking details for order #{order?.orderNumber}. Customer will be notified via email.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carrier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={trackingData.carrier}
                    onChange={(e) => setTrackingData({ ...trackingData, carrier: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Carrier</option>
                    {carriers.map(carrier => (
                      <option key={carrier} value={carrier}>{carrier}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={trackingData.number}
                    onChange={(e) => setTrackingData({ ...trackingData, number: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking URL
                  </label>
                  <input
                    type="url"
                    value={trackingData.url}
                    onChange={(e) => setTrackingData({ ...trackingData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://track.carrier.com/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Customer can click to track package</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={trackingData.estimatedDelivery ? trackingData.estimatedDelivery.split('T')[0] : ''}
                    onChange={(e) => setTrackingData({ ...trackingData, estimatedDelivery: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700 flex items-start gap-2">
                    <FiMapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Order will be marked as "Shipped" after adding tracking information. Customer will receive a shipping confirmation email.</span>
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <FiLoader className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Tracking'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TrackingModal;