import React from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';

const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, warning, productName }) => {
  if (!isOpen) return null;

  const displayTitle = title || 'Confirm Delete';
  const displayMessage = message || `Are you sure you want to delete "${productName || 'this item'}"?`;
  const displayWarning = warning || 'This action cannot be undone.';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-red-600">
              <FiAlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">{displayTitle}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-2">{displayMessage}</p>
          <p className="text-sm text-red-600 mb-6">{displayWarning}</p>
          
          <div className="flex gap-3">
            <button onClick={onConfirm} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Delete
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