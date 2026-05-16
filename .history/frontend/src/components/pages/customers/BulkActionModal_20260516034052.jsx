// components/admin/BulkActionModal.jsx
import React from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';

const BulkActionModal = ({ isOpen, onClose, onConfirm, count, action, setAction }) => {
  if (!isOpen) return null;

  const actions = [
    { value: 'activate', label: 'Activate Customers', color: 'green', icon: '✅' },
    { value: 'deactivate', label: 'Deactivate Customers', color: 'yellow', icon: '⚠️' },
    { value: 'delete', label: 'Delete Customers', color: 'red', icon: '🗑️' }
  ];

  const getActionColor = () => {
    switch(action) {
      case 'activate': return 'green';
      case 'deactivate': return 'yellow';
      case 'delete': return 'red';
      default: return 'gray';
    }
  };

  const getActionMessage = () => {
    switch(action) {
      case 'activate':
        return `Are you sure you want to activate ${count} customer${count > 1 ? 's' : ''}?`;
      case 'deactivate':
        return `Are you sure you want to deactivate ${count} customer${count > 1 ? 's' : ''}?`;
      case 'delete':
        return `Are you sure you want to delete ${count} customer${count > 1 ? 's' : ''}? This action cannot be undone.`;
      default:
        return `Are you sure you want to perform this action on ${count} customer${count > 1 ? 's' : ''}?`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiAlertCircle className={`h-6 w-6 text-${getActionColor()}-500`} />
              <h3 className="text-lg font-semibold text-gray-900">Bulk Action</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Action
              </label>
              <div className="space-y-2">
                {actions.map(act => (
                  <label
                    key={act.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      action === act.value
                        ? `border-${act.color}-500 bg-${act.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bulkAction"
                      value={act.value}
                      checked={action === act.value}
                      onChange={(e) => setAction(e.target.value)}
                      className={`text-${act.color}-500 focus:ring-${act.color}-500`}
                    />
                    <span className="text-sm text-gray-700">{act.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {action && (
              <div className={`p-4 rounded-lg bg-${getActionColor()}-50`}>
                <p className={`text-sm text-${getActionColor()}-700`}>
                  {getActionMessage()}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onConfirm}
              disabled={!action}
              className={`flex-1 bg-${getActionColor()}-600 text-white px-4 py-2 rounded-lg hover:bg-${getActionColor()}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Confirm Action
            </button>
            <button onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModal;