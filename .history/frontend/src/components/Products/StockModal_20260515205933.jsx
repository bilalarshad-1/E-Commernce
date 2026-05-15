// components/products/StockModal.jsx
import React from 'react';
import { FiPackage, FiX } from 'react-icons/fi';

const StockModal = ({ isOpen, onClose, onConfirm, product, stockUpdate, setStockUpdate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Update Stock</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>
          
          {product && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FiPackage className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900">{product.productName}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Current Stock: {product.hasVariations && product.variations?.length > 0
                  ? product.variations.reduce((sum, v) => sum + (v.stock || 0), 0)
                  : product.inventory?.currentStock || 0} units
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {product?.hasVariations && product.variations?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variation</label>
                <select
                  value={stockUpdate.variationId}
                  onChange={(e) => setStockUpdate({ ...stockUpdate, variationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Variations</option>
                  {product.variations.map((v, i) => (
                    <option key={i} value={v._id}>
                      {v.name} (Current: {v.stock})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Update Type</label>
              <select
                value={stockUpdate.type}
                onChange={(e) => setStockUpdate({ ...stockUpdate, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="set">Set to specific quantity</option>
                <option value="increase">Increase by quantity</option>
                <option value="decrease">Decrease by quantity</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={stockUpdate.stock}
                onChange={(e) => setStockUpdate({ ...stockUpdate, stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min="0"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button onClick={onConfirm} className="btn-primary flex-1">
              Update Stock
            </button>
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockModal;