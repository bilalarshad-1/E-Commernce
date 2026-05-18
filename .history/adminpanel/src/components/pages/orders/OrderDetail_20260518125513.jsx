import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../../services/orderApi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiPrinter,
  FiDownload,
  FiEdit2,
  FiRefreshCw,
  FiRotateCw,
  FiCreditCard,
  FiTag,
  FiPercent,
  FiTruck as FiDelivery,
  FiShoppingCart,
  FiInfo
} from 'react-icons/fi';
import UpdateStatusModal from './UpdateStatusModal';
import TrackingModal from '../../../components/orders/TrackingModal';
import ReturnModal from '../../../components/orders/ReturnModal';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getOrder(id);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Fetch order error:', error);
      if (error.response?.status === 404) {
        toast.error('Order not found');
        navigate('/admin/orders');
      } else {
        toast.error('Failed to fetch order');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (data) => {
    setUpdating(true);
    try {
      await orderService.updateOrderStatus(id, data);
      toast.success(`Order status updated to ${data.status}`);
      setShowStatusModal(false);
      fetchOrder();
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async (data) => {
    setUpdating(true);
    try {
      await orderService.updateOrderStatus(id, { 
        status: 'shipped', 
        trackingInfo: data 
      });
      toast.success('Tracking information added successfully');
      setShowTrackingModal(false);
      fetchOrder();
    } catch (error) {
      console.error('Update tracking error:', error);
      toast.error('Failed to add tracking information');
    } finally {
      setUpdating(false);
    }
  };

  const handleProcessReturn = async (data) => {
    setUpdating(true);
    try {
      await orderService.processReturn(id, data);
      toast.success(`Return request ${data.action}d successfully`);
      setShowReturnModal(false);
      fetchOrder();
    } catch (error) {
      console.error('Process return error:', error);
      toast.error('Failed to process return request');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await orderService.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order?.orderNumber || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Download invoice error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock, label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: FiCheckCircle, label: 'Confirmed' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: FiPackage, label: 'Processing' },
      shipped: { color: 'bg-indigo-100 text-indigo-800', icon: FiTruck, label: 'Shipped' },
      out_for_delivery: { color: 'bg-orange-100 text-orange-800', icon: FiDelivery, label: 'Out for Delivery' },
      delivered: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FiXCircle, label: 'Cancelled' },
      returned: { color: 'bg-gray-100 text-gray-800', icon: FiRotateCw, label: 'Returned' },
      refunded: { color: 'bg-pink-100 text-pink-800', icon: FiDollarSign, label: 'Refunded' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  const getTimelineIcon = (status) => {
    const icons = {
      pending: FiClock,
      confirmed: FiCheckCircle,
      processing: FiPackage,
      shipped: FiTruck,
      out_for_delivery: FiDelivery,
      delivered: FiCheckCircle,
      cancelled: FiXCircle,
      returned: FiRotateCw
    };
    const Icon = icons[status] || FiClock;
    return <Icon className="h-5 w-5 text-indigo-600" />;
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
        <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
        <Link to="/admin/orders" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <FiArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/orders" className="text-gray-600 hover:text-gray-900 transition-colors">
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-gray-600 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowStatusModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-all hover:scale-105"
          >
            <FiEdit2 className="h-4 w-4" />
            Update Status
          </button>
          {order.status === 'confirmed' && (
            <button
              onClick={() => setShowTrackingModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all hover:scale-105"
            >
              <FiTruck className="h-4 w-4" />
              Add Tracking
            </button>
          )}
          {order.return?.status === 'pending' && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-all hover:scale-105"
            >
              <FiRotateCw className="h-4 w-4" />
              Process Return
            </button>
          )}
          <button
            onClick={handleDownloadInvoice}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all hover:scale-105"
          >
            <FiDownload className="h-4 w-4" />
            Invoice
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-all hover:scale-105"
          >
            <FiPrinter className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={fetchOrder}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-all hover:scale-105"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiShoppingCart className="h-5 w-5 text-indigo-600" />
                Order Items
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <div key={index} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  {item.productImage ? (
                    <img 
                      src={item.productImage} 
                      alt={item.productName} 
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <FiPackage className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                      {item.variation && (
                        <span className="flex items-center gap-1">
                          <FiTag className="h-3 w-3" />
                          Variation: {item.variation.name}
                        </span>
                      )}
                      {item.color && (
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color.code }} />
                          Color: {item.color.name}
                        </span>
                      )}
                      {item.sku && (
                        <span className="font-mono text-xs">SKU: {item.sku}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    <p className="text-sm text-gray-500">Price: ${item.price?.toFixed(2)}</p>
                    <p className="font-semibold text-gray-900 mt-1">Total: ${item.total?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Order Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiClock className="h-5 w-5 text-indigo-600" />
                  Order Timeline
                </h3>
              </div>
              <div className="p-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    {order.timeline.map((event, index) => (
                      <div key={index} className="relative flex gap-4">
                        <div className="relative z-10">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            {getTimelineIcon(event.status)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="font-medium text-gray-900 capitalize">
                              {event.status?.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {event.message && (
                            <p className="text-sm text-gray-600 mt-1">{event.message}</p>
                          )}
                          {event.updatedBy && (
                            <p className="text-xs text-gray-400 mt-1">
                              Updated by: {typeof event.updatedBy === 'object' ? event.updatedBy.name : event.updatedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiDollarSign className="h-5 w-5 text-indigo-600" />
                Order Summary
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${order.subtotal?.toFixed(2)}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <FiPercent className="h-3 w-3" />
                    Coupon ({order.couponCode})
                  </span>
                  <span>-${order.couponDiscount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">${order.shippingCost?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({order.taxRate}%)</span>
                <span className="font-medium">${order.tax?.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-indigo-600">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Customer Information */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiUser className="h-5 w-5 text-indigo-600" />
                Customer Information
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">
                  {order.customer 
                    ? `${order.customer.firstName} ${order.customer.lastName}` 
                    : order.guestInfo?.firstName || 'Guest'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <div className="flex items-center gap-2">
                  <FiMail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{order.customer?.email || order.guestInfo?.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <div className="flex items-center gap-2">
                  <FiPhone className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{order.shippingAddress?.phone}</p>
                </div>
              </div>
              {order.isGuest && (
                <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                  <p className="text-xs text-gray-500">Guest Checkout</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Shipping Address */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiMapPin className="h-5 w-5 text-indigo-600" />
                Shipping Address
              </h3>
            </div>
            <div className="p-6">
              <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
              <p className="text-gray-600 mt-1">{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && (
                <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-gray-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
              </p>
              <p className="text-gray-600">{order.shippingAddress?.country}</p>
            </div>
          </motion.div>

          {/* Payment Information */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiCreditCard className="h-5 w-5 text-indigo-600" />
                Payment Information
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium capitalize">{order.payment?.method || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium capitalize ${
                  order.payment?.status === 'paid' ? 'text-green-600' : 
                  order.payment?.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {order.payment?.status || 'pending'}
                </span>
              </div>
              {order.payment?.transactionId && (
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="text-sm font-mono text-gray-900">{order.payment.transactionId}</p>
                </div>
              )}
              {order.payment?.paidAt && (
                <div>
                  <p className="text-sm text-gray-500">Paid At</p>
                  <p className="text-sm text-gray-900">{new Date(order.payment.paidAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tracking Information */}
          {order.tracking?.number && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiTruck className="h-5 w-5 text-indigo-600" />
                  Tracking Information
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Carrier</span>
                  <span className="font-medium">{order.tracking.carrier}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-mono text-sm text-gray-900">{order.tracking.number}</p>
                </div>
                {order.tracking.url && (
                  <a 
                    href={order.tracking.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    Track Order →
                  </a>
                )}
                {order.tracking.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Delivery</span>
                    <span className="font-medium">{new Date(order.tracking.estimatedDelivery).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UpdateStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleUpdateStatus}
        currentStatus={order.status}
        updating={updating}
      />

      <TrackingModal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        onConfirm={handleUpdateTracking}
        order={order}
        updating={updating}
      />

      <ReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={handleProcessReturn}
        order={order}
        updating={updating}
      />
    </div>
  );
};

export default OrderDetail;