// ============================================
// src/pages/OrderDetailPage.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiPackage, FiMapPin, FiCreditCard, FiTruck, FiCheckCircle, FiClock, FiDownload } from 'react-icons/fi';

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data.data);
    } catch (error) {
      console.error('Fetch order error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download invoice error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-indigo-100 text-indigo-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <FiPackage className="text-6xl text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
        <Link to="/orders" className="text-indigo-600 hover:text-indigo-700">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Order Header */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Order Details</h1>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
            <p className="text-gray-600">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadInvoice}
              className="btn-outline flex items-center gap-2"
            >
              <FiDownload /> Download Invoice
            </button>
            <Link to="/orders" className="btn-secondary">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items and Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Status</h2>
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ')}
            </div>
            
            {/* Timeline */}
            {order.timeline && order.timeline.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-3">Order Timeline</h3>
                <div className="space-y-4">
                  {order.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1.5"></div>
                        {idx < order.timeline.length - 1 && (
                          <div className="absolute top-4 left-1.5 w-0.5 h-full bg-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium capitalize">{event.status.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">{event.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b last:border-0">
                  <img
                    src={item.productImage || 'https://via.placeholder.com/80'}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <Link to={`/product/${item.product}`} className="font-semibold hover:text-indigo-600">
                      {item.productName}
                    </Link>
                    {item.variation && (
                      <p className="text-sm text-gray-500">Variation: {item.variation.name}</p>
                    )}
                    <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
                    <div className="flex justify-between mt-2">
                      <span>Quantity: {item.quantity}</span>
                      <span className="font-semibold">${item.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary and Shipping Info */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{order.shippingCost === 0 ? 'Free' : `$${order.shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-${order.couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-indigo-600">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiCreditCard /> Payment Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="capitalize">{order.payment?.method || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`capitalize ${order.payment?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment?.status || 'pending'}
                </span>
              </div>
              {order.payment?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="text-sm">{order.payment.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiMapPin /> Shipping Address
            </h2>
            <div className="space-y-1">
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              <p className="text-gray-600">Phone: {order.shippingAddress?.phone}</p>
              <p className="text-gray-600">Email: {order.shippingAddress?.email}</p>
            </div>
          </div>

          {/* Tracking Information */}
          {order.tracking?.number && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FiTruck /> Tracking Information
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracking Number</span>
                  <span>{order.tracking.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carrier</span>
                  <span>{order.tracking.carrier}</span>
                </div>
                {order.tracking.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Delivery</span>
                    <span>{new Date(order.tracking.estimatedDelivery).toLocaleDateString()}</span>
                  </div>
                )}
                {order.tracking.url && (
                  <a
                    href={order.tracking.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm block mt-2"
                  >
                    Track Package →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Cancel Order Button for eligible orders */}
          {order.canBeCancelled && order.status !== 'cancelled' && (
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to cancel this order?')) {
                  try {
                    await axios.put(`${API_URL}/orders/${order._id}/cancel`,
                      { reason: 'Customer requested cancellation' },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    fetchOrder();
                  } catch (error) {
                    console.error('Cancel order error:', error);
                    alert('Failed to cancel order. Please try again.');
                  }
                }
              }}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;