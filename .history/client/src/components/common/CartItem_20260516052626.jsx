// components/common/CartItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex gap-4 p-4 bg-white rounded-lg shadow-sm"
    >
      {/* Product Image */}
      <Link to={`/product/${item.productId}`} className="flex-shrink-0">
        <img
          src={item.productImage || '/images/placeholder.jpg'}
          alt={item.productName}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1">
        <Link to={`/product/${item.productId}`}>
          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">
            {item.productName}
          </h3>
        </Link>
        {item.variationName && (
          <p className="text-sm text-gray-500 mt-1">Variation: {item.variationName}</p>
        )}
        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
        
        <div className="flex items-center justify-between mt-3">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.variationId, item.quantity - 1)}
              className="p-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
              disabled={item.quantity <= 1}
            >
              <FiMinus className="h-3 w-3" />
            </button>
            <span className="w-12 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.productId, item.variationId, item.quantity + 1)}
              className="p-1 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
              disabled={item.quantity >= item.inStock}
            >
              <FiPlus className="h-3 w-3" />
            </button>
          </div>

          {/* Price and Remove */}
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
            <button
              onClick={() => onRemove(item.productId, item.variationId)}
              className="text-red-500 text-sm hover:text-red-600 mt-1"
            >
              <FiTrash2 className="h-4 w-4 inline mr-1" />
              Remove
            </button>
          </div>
        </div>

        {/* Stock Warning */}
        {item.quantity >= item.inStock && (
          <p className="text-xs text-red-500 mt-2">
            Only {item.inStock} left in stock
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default CartItem;