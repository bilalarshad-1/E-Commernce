const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const auditLog = require('../middleware/auditMiddleware');
const sendEmail = require('../utils/emailService');
const PDFDocument = require('pdfkit');
const moment = require('moment');

// Helper function to generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// Helper function to update stock


// Helper function to send email notifications
const sendOrderEmail = async (order, type) => {
  const customerEmail = order.customer ? order.customer.email : order.guestInfo.email;
  const customerName = order.customer ? 
    `${order.customer.firstName} ${order.customer.lastName}` : 
    `${order.guestInfo.firstName} ${order.guestInfo.lastName}`;

  let subject = '';
  let message = '';

  switch(type) {
    case 'confirmed':
      subject = `Order Confirmed - ${order.orderNumber}`;
      message = `
        <h2>Order Confirmed!</h2>
        <p>Dear ${customerName},</p>
        <p>Your order #${order.orderNumber} has been confirmed and is being processed.</p>
        <h3>Order Summary:</h3>
        <table border="1" cellpadding="10" style="border-collapse: collapse;">
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          ${order.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>$${item.price.toFixed(2)}</td>
              <td>$${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="3"><strong>Total</strong></td>
            <td><strong>$${order.total.toFixed(2)}</strong></td>
          </tr>
        </table>
        <p>We'll notify you when your order ships.</p>
        <p>Thank you for shopping with us!</p>
      `;
      break;
    
    case 'shipped':
      subject = `Order Shipped - ${order.orderNumber}`;
      message = `
        <h2>Your Order Has Been Shipped!</h2>
        <p>Dear ${customerName},</p>
        <p>Great news! Your order #${order.orderNumber} is on its way.</p>
        ${order.tracking.number ? `
          <h3>Tracking Information:</h3>
          <p>Tracking Number: ${order.tracking.number}</p>
          <p>Carrier: ${order.tracking.carrier}</p>
          ${order.tracking.url ? `<p>Track your order: <a href="${order.tracking.url}">Click Here</a></p>` : ''}
        ` : ''}
        <p>Estimated Delivery: ${moment(order.tracking.estimatedDelivery).format('MMMM DD, YYYY')}</p>
      `;
      break;
    
    case 'delivered':
      subject = `Order Delivered - ${order.orderNumber}`;
      message = `
        <h2>Order Delivered!</h2>
        <p>Dear ${customerName},</p>
        <p>Your order #${order.orderNumber} has been delivered.</p>
        <p>We hope you love your purchase! Please take a moment to leave a review.</p>
      `;
      break;
    
    case 'cancelled':
      subject = `Order Cancelled - ${order.orderNumber}`;
      message = `
        <h2>Order Cancelled</h2>
        <p>Dear ${customerName},</p>
        <p>Your order #${order.orderNumber} has been cancelled as requested.</p>
        ${order.payment.refundAmount > 0 ? 
          `<p>A refund of $${order.payment.refundAmount.toFixed(2)} has been processed to your original payment method.</p>` : 
          ''}
      `;
      break;
    
    case 'return_approved':
      subject = `Return Approved - ${order.orderNumber}`;
      message = `
        <h2>Return Request Approved</h2>
        <p>Dear ${customerName},</p>
        <p>Your return request for order #${order.orderNumber} has been approved.</p>
        <p>Please ship the items back to us. Return shipping instructions are attached.</p>
      `;
      break;
  }

  try {
    await sendEmail({
      email: customerEmail,
      subject,
      message
    });
    
    // Update notification flag
    if (type === 'confirmed') order.notifications.orderConfirmed = true;
    if (type === 'shipped') order.notifications.orderShipped = true;
    if (type === 'delivered') order.notifications.orderDelivered = true;
    if (type === 'cancelled') order.notifications.orderCancelled = true;
    await order.save();
    
  } catch (error) {
    console.error(`Failed to send ${type} email:`, error);
  }
};

