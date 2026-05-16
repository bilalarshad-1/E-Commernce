// components/admin/CustomerDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiMail, FiPhone, FiCalendar, FiMapPin, FiPackage, FiDollarSign, FiShield, FiClock, FiEdit2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { customerAdminService } from '../';
import toast from 'react-hot-toast';

const CustomerDetailsModal = ({ isOpen, onClose, customer, onUpdate }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (isOpen && customer) {
      fetchAuditLogs();
    }
  }, [isOpen, customer]);

  const fetchAuditLogs = async () => {
    if (!customer) return;
    try {
      const response = await customerAdminService.getCustomerAuditLogs(customer._id, { limit: 10 });
      setAuditLogs(response.data.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const handleStatusToggle = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      await customerAdminService.updateCustomer(customer._id, { isActive: !customer.isActive });
      toast.success(`Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully`);
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to update customer status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !customer) return null;

  const tabs = [
    { id: 'info', label: 'Information', icon: FiShield },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
    { id: 'activity', label: 'Activity Log', icon: FiClock }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {customer.profileImage?.url ? (
                <img
                  src={customer.profileImage.url}
                  alt={customer.firstName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-lg">
                    {customer.initials || `${customer.firstName?.[0]}${customer.lastName?.[0]}`}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {customer.firstName} {customer.lastName}
                </h3>
                <p className="text-sm text-gray-500">Customer ID: {customer._id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStatusToggle}
                disabled={loading}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  customer.isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {customer.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-4">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">First Name</label>
                    <p className="mt-1 text-gray-900">{customer.firstName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Last Name</label>
                    <p className="mt-1 text-gray-900">{customer.lastName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <FiMail className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{customer.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Phone Number</label>
                    <div className="flex items-center gap-2 mt-1">
                      <FiPhone className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{customer.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                    <div className="flex items-center gap-2 mt-1">
                      <FiCalendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">
                        {customer.dateOfBirth ? format(new Date(customer.dateOfBirth), 'MMM dd, yyyy') : 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Gender</label>
                    <p className="mt-1 text-gray-900 capitalize">{customer.gender || 'Not specified'}</p>
                  </div>
                </div>

                {/* Account Stats */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Account Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <FiPackage className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-blue-600">{customer.totalOrders || 0}</p>
                      <p className="text-xs text-gray-600">Total Orders</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <FiDollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-600">${(customer.totalSpent || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-600">Total Spent</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <FiCalendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-purple-600">
                        {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-600">Member Since</p>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Preferences</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Newsletter</label>
                      <p className="mt-1">
                        {customer.newsletter ? (
                          <span className="text-green-600">Subscribed</span>
                        ) : (
                          <span className="text-gray-500">Not subscribed</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Language</label>
                      <p className="mt-1 capitalize">{customer.language || 'en'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Currency</label>
                      <p className="mt-1">{customer.currency || 'USD'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-4">
                {customer.addresses && customer.addresses.length > 0 ? (
                  customer.addresses.map((address, index) => (
                    <div key={index} className="border rounded-lg p-4 relative">
                      {address.isDefault && (
                        <span className="absolute top-2 right-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                      <div className="space-y-2">
                        <p className="font-medium">{address.fullName}</p>
                        <p className="text-sm text-gray-600">
                          {address.addressLine1}
                          {address.addressLine2 && <>, {address.addressLine2}</>}
                          <br />
                          {address.city}, {address.state} {address.postalCode}
                          <br />
                          {address.country}
                        </p>
                        {address.phone && (
                          <p className="text-sm text-gray-500">
                            <FiPhone className="h-3 w-3 inline mr-1" />
                            {address.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 capitalize">
                          Type: {address.type}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No addresses saved
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log, index) => (
                    <div key={index} className="border-l-4 border-primary-500 bg-gray-50 p-3 rounded-r-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{log.action}</p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <pre className="text-xs text-gray-600 mt-1">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>IP: {log.ipAddress}</span>
                        <span>•</span>
                        <span className={log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No activity logs available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;