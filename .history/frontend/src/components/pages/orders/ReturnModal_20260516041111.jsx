// components/orders/ReturnModal.jsx
import React, { useState } from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';

const ReturnModal = ({ isOpen, onClose, onConfirm, order }) => {
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiRefreshCw className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Process Return Request</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Reason:</strong> {order?.return?.reason}
            </p>
            {order?.return?.reasonDetails && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Details:</strong> {order.return.reasonDetails}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-green-500">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={returnData.action === 'approve'}
                    onChange={(e) => setReturnData({ ...returnData, action: e.target.value })}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Approve Return</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-red-500">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={returnData.action === 'reject'}
                    onChange={(e) => setReturnData({ ...returnData, action: e.target.value })}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Reject Return</span>
                </label>
              </div>
            </div>

            {returnData.action === 'approve' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount
                </label>
                <input
                  type="number"
                  value={returnData.refundAmount}
                  onChange={(e) => setReturnData({ ...returnData, refundAmount: parseFloat(e.target.value) })}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: ${order?.total?.toFixed(2)}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes
              </label>
              <textarea
                value={returnData.adminNotes}
                onChange={(e) => setReturnData({ ...returnData, adminNotes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Add notes for the customer..."
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                returnData.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}>
                {returnData.action === 'approve' ? 'Approve Return' : 'Reject Return'}
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

export default ReturnModal;