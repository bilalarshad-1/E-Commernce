// components/orders/TrackingModal.jsx
import React, { useState } from 'react';
import { FiX, FiTruck } from 'react-icons/fi';

const TrackingModal = ({ isOpen, onClose, onConfirm, order }) => {
  const [trackingData, setTrackingData] = useState({
    number: order?.tracking?.number || '',
    carrier: order?.tracking?.carrier || '',
    url: order?.tracking?.url || '',
    estimatedDelivery: order?.tracking?.estimatedDelivery || ''
  });

  const carriers = ['USPS', 'UPS', 'FedEx', 'DHL', 'Canada Post', 'Royal Mail', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(trackingData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiTruck className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Add Tracking Information</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carrier
              </label>
              <select
                value={trackingData.carrier}
                onChange={(e) => setTrackingData({ ...trackingData, carrier: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Carrier</option>
                {carriers.map(carrier => (
                  <option key={carrier} value={carrier}>{carrier}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingData.number}
                onChange={(e) => setTrackingData({ ...trackingData, number: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter tracking number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking URL (Optional)
              </label>
              <input
                type="url"
                value={trackingData.url}
                onChange={(e) => setTrackingData({ ...trackingData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Delivery Date
              </label>
              <input
                type="date"
                value={trackingData.estimatedDelivery.split('T')[0]}
                onChange={(e) => setTrackingData({ ...trackingData, estimatedDelivery: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1">
                Add Tracking
              </button>
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrackingModal;