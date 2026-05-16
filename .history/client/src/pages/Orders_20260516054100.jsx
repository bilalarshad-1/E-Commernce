// pages/Orders.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { orderService } from '../services/api';
import { FiPackage, FiClock, FiCheckCircle, FiTruck, FiXCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import Loader from '../components/common/Loader';

const Orders = () => {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery(['orders', statusFilter], () =>
    orderService.getMyOrders({ status: statusFilter }).then(res => res.data)
  );

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FiClock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed': return <FiCheckCircle className="h-5 w-5 text-blue-500" />;
      case 'processing': return <FiPackage className="h-5 w-5 text-purple-500" />;
      case 'shipped': return <FiTruck className="h-5 w-5 text-indigo-500" />;
      case 'delivered': return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled': return <FiXCircle className="h-5 w-5 text-red-500" />;
      default: return <FiPackage className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statuses = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (isLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {statuses.map(status => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {data?.data?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <FiPackage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
            <Link
              to="/shop"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.data?.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="p-4 bg-gray-50 border-b flex flex-wrap justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">
                      Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                    <Link
                      to={`/orders/${order._id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <img
                          src={item.productImage || '/images/placeholder.jpg'}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-primary-600">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-gray-500">
                        +{order.items.length - 2} more items
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm text-gray-600">
                        {order.status === 'delivered' && 'Delivered'}
                        {order.status === 'shipped' && 'On the way'}
                        {order.status === 'processing' && 'Being processed'}
                        {order.status === 'pending' && 'Waiting for confirmation'}
                        {order.status === 'cancelled' && 'Order cancelled'}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900">
                      Total: ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;