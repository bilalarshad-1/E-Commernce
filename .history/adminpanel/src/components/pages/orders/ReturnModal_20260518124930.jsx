import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiRotateCw, FiLoader, FiAlertCircle, FiDollarSign } from 'react-icons/fi';

const ReturnModal = ({ isOpen, onClose, onConfirm, order, updating }) => {
  const [returnData, setReturnData] = useState({
    action: 'approve',
    refundAmount: order?.total || 0,
    adminNotes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(returnData);
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
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FiRotateCw className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Process Return Request</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Return Request Details */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Return Request Details</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Reason</p>
                    <p className="text-sm text-gray-900">{order?.return?.reason}</p>
                  </div>
                  {order?.return?.reasonDetails && (
                    <div>
                      <p className="text-xs text-gray-500">Details</p>
                      <p className="text-sm text-gray-900">{order.return.reasonDetails}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Requested At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(order?.return?.requestedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Decision
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      returnData.action === 'approve'
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="action"
                        value="approve"
                        checked={returnData.action === 'approve'}
                        onChange={(e) => setReturnData({ ...returnData, action: e.target.value })}
                        className="text-green-500 focus:ring-green-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Approve Return</p>
                        <p className="text-xs text-gray-500">Accept return and process refund</p>
                      </div>
                    </label>
                    
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      returnData.action === 'reject'
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="action"
                        value="reject"
                        checked={returnData.action === 'reject'}
                        onChange={(e) => setReturnData({ ...returnData, action: e.target.value })}
                        className="text-red-500 focus:ring-red-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">Reject Return</p>
                        <p className="text-xs text-gray-500">Decline return request</p>
                      </div>
                    </label>
                  </div>
                </div>

                {returnData.action === 'approve' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center gap-1">
                        <FiDollarSign className="h-4 w-4" />
                        Refund Amount
                      </div>
                    </label>
                    <input
                      type="number"
                      value={returnData.refundAmount}
                      onChange={(e) => setReturnData({ ...returnData, refundAmount: parseFloat(e.target.value) })}
                      step="0.01"
                      min="0"
                      max={order?.total}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum refund: ${order?.total?.toFixed(2)}</p>
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    value={returnData.adminNotes}
                    onChange={(e) => setReturnData({ ...returnData, adminNotes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add notes for the customer about this decision..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Customer will be notified via email</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-sm text-yellow-700 flex items-start gap-2">
                    <FiAlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>This action will notify the customer and {returnData.action === 'approve' ? 'process refund' : 'reject the return'}.</span>
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={updating}
                    className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      returnData.action === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {updating ? (
                      <>
                        <FiLoader className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      returnData.action === 'approve' ? 'Approve Return' : 'Reject Return'
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

export default ReturnModal;