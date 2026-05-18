// components/products/StockModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiX, FiRefreshCw, FiAlertCircle, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StockModal = ({ isOpen, onClose, onConfirm, product, stockUpdate, setStockUpdate }) => {
  const [currentStock, setCurrentStock] = useState(0);
  const [predictedStock, setPredictedStock] = useState(0);

  useEffect(() => {
    if (product) {
      let stock = 0;
      if (stockUpdate.variationId && product.hasVariations) {
        const variation = product.variations.find(v => v._id === stockUpdate.variationId);
        stock = variation?.stock || 0;
      } else if (product.hasVariations) {
        stock = product.variations?.reduce((sum, v) => sum + (v.stock || 0), 0);
      } else if (product.hasColors) {
        stock = product.colors?.reduce((sum, c) => sum + (c.stock || 0), 0);
      } else {
        stock = product.inventory?.currentStock || 0;
      }
      setCurrentStock(stock);
      calculatePredictedStock(stock, stockUpdate.stock, stockUpdate.type);
    }
  }, [product, stockUpdate]);

  const calculatePredictedStock = (current, change, type) => {
    if (type === 'set') {
      setPredictedStock(change);
    } else if (type === 'increase') {
      setPredictedStock(current + change);
    } else if (type === 'decrease') {
      setPredictedStock(Math.max(0, current - change));
    }
  };

  const handleStockChange = (value) => {
    const newStock = parseInt(value) || 0;
    setStockUpdate({ ...stockUpdate, stock: newStock });
    calculatePredictedStock(currentStock, newStock, stockUpdate.type);
  };

  const handleTypeChange = (type) => {
    setStockUpdate({ ...stockUpdate, type });
    calculatePredictedStock(currentStock, stockUpdate.stock, type);
  };

  if (!isOpen) return null;

  const getStockStatusColor = (stock) => {
    if (stock <= 0) return 'text-red-600';
    if (stock <= 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockIcon = (type) => {
    if (type === 'increase') return <FiTrendingUp className="h-4 w-4" />;
    if (type === 'decrease') return <FiTrendingDown className="h-4 w-4" />;
    return <FiRefreshCw className="h-4 w-4" />;
  };

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
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiRefreshCw className="h-6 w-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Update Stock</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              {product && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FiPackage className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{product.productName}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Current Stock: <span className={`font-semibold ${getStockStatusColor(currentStock)}`}>{currentStock}</span> units
                  </div>
                </motion.div>
              )}
              
              <div className="space-y-4">
                {product?.hasVariations && product.variations?.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Variation
                    </label>
                    <select
                      value={stockUpdate.variationId}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, variationId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['set', 'increase', 'decrease'].map((type) => (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleTypeChange(type)}
                        className={`px-3 py-2 rounded-lg border capitalize transition-all flex items-center justify-center gap-1 ${
                          stockUpdate.type === type
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-primary-400 text-gray-700'
                        }`}
                      >
                        {getStockIcon(type)}
                        {type}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={stockUpdate.stock}
                    onChange={(e) => handleStockChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    min="0"
                    placeholder="Enter quantity"
                  />
                </div>

                {stockUpdate.stock > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-blue-50 rounded-lg p-3"
                  >
                    <p className="text-sm text-blue-800 flex items-center gap-1">
                      <FiAlertCircle className="h-4 w-4" />
                      After update: <span className="font-semibold">{predictedStock}</span> units will be available
                    </p>
                  </motion.div>
                )}

                {stockUpdate.type === 'decrease' && stockUpdate.stock > currentStock && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 rounded-lg p-3"
                  >
                    <p className="text-sm text-red-800 flex items-center gap-1">
                      <FiAlertCircle className="h-4 w-4" />
                      Warning: Decreasing by more than current stock will result in negative stock!
                    </p>
                  </motion.div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  disabled={stockUpdate.stock < 0}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Update Stock
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StockModal;