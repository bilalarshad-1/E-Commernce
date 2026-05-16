// pages/admin/orders/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../../services/orderApi';
import toast from 'react-hot-toast';
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
  FiTruck as FiDelivery,
  FiRotateCw
} from 'react-icons/fi';
import { format } from 'date-fns';
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

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getOrder(id);
      setOrder(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch order');
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (statusData) => {
    try {
      await orderService.updateOrderStatus(id, statusData);
      toast.success('Order status updated successfully');
      setShowStatusModal(false);
      fetchOrder();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleUpdateTracking = async (trackingData) => {
    try {
      await orderService.updateOrderStatus(id, {
        status: 'shipped',
        trackingInfo: trackingData
      });
      toast.success('Tracking information added');
      setShowTrackingModal(false);
      fetchOrder();
    } catch (error) {
      toast.error('Failed to update tracking');
    }
  };

  const handleProcessReturn = async (returnData) => {
    try {
      await orderService.processReturn(id, returnData);
      toast.success(`Return ${returnData.action}d successfully`);
      setShowReturnModal(false);
      fetchOrder();
    } catch (error) {
      toast.error('Failed to process return');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await orderService.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: FiCheckCircle },
      processing: { color: 'bg-purple-100 text-purple-800', icon: FiPackage },
      shipped: { color: 'bg-indigo-100 text-indigo-800', icon: FiTruck },
      out_for_delivery: { color: 'bg-orange-100 text-orange-800', icon: FiDelivery },
      delivered: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FiXCircle },
      returned: { color: 'bg-gray-100 text-gray-800', icon: FiRotateCw },
      refunded: { color: 'bg-pink-100 text-pink-800', icon: FiDollarSign }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full ${config.color}`}>
        <Icon className="h-4 w-4" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
        <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
        <Link to="/admin/orders" className="btn-primary inline-flex items-center gap-2">
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
          <Link to="/admin/orders" className="text-gray-600 hover:text-gray-900">
            <FiArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-600 mt-1">Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy h:mm a')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadInvoice}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Invoice
          </button>
          <button
            onClick={() => setShowTrackingModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FiTruck className="h-4 w-4" />
            Add Tracking
          </button>
          <button
            onClick={() => setShowStatusModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiEdit2 className="h-4 w-4" />
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <FiPackage className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {item.variation && (
                      <p className="text-sm text-gray-500">Variation: {item.variation.name}</p>
                    )}
                    <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="font-medium text-gray-900">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Total: ${item.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Timeline</h3>
            <div className="space-y-4">
              {order.timeline?.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      {getStatusBadge(event.status).props.children[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.status?.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-sm text-gray-600">{event.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(event.timestamp), 'MMM dd, yyyy h:mm a')}</p>
                    {event.updatedBy && (
                      <p className="text-xs text-gray-400">By: {event.updatedBy.name || event.updatedBy.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">${order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${order.tax.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-red-600">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-primary-600">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="h-5 w-5" />
              Customer Information
            </h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">
                {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : order.guestInfo?.firstName}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMail className="h-4 w-4" />
                {order.customer?.email || order.guestInfo?.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiPhone className="h-4 w-4" />
                {order.shippingAddress?.phone}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiMapPin className="h-5 w-5" />
              Shipping Address
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
              <p>{order.shippingAddress?.country}</p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="h-5 w-5" />
              Payment Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium capitalize">{order.payment?.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium capitalize ${order.payment?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment?.status}
                </span>
              </div>
              {order.payment?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-xs">{order.payment.transactionId}</span>
                </div>
              )}
              {order.payment?.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid At</span>
                  <span>{format(new Date(order.payment.paidAt), 'MMM dd, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking Information */}
          {order.tracking?.number && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiTruck className="h-5 w-5" />
                Tracking Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Carrier</span>
                  <span className="font-medium">{order.tracking.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracking Number</span>
                  <span className="font-mono text-sm">{order.tracking.number}</span>
                </div>
                {order.tracking.url && (
                  <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm hover:underline">
                    Track Order →
                  </a>
                )}
                {order.tracking.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Delivery</span>
                    <span>{format(new Date(order.tracking.estimatedDelivery), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UpdateStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleUpdateStatus}
        currentStatus={order.status}
      />

      <TrackingModal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        onConfirm={handleUpdateTracking}
        order={order}
      />

      <ReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={handleProcessReturn}
        order={order}
      />
    </div>
  );
};

export default OrderDetail;