// @desc    Create order (guest or registered)
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      customerNotes,
      isGuest,
      guestInfo,
      couponCode
    } = req.body;

    // Validate items and check stock
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      let price = product.price;
      let buyPrice = product.buyPrice;
      let variationInfo = null;

      // Check variation
      if (item.variationId) {
        const variation = product.variations.id(item.variationId);
        if (!variation) {
          return res.status(404).json({
            success: false,
            message: `Variation not found for product: ${product.productName}`
          });
        }
        
        if (variation.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.productName} - ${variation.name}`
          });
        }
        
        price = variation.price;
        buyPrice = variation.buyPrice;
        variationInfo = {
          id: variation._id,
          name: variation.name,
          sku: variation.sku
        };
      } else {
        if (product.inventory.currentStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.productName}`
          });
        }
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        productName: product.productName,
        productImage: product.mainImage?.url,
        sku: product.sku,
        variation: variationInfo,
        quantity: item.quantity,
        price: price,
        buyPrice: buyPrice,
        total: itemTotal
      });
    }

    // Calculate totals
    const tax = subtotal * 0.1; // 10% tax example
    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shippingCost;

    // Create order
    const orderData = {
      orderNumber: generateOrderNumber(),
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      total,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'pending'
      },
      customerNotes,
      isGuest: isGuest || false,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timeline: [{
        status: 'pending',
        message: 'Order created',
        timestamp: new Date()
      }]
    };

    // Add customer info
    if (req.customer) {
      orderData.customer = req.customer._id;
    } else if (isGuest && guestInfo) {
      orderData.guestInfo = guestInfo;
    }

    const order = await Order.create(orderData);

    // Decrease stock
    await updateStock(orderItems, 'decrease');

    // Send confirmation email
    await sendOrderEmail(order, 'confirmed');

    await auditLog(req, 'CREATE', 'Order', order._id, {
      orderNumber: order.orderNumber,
      total: order.total,
      items: order.items.length
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get my orders (authenticated customer)
// @route   GET /api/orders/my-orders
// @access  Private/Customer
exports.getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const filter = { customer: req.customer._id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('items.product', 'productName mainImage');

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('items.product', 'productName mainImage');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.customer && req.customer && order.customer._id.toString() !== req.customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, message, trackingInfo } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    order.timeline.push({
      status,
      message: message || `Order status updated to ${status}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
      customerNotified: false
    });

    // Handle status-specific updates
    switch(status) {
      case 'confirmed':
        order.confirmedAt = new Date();
        await sendOrderEmail(order, 'confirmed');
        break;
      
      case 'processing':
        order.processedAt = new Date();
        break;
      
      case 'shipped':
        if (trackingInfo) {
          order.tracking = {
            number: trackingInfo.number,
            carrier: trackingInfo.carrier,
            url: trackingInfo.url,
            estimatedDelivery: trackingInfo.estimatedDelivery,
            shippedAt: new Date()
          };
        }
        order.shippedAt = new Date();
        await sendOrderEmail(order, 'shipped');
        break;
      
      case 'out_for_delivery':
        await sendOrderEmail(order, 'out_for_delivery');
        break;
      
      case 'delivered':
        order.deliveredAt = new Date();
        order.tracking.deliveredAt = new Date();
        await sendOrderEmail(order, 'delivered');
        break;
      
      case 'cancelled':
        order.cancelledAt = new Date();
        // Increase stock back
        await updateStock(order.items, 'increase');
        await sendOrderEmail(order, 'cancelled');
        break;
    }

    await order.save();

    await auditLog(req, 'UPDATE', 'Order', order._id, {
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.email
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Cancel order (Customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Check authorization
    if (order.customer && req.customer && order.customer._id.toString() !== req.customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellation = {
      requestedAt: new Date(),
      reason: reason,
      approvedAt: new Date(),
      refundProcessed: order.payment.status === 'paid'
    };

    order.timeline.push({
      status: 'cancelled',
      message: `Order cancelled by customer. Reason: ${reason || 'Not provided'}`,
      timestamp: new Date(),
      customerNotified: true
    });

    // Increase stock back
    await updateStock(order.items, 'increase');

    await order.save();
    await sendOrderEmail(order, 'cancelled');

    await auditLog(req, 'UPDATE', 'Order', order._id, {
      orderNumber: order.orderNumber,
      action: 'cancelled_by_customer',
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Request return
// @route   POST /api/orders/:id/return
// @access  Private
exports.requestReturn = async (req, res) => {
  try {
    const { reason, reasonDetails, items } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be returned
    if (!order.canBeReturned) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be returned. Return window may have expired.'
      });
    }

    // Check authorization
    if (order.customer && req.customer && order.customer._id.toString() !== req.customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this order'
      });
    }

    order.return = {
      requestedAt: new Date(),
      reason,
      reasonDetails,
      status: 'pending',
      itemsReturned: items || order.items.map(item => ({
        itemId: item._id,
        quantity: item.quantity,
        reason,
        condition: 'new'
      }))
    };

    order.timeline.push({
      status: 'returned',
      message: `Return requested. Reason: ${reason}`,
      timestamp: new Date(),
      customerNotified: true
    });

    await order.save();

    // Notify admin
    await sendEmail({
      email: process.env.ADMIN_EMAIL,
      subject: `Return Request - ${order.orderNumber}`,
      message: `
        <h2>New Return Request</h2>
        <p>Order: ${order.orderNumber}</p>
        <p>Customer: ${order.customer ? order.customer.email : order.guestInfo.email}</p>
        <p>Reason: ${reason}</p>
        <p>Details: ${reasonDetails || 'N/A'}</p>
      `
    });

    await auditLog(req, 'UPDATE', 'Order', order._id, {
      orderNumber: order.orderNumber,
      action: 'return_requested',
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Process return (Admin)
// @route   PUT /api/orders/:id/return/process
// @access  Private/Admin
exports.processReturn = async (req, res) => {
  try {
    const { action, refundAmount, adminNotes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (action === 'approve') {
      order.return.status = 'approved';
      order.return.approvedAt = new Date();
      order.return.approvedBy = req.user._id;
      order.return.refundAmount = refundAmount || order.total;
      
      // Update stock for returned items
      for (const returnItem of order.return.itemsReturned) {
        const orderItem = order.items.id(returnItem.itemId);
        if (orderItem) {
          await updateStock([orderItem], 'increase');
        }
      }
      
      // Process refund if payment was made
      if (order.payment.status === 'paid') {
        order.payment.status = 'refunded';
        order.payment.refundAmount = refundAmount || order.total;
        order.payment.refundReason = order.return.reason;
        order.payment.refundedAt = new Date();
      }
      
      order.status = 'returned';
      order.returnedAt = new Date();
      
      await sendOrderEmail(order, 'return_approved');
      
    } else if (action === 'reject') {
      order.return.status = 'rejected';
      
      await sendEmail({
        email: order.customer ? order.customer.email : order.guestInfo.email,
        subject: `Return Request Rejected - ${order.orderNumber}`,
        message: `
          <h2>Return Request Update</h2>
          <p>Your return request for order #${order.orderNumber} has been reviewed.</p>
          <p>Status: <strong>Rejected</strong></p>
          <p>Reason: ${adminNotes || 'Does not meet return criteria'}</p>
        `
      });
    }

    order.timeline.push({
      status: 'returned',
      message: `Return ${action}d by admin. ${adminNotes || ''}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
      customerNotified: true
    });

    await order.save();

    await auditLog(req, 'UPDATE', 'Order', order._id, {
      orderNumber: order.orderNumber,
      action: `return_${action}d`,
      refundAmount,
      adminNotes
    });

    res.status(200).json({
      success: true,
      message: `Return ${action}d successfully`,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || '-createdAt';
    
    const filter = {};
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
        { 'guestInfo.email': { $regex: req.query.search, $options: 'i' } },
        { 'guestInfo.firstName': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.dateFrom) {
      filter.createdAt = { $gte: new Date(req.query.dateFrom) };
    }
    if (req.query.dateTo) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(req.query.dateTo) };
    }
    if (req.query.minTotal) {
      filter.total = { $gte: parseFloat(req.query.minTotal) };
    }
    if (req.query.maxTotal) {
      filter.total = { ...filter.total, $lte: parseFloat(req.query.maxTotal) };
    }

    const orders = await Order.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customer', 'firstName lastName email')
      .populate('timeline.updatedBy', 'name email');

    const total = await Order.countDocuments(filter);
    
    const summary = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          totalItems: { $sum: { $size: '$items' } }
        }
      }
    ]);

    await auditLog(req, 'VIEW', 'Order', null, { action: 'viewed-orders-list', filters: req.query });

    res.status(200).json({
      success: true,
      data: orders,
      summary: summary[0] || {},
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const stats = await Order.aggregate([
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: startOfToday } } },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                revenue: { $sum: '$total' }
              }
            }
          ],
          week: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                revenue: { $sum: '$total' }
              }
            }
          ],
          month: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                revenue: { $sum: '$total' }
              }
            }
          ],
          year: [
            { $match: { createdAt: { $gte: startOfYear } } },
            {
              $group: {
                _id: null,
                orders: { $sum: 1 },
                revenue: { $sum: '$total' }
              }
            }
          ],
          statusBreakdown: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                revenue: { $sum: '$total' }
              }
            }
          ],
          paymentMethodBreakdown: [
            {
              $group: {
                _id: '$payment.method',
                count: { $sum: 1 },
                total: { $sum: '$total' }
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Generate invoice PDF
// @route   GET /api/orders/:id/invoice
// @access  Private
exports.generateInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone address')
      .populate('items.product', 'productName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const doc = new PDFDocument();
    const filename = `invoice-${order.orderNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order Number: ${order.orderNumber}`, { align: 'right' });
    doc.text(`Date: ${moment(order.createdAt).format('MMMM DD, YYYY')}`, { align: 'right' });
    doc.moveDown();

    // Customer Info
    doc.fontSize(14).text('Bill To:', { underline: true });
    const customerName = order.customer ? 
      `${order.customer.firstName} ${order.customer.lastName}` : 
      `${order.guestInfo.firstName} ${order.guestInfo.lastName}`;
    doc.fontSize(10).text(customerName);
    doc.text(order.shippingAddress.email || order.guestInfo.email);
    doc.text(order.shippingAddress.phone);
    doc.text(`${order.shippingAddress.addressLine1}`);
    if (order.shippingAddress.addressLine2) doc.text(order.shippingAddress.addressLine2);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`);
    doc.text(order.shippingAddress.country);
    doc.moveDown();

    // Order Items Table
    doc.fontSize(12).text('Order Items:', { underline: true });
    doc.moveDown();
    
    let y = doc.y;
    doc.fontSize(10);
    doc.text('Product', 50, y);
    doc.text('Quantity', 300, y);
    doc.text('Price', 400, y);
    doc.text('Total', 480, y);
    
    y += 20;
    doc.lineWidth(0.5);
    doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();
    
    order.items.forEach(item => {
      doc.text(item.productName.substring(0, 40), 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`$${item.price.toFixed(2)}`, 400, y);
      doc.text(`$${item.total.toFixed(2)}`, 480, y);
      y += 20;
      
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
    
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, { align: 'right' });
    doc.text(`Shipping: $${order.shippingCost.toFixed(2)}`, { align: 'right' });
    doc.text(`Tax: $${order.tax.toFixed(2)}`, { align: 'right' });
    doc.fontSize(14);
    doc.text(`Total: $${order.total.toFixed(2)}`, { align: 'right' });
    
    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};