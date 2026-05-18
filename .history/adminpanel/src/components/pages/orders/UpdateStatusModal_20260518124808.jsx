import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiPackage, FiTruck, FiCheckCircle, FiClock, 
  FiXCircle, FiRotateCw, FiLoader, FiTruck as FiDelivery 
} from 'react-icons/fi';

const UpdateStatusModal = ({ isOpen, onClose, onConfirm, currentStatus, updating }) => {
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: FiClock, color: 'yellow', description: 'Order received, waiting for confirmation' },
    { value: 'confirmed', label: 'Confirmed', icon: FiCheckCircle, color: 'blue', description: 'Order confirmed and being processed' },
    { value: 'processing', label: 'Processing', icon: FiPackage, color: 'purple', description: 'Order is being prepared' },
    { value: 'shipped', label: 'Shipped', icon: FiTruck, color: 'indigo', description: 'Order has been shipped' },
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: FiDelivery, color: 'orange', description: 'Out for delivery' },
    { value: 'delivered', label: 'Delivered', icon: FiCheckCircle, color: 'green', description: 'Order delivered to customer' },
    { value: 'cancelled', label: 'Cancelled', icon: FiXCircle, color: 'red', description: 'Order cancelled' },
    { value: 'returned', label: 'Returned', icon: FiRotateCw, color: 'gray', description: 'Order returned by customer' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ status, message });
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
                <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select New Status
                  </label>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = status === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? `border-${option.color}-500 bg-${option.color}-50 ring-2 ring-${option.color}-200`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={option.value}
                            checked={isSelected}
                            onChange={(e) => setStatus(e.target.value)}
                            className={`mt-0.5 text-${option.color}-500 focus:ring-${option.color}-500`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 text-${option.color}-500`} />
                              <span className="font-medium text-gray-900">{option.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add a note for the customer about this status update..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Customer will be notified via email</p>
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
                        Updating...
                      </>
                    ) : (
                      'Update Status'
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

export default UpdateStatusModal;