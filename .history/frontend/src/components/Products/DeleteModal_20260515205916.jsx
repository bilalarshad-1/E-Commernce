// components/products/DeleteModal.jsx
import React from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';

const DeleteModal = ({ isOpen, onClose, onConfirm, productName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-red-600">
              <FiAlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-2">
            Are you sure you want to delete <span className="font-semibold text-gray-900">"{productName}"</span>?
          </p>
          <p className="text-sm text-red-600 mb-6">
            This action cannot be undone. This will permanently delete the product and all associated data.
          </p>
          
          <div className="flex gap-3">
            <button onClick={onConfirm} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Delete Product
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;