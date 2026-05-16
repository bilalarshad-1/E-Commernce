// components/orders/UpdateStatusModal.jsx
import React, { useState } from 'react';
import { FiX, FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiRotateCw } from 'react-icons/fi';

const UpdateStatusModal = ({ isOpen, onClose, onConfirm, currentStatus }) => {
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState('');

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: FiClock, color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', icon: FiCheckCircle, color: 'blue' },
    { value: 'processing', label: 'Processing', icon: FiPackage, color: 'purple' },
    { value: 'shipped', label: 'Shipped', icon: FiTruck, color: 'indigo' },
    { value: 'out_for_delivery', label: 'Out for Delivery', icon: FiTruck, color: 'orange' },
    { value: 'delivered', label: 'Delivered', icon: FiCheckCircle, color: 'green' },
    { value: 'cancelled', label: 'Cancelled', icon: FiXCircle, color: 'red' },
    { value: 'returned', label: 'Returned', icon: FiRotateCw, color: 'gray' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ status, message });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Status
              </label>
              <div className="space-y-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        status === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={status === option.value}
                        onChange={(e) => setStatus(e.target.value)}
                        className={`text-${option.color}-500 focus:ring-${option.color}-500`}
                      />
                      <Icon className={`h-5 w-5 text-${option.color}-500`} />
                      <span className="text-sm text-gray-700">{option.label}</span>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Add a note for the customer..."
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1">
                Update Status
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

export default UpdateStatusModal;