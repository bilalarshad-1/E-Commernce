// components/pages/Customers/CustomerDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerAdminService } from '../../../services/customerApi';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiPackage,
  FiDollarSign,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw
} from 'react-icons/fi';
import { format } from 'date-fns';
import DeleteModal from '../../../components/admin/DeleteModal';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchCustomer();
    fetchAuditLogs();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await customerAdminService.getCustomer(id);
      setCustomer(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch customer');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await customerAdminService.getCustomerAuditLogs(id, { limit: 20 });
      setAuditLogs(response.data.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      await customerAdminService.deleteCustomer(id);
      toast.success('Customer deleted successfully');
      navigate('/customers');
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const handleStatusToggle = async () => {
    try {
      await customerAdminService.updateCustomer(id, { isActive: !customer.isActive });
      toast.success(`Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchCustomer();
    } catch (error) {
      toast.error('Failed to update customer status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
        <FiShield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
        <Link to="/customers" className="btn-primary inline-flex items-center gap-2">
          <FiArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Information', icon: FiShield },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
    { id: 'activity', label: 'Activity Log', icon: FiClock }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/customers" className="text-gray-600 hover:text-gray-900">
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-gray-600 mt-1">Customer ID: {customer._id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              customer.isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {customer.isActive ? <FiXCircle className="h-4 w-4" /> : <FiCheckCircle className="h-4 w-4" />}
            {customer.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <Link
            to={`/customers/edit/${id}`}
            className="btn-primary flex items-center gap-2"
          >
            <FiEdit2 className="h-4 w-4" />
            Edit Customer
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Profile Image */}
            <div className="flex justify-center">
              {customer.profileImage?.url ? (
                <img
                  src={customer.profileImage.url}
                  alt={customer.firstName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-2xl">
                    {customer.initials || `${customer.firstName?.[0]}${customer.lastName?.[0]}`}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Full Name</label>
                <p className="mt-1 text-gray-900">{customer.firstName} {customer.lastName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
                <div className="flex items-center gap-2 mt-1">
                  <FiMail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{customer.email}</p>
                  {customer.isEmailVerified ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Verified</span>
                  ) : (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">Unverified</span>
                  )}
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
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Account Status</label>
                <div className="mt-1">
                  {customer.isActive ? (
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-sm">Active</span>
                  ) : (
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-sm">Inactive</span>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Account Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <FiPackage className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{customer.totalOrders || 0}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <FiDollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">${(customer.totalSpent || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <FiCalendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-purple-600">
                    {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">Member Since</p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Newsletter</label>
                  <p className="mt-1">
                    {customer.newsletter ? (
                      <span className="text-green-600">Subscribed</span>
                    ) : (
                      <span className="text-gray-500">Not subscribed</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Language</label>
                  <p className="mt-1 capitalize">{customer.language || 'en'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Currency</label>
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

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer.firstName} ${customer.lastName}"?`}
        warning="This action cannot be undone. All customer data including orders and history will be permanently deleted."
      />
    </div>
  );
};

export default CustomerDetail;