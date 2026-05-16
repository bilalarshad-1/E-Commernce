// pages/admin/customers/CustomersList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerAdminService } from '../../../services/customerApi';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiMail,
  FiPhone,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiDollarSign,
  FiPackage,
  FiUserCheck,
  FiUserX,
  FiDownload,
  FiUpload
} from 'react-icons/fi';
import { format } from 'date-fns';
import DeleteModal from '../../../components/pages/customers/DeleteModal';
import CustomerDetailsModal from '../../../components/pages/customers/CustomerDetailsModal';
import BulkActionModal from '../../../components/pages/customers/BulkActionModal';

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isActive: 'all',
    isEmailVerified: 'all',
    sortBy: '-createdAt'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [stats, setStats] = useState(null);
  const [bulkAction, setBulkAction] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [currentPage, filters]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        sort: filters.sortBy,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.isActive !== 'all' && { isActive: filters.isActive === 'active' }),
        ...(filters.isEmailVerified !== 'all' && { isEmailVerified: filters.isEmailVerified === 'verified' })
      };
      const response = await customerAdminService.getCustomers(params);
      setCustomers(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setTotalCustomers(response.data.pagination.total);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await customerAdminService.getCustomerStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      await customerAdminService.deleteCustomer(selectedCustomer._id);
      toast.success('Customer deleted successfully');
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      fetchCustomers();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleBulkAction = async () => {
    if (!selectedCustomers.length) return;
    
    try {
      if (bulkAction === 'activate') {
        await customerAdminService.bulkUpdateStatus(selectedCustomers, true);
        toast.success(`${selectedCustomers.length} customers activated`);
      } else if (bulkAction === 'deactivate') {
        await customerAdminService.bulkUpdateStatus(selectedCustomers, false);
        toast.success(`${selectedCustomers.length} customers deactivated`);
      } else if (bulkAction === 'delete') {
        await customerAdminService.bulkDelete(selectedCustomers);
        toast.success(`${selectedCustomers.length} customers deleted`);
      }
      
      setSelectedCustomers([]);
      setShowBulkModal(false);
      fetchCustomers();
      fetchStats();
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c._id));
    }
  };

  const handleSelectCustomer = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Email Verified', 'Total Orders', 'Total Spent', 'Joined Date'];
    const csvData = customers.map(customer => [
      `${customer.firstName} ${customer.lastName}`,
      customer.email,
      customer.phone || 'N/A',
      customer.isActive ? 'Active' : 'Inactive',
      customer.isEmailVerified ? 'Verified' : 'Unverified',
      customer.totalOrders || 0,
      `$${(customer.totalSpent || 0).toFixed(2)}`,
      format(new Date(customer.createdAt), 'MM/dd/yyyy')
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getStatusBadge = (customer) => {
    if (!customer.isActive) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
  };

  const getVerificationBadge = (customer) => {
    if (customer.isEmailVerified) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Verified</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage your customer accounts and preferences</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={fetchCustomers}
            className="btn-secondary flex items-center gap-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Customers" 
            value={stats.totalCustomers || 0} 
            icon={FiUsers} 
            color="bg-blue-500"
          />
          <StatCard 
            title="Active Customers" 
            value={stats.activeCustomers || 0} 
            icon={FiUserCheck} 
            color="bg-green-500"
          />
          <StatCard 
            title="Verified Email" 
            value={stats.verifiedCustomers || 0} 
            icon={FiMail} 
            color="bg-purple-500"
            subtitle={`${((stats.verifiedCustomers / stats.totalCustomers) * 100).toFixed(1)}%`}
          />
          <StatCard 
            title="New This Month" 
            value={stats.newCustomersThisMonth || 0} 
            icon={FiCalendar} 
            color="bg-orange-500"
          />
        </div>
      )}

      {/* Top Spenders */}
      {stats?.topSpenders?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiDollarSign className="h-5 w-5" />
            Top Spending Customers
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total Spent</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.topSpenders.map((customer, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm font-medium">{customer.firstName} {customer.lastName}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{customer.email}</td>
                    <td className="px-4 py-2 text-sm text-right font-semibold text-green-600">
                      ${(customer.totalSpent || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right">{customer.totalOrders || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <FiFilter className="h-4 w-4" />
              Filters
            </button>
            {selectedCustomers.length > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FiUpload className="h-4 w-4" />
                Bulk Action ({selectedCustomers.length})
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <select
                  value={filters.isActive}
                  onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Verification</label>
                <select
                  value={filters.isEmailVerified}
                  onChange={(e) => setFilters({ ...filters, isEmailVerified: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="-createdAt">Newest First</option>
                  <option value="createdAt">Oldest First</option>
                  <option value="-totalSpent">Highest Spent</option>
                  <option value="-totalOrders">Most Orders</option>
                  <option value="firstName">Name A-Z</option>
                  <option value="-firstName">Name Z-A</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilters({ isActive: 'all', isEmailVerified: 'all', sortBy: '-createdAt' });
                  setSearchTerm('');
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
          <FiUsers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600">No customers match your search criteria</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === customers.length && customers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer._id)}
                          onChange={() => handleSelectCustomer(customer._id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {customer.profileImage?.url ? (
                            <img
                              src={customer.profileImage.url}
                              alt={customer.firstName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {customer.initials || `${customer.firstName?.[0]}${customer.lastName?.[0]}`}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-xs text-gray-500">ID: {customer._id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <FiMail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <FiPhone className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(customer)}</td>
                      <td className="px-4 py-3">{getVerificationBadge(customer)}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {customer.totalOrders || 0}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                        ${(customer.totalSpent || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <Link
                            to={`/admin/customers/edit/${customer._id}`}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Customer"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages} ({totalCustomers} total)
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete "${selectedCustomer?.firstName} ${selectedCustomer?.lastName}"?`}
        warning="This action cannot be undone. All customer data including orders and history will be permanently deleted."
      />

      <CustomerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onUpdate={fetchCustomers}
      />

      <BulkActionModal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkAction(null);
        }}
        onConfirm={handleBulkAction}
        count={selectedCustomers.length}
        action={bulkAction}
        setAction={setBulkAction}
      />
    </div>
  );
};

export default CustomersList;