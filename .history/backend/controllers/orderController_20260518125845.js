const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ShippingSetting = require('../models/ShippingSetting');
const TaxSetting = require('../models/TaxSetting');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const sendEmail = require('../utils/emailService');
const PDFDocument = require('pdfkit');
const moment = require('moment');

// Helper function to generate unique order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// Helper function to generate invoice number
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
};

// Helper function to calculate shipping cost
const calculateShippingCost = async (subtotal, shippingMethod, shippingAddress) => {
  const shippingSettings = await ShippingSetting.findOne();
  if (!shippingSettings) {
    return { cost: 10, method: shippingMethod || 'standard' };
  }
  
  let selectedMethod = shippingSettings.methods.find(m => m.name === (shippingMethod || 'standard'));
  
  if (!selectedMethod) {
    selectedMethod = shippingSettings.methods.find(m => m.name === 'standard');
  }
  
  // Check for free shipping threshold
  if (selectedMethod.freeShippingThreshold > 0 && subtotal >= selectedMethod.freeShippingThreshold) {
    return { cost: 0, method: selectedMethod.name, displayName: selectedMethod.displayName };
  }
  
  // Check shipping zones
  if (shippingAddress && shippingSettings.shippingZones.length > 0) {
    const zone = shippingSettings.shippingZones.find(z => 
      z.countries.includes(shippingAddress.country)
    );
    if (zone) {
      if (zone.freeShippingThreshold > 0 && subtotal >= zone.freeShippingThreshold) {
        return { cost: 0, method: selectedMethod.name, displayName: selectedMethod.displayName };
      }
      return { cost: zone.cost, method: selectedMethod.name, displayName: selectedMethod.displayName };
    }
  }
  
  return { 
    cost: selectedMethod.cost, 
    method: selectedMethod.name, 
    displayName: selectedMethod.displayName 
  };
};

// Helper function to calculate tax
const calculateTax = async (subtotal, shippingCost, shippingAddress, taxIncluded = false) => {
  const taxSettings = await TaxSetting.findOne();
  if (!taxSettings) {
    return { tax: 0, rate: 0, details: {} };
  }
  
  let taxRate = taxSettings.globalTaxRate;
  let taxDetails = { type: 'global', rate: taxRate };
  
  // Check for specific tax rules
  if (shippingAddress && taxSettings.taxRules.length > 0) {
    const applicableRules = taxSettings.taxRules.filter(rule => {
      let matches = true;
      if (rule.country && rule.country !== shippingAddress.country) matches = false;
      if (rule.state && rule.state !== shippingAddress.state) matches = false;
      if (rule.city && rule.city !== shippingAddress.city) matches = false;
      return matches && rule.isActive;
    });
    
    if (applicableRules.length > 0) {
      // Sort by priority and get the highest priority
      applicableRules.sort((a, b) => b.priority - a.priority);
      taxRate = applicableRules[0].rate;
      taxDetails = { type: 'specific', rule: applicableRules[0].name, rate: taxRate };
    }
  }
  
  let taxableAmount = subtotal;
  if (taxSettings.applyTaxToShipping) {
    taxableAmount += shippingCost;
  }
  
  let tax = 0;
  if (!taxIncluded) {
    tax = (taxableAmount * taxRate) / 100;
  }
  
  return { tax, rate: taxRate, details: taxDetails };
};

// Helper function to validate and apply coupon
const validateAndApplyCoupon = async (couponCode, subtotal, userId = null) => {
  if (!couponCode) return { valid: false, discount: 0, message: 'No coupon code provided' };
  
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon) {
    return { valid: false, discount: 0, message: 'Invalid coupon code' };
  }
  
  const validation = await coupon.isValid(userId, subtotal);
  if (!validation.valid) {
    return { valid: false, discount: 0, message: validation.message };
  }
  
  const discount = coupon.calculateDiscount(subtotal);
  
  return {
    valid: true,
    discount,
    coupon,
    message: 'Coupon applied successfully',
    discountType: coupon.discountType,
    freeShipping: coupon.freeShipping
  };
};

// Helper function to send email notifications
const sendOrderEmail = async (order, type, req = null) => {
  const customerEmail = order.customer ? order.customer.email : order.guestInfo.email;
  const customerName = order.customer ? 
    `${order.customer.firstName} ${order.customer.lastName}` : 
    `${order.guestInfo.firstName} ${order.guestInfo.lastName}`;

  let subject = '';
  let html = '';

  const formatDate = (date) => moment(date).format('MMMM DD, YYYY h:mm A');
  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  switch(type) {
    case 'confirmed':
      subject = `Order Confirmed - ${order.orderNumber}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .order-summary { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .total { font-size: 18px; font-weight: bold; color: #4f46e5; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
            .status-badge { display: inline-block; padding: 5px 10px; background: #10b981; color: white; border-radius: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Order Confirmed! 🎉</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${customerName}</strong>,</p>
              <p>Thank you for your order! Your order has been confirmed and is being processed.</p>
              
              <div class="order-summary">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
                <p><strong>Status:</strong> <span class="status-badge">${order.status.toUpperCase()}</span></p>
              </div>
              
              <div class="order-summary">
                <h3>Order Items</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map(item => `
                      <tr>
                        <td>${item.productName}${item.variation?.name ? ` (${item.variation.name})` : ''}${item.color?.name ? ` - ${item.color.name}` : ''}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>${formatCurrency(item.total)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="order-summary">
                <h3>Order Summary</h3>
                <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
                ${order.couponDiscount > 0 ? `<p><strong>Coupon Discount (${order.couponCode}):</strong> -${formatCurrency(order.couponDiscount)}</p>` : ''}
                <p><strong>Shipping:</strong> ${formatCurrency(order.shippingCost)}</p>
                <p><strong>Tax:</strong> ${formatCurrency(order.tax)}</p>
                <p class="total"><strong>Total:</strong> ${formatCurrency(order.total)}</p>
              </div>
              
              <div class="order-summary">
                <h3>Shipping Address</h3>
                <p>${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.addressLine1}<br>
                ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
                ${order.shippingAddress.country}<br>
                Phone: ${order.shippingAddress.phone}</p>
              </div>
              
              <p>We'll notify you when your order ships. You can track your order status in your account dashboard.</p>
              <p>Thank you for shopping with us!</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    case 'shipped':
      subject = `Order Shipped - ${order.orderNumber}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .tracking-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Your Order Has Been Shipped! 📦</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${customerName}</strong>,</p>
              <p>Great news! Your order #${order.orderNumber} is on its way.</p>
              
              ${order.tracking.number ? `
                <div class="tracking-info">
                  <h3>Tracking Information</h3>
                  <p><strong>Tracking Number:</strong> ${order.tracking.number}</p>
                  <p><strong>Carrier:</strong> ${order.tracking.carrier}</p>
                  ${order.tracking.url ? `<p><a href="${order.tracking.url}" class="btn">Track Your Order →</a></p>` : ''}
                  ${order.tracking.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${moment(order.tracking.estimatedDelivery).format('MMMM DD, YYYY')}</p>` : ''}
                </div>
              ` : ''}
              
              <p>You can also track your order status in your account dashboard.</p>
              <p>Thank you for shopping with us!</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    case 'delivered':
      subject = `Order Delivered - ${order.orderNumber}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .review-btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Order Delivered! 🎁</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${customerName}</strong>,</p>
              <p>Your order #${order.orderNumber} has been delivered.</p>
              <p>We hope you love your purchase! Please take a moment to leave a review and let us know about your experience.</p>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/products/${order.items[0]?.product}" class="review-btn">Write a Review →</a>
              </div>
              <p style="margin-top: 20px;">Thank you for choosing us!</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    case 'cancelled':
      subject = `Order Cancelled - ${order.orderNumber}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Order Cancelled</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${customerName}</strong>,</p>
              <p>Your order #${order.orderNumber} has been cancelled as requested.</p>
              ${order.payment.refundAmount > 0 ? 
                `<p>A refund of ${formatCurrency(order.payment.refundAmount)} has been processed to your original payment method. Please allow 3-5 business days for the refund to appear on your statement.</p>` : 
                ''}
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              <p>We hope to serve you again in the future!</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
    
    default:
      return;
  }

  try {
    await sendEmail({
      email: customerEmail,
      subject,
      html
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

// ============================================
// PUBLIC ROUTES
// ============================================

// @desc    Create order (guest or registered)
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      sameAsShipping = true,
      paymentMethod,
      customerNotes,
      isGuest = false,
      guestInfo,
      couponCode,
      shippingMethod
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    // Process items and calculate subtotal
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
      let colorInfo = null;

      // Check variation
      if (item.variationId) {
        const variation = product.variations.id(item.variationId);
        if (!variation) {
          return res.status(404).json({
            success: false,
            message: `Variation not found for product: ${product.productName}`
          });
        }
        
        price = variation.price;
        buyPrice = variation.buyPrice;
        variationInfo = {
          id: variation._id,
          name: variation.name,
          sku: variation.sku
        };
      }
      
      // Check color
      if (item.colorId) {
        const color = product.colors.id(item.colorId);
        if (!color) {
          return res.status(404).json({
            success: false,
            message: `Color not found for product: ${product.productName}`
          });
        }
        
        colorInfo = {
          id: color._id,
          name: color.name,
          code: color.code,
          sku: color.sku
        };
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        productName: product.productName,
        productImage: product.mainImage?.url,
        sku: product.sku,
        variation: variationInfo,
        color: colorInfo,
        quantity: item.quantity,
        price: price,
        buyPrice: buyPrice,
        total: itemTotal
      });
    }

    // Apply coupon if provided
    let couponDiscount = 0;
    let appliedCoupon = null;
    let freeShipping = false;
    let couponValidation = null;
    
    if (couponCode) {
      const userId = req.user?._id || null;
      couponValidation = await validateAndApplyCoupon(couponCode, subtotal, userId);
      if (couponValidation.valid) {
        couponDiscount = couponValidation.discount;
        appliedCoupon = couponValidation.coupon;
        freeShipping = couponValidation.freeShipping;
      }
    }

    // Calculate shipping
    let shippingCostInfo = { cost: 0, method: shippingMethod || 'standard', displayName: 'Standard Shipping' };
    if (!freeShipping) {
      shippingCostInfo = await calculateShippingCost(subtotal - couponDiscount, shippingMethod, shippingAddress);
    }
    const shippingCost = shippingCostInfo.cost;
    
    // Calculate tax
    const taxInfo = await calculateTax(subtotal - couponDiscount, shippingCost, shippingAddress);
    const tax = taxInfo.tax;
    
    // Calculate total
    const total = subtotal - couponDiscount + shippingCost + tax;
    
    // Create order
    const orderData = {
      orderNumber: generateOrderNumber(),
      invoiceNumber: generateInvoiceNumber(),
      items: orderItems,
      subtotal,
      discount: couponDiscount,
      couponCode: couponCode ? couponCode.toUpperCase() : null,
      couponDiscount,
      couponType: couponValidation?.discountType || 'fixed',
      tax,
      taxRate: taxInfo.rate,
      taxDetails: taxInfo.details,
      shippingCost,
      shippingMethod: shippingCostInfo.method,
      total,
      shippingAddress,
      billingAddress: sameAsShipping ? shippingAddress : (billingAddress || shippingAddress),
      sameAsShipping,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'pending'
      },
      customerNotes,
      isGuest: isGuest || false,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      couponApplied: appliedCoupon?._id,
      timeline: [{
        status: 'pending',
        message: 'Order created',
        timestamp: new Date(),
        customerNotified: false
      }]
    };

    // Add customer info
    if (req.user) {
      orderData.customer = req.user._id;
    } else if (isGuest && guestInfo) {
      orderData.guestInfo = {
        email: guestInfo.email,
        phone: guestInfo.phone,
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName
      };
      // Ensure shipping address has email
      orderData.shippingAddress.email = guestInfo.email;
    }

    const order = await Order.create(orderData);

    // Update coupon usage
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      appliedCoupon.usedBy.push({
        user: req.user?._id || null,
        orderId: order._id,
        usedAt: new Date(),
        discountAmount: couponDiscount
      });
      await appliedCoupon.save();
    }

    // Send confirmation email
    await sendOrderEmail(order, 'confirmed', req);

    // Create audit log
    if (req.user) {
      await AuditLog.create({
        user: req.user._id,
        action: 'CREATE',
        entity: 'Order',
        entityId: order._id,
        details: {
          orderNumber: order.orderNumber,
          total: order.total,
          items: order.items.length,
          isGuest: false
        },
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        couponApplied: couponValidation?.valid ? {
          code: couponCode,
          discount: couponDiscount,
          message: couponValidation.message
        } : null
      }
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Validate coupon
// @route   POST /api/orders/validate-coupon
// @access  Public
exports.validateCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;
    
    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }
    
    const userId = req.user?._id || null;
    const result = await validateAndApplyCoupon(couponCode, subtotal, userId);
    
    res.status(200).json({
      success: result.valid,
      message: result.message,
      data: result.valid ? {
        discount: result.discount,
        discountType: result.discountType,
        freeShipping: result.freeShipping,
        code: couponCode.toUpperCase()
      } : null
    });
    
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get shipping methods
// @route   GET /api/orders/shipping-methods
// @access  Public
exports.getShippingMethods = async (req, res) => {
  try {
    const shippingSettings = await ShippingSetting.findOne();
    
    if (!shippingSettings) {
      // Return default shipping methods
      return res.status(200).json({
        success: true,
        data: [
          { name: 'standard', displayName: 'Standard Shipping', cost: 10, minDays: 3, maxDays: 7 },
          { name: 'express', displayName: 'Express Shipping', cost: 25, minDays: 1, maxDays: 3 },
          { name: 'overnight', displayName: 'Overnight Shipping', cost: 50, minDays: 1, maxDays: 1 }
        ]
      });
    }
    
    const activeMethods = shippingSettings.methods.filter(m => m.isActive);
    
    res.status(200).json({
      success: true,
      data: activeMethods,
      defaultMethod: shippingSettings.defaultShippingMethod
    });
    
  } catch (error) {
    console.error('Get shipping methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Calculate shipping and tax
// @route   POST /api/orders/calculate
// @access  Public
exports.calculateShippingAndTax = async (req, res) => {
  try {
    const { items, shippingAddress, couponCode, shippingMethod } = req.body;
    
    // Calculate subtotal from items
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        let price = product.price;
        if (item.variationId) {
          const variation = product.variations.id(item.variationId);
          if (variation) price = variation.price;
        }
        subtotal += price * item.quantity;
      }
    }
    
    // Apply coupon
    let couponDiscount = 0;
    let freeShipping = false;
    if (couponCode) {
      const userId = req.user?._id || null;
      const couponResult = await validateAndApplyCoupon(couponCode, subtotal, userId);
      if (couponResult.valid) {
        couponDiscount = couponResult.discount;
        freeShipping = couponResult.freeShipping;
      }
    }
    
    // Calculate shipping
    let shippingCostInfo = { cost: 0, method: shippingMethod || 'standard' };
    if (!freeShipping) {
      shippingCostInfo = await calculateShippingCost(subtotal - couponDiscount, shippingMethod, shippingAddress);
    }
    
    // Calculate tax
    const taxInfo = await calculateTax(subtotal - couponDiscount, shippingCostInfo.cost, shippingAddress);
    
    const total = subtotal - couponDiscount + shippingCostInfo.cost + taxInfo.tax;
    
    res.status(200).json({
      success: true,
      data: {
        subtotal,
        couponDiscount,
        shippingCost: shippingCostInfo.cost,
        shippingMethod: shippingCostInfo.method,
        tax: taxInfo.tax,
        taxRate: taxInfo.rate,
        total,
        freeShippingApplied: freeShipping
      }
    });
    
  } catch (error) {
    console.error('Calculate shipping and tax error:', error);
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

    const filter = { customer: req.user._id };
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
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get guest order by email and order number
// @route   POST /api/orders/guest-order
// @access  Public
exports.getGuestOrder = async (req, res) => {
  try {
    const { email, orderNumber } = req.body;
    
    const order = await Order.findOne({
      orderNumber,
      'guestInfo.email': email
    }).populate('items.product', 'productName mainImage');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get guest order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (Customer or Admin)
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('items.product', 'productName mainImage')
      .populate('timeline.updatedBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super-admin';
    const isOwner = order.customer && req.user && order.customer._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOwner && !order.isGuest) {
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
    console.error('Get order error:', error);
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
    const isOwner = order.customer && req.user && order.customer._id.toString() === req.user._id.toString();
    if (!isOwner) {
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

    // Update payment status if needed
    if (order.payment.status === 'paid') {
      order.payment.status = 'refunded';
      order.payment.refundAmount = order.total;
      order.payment.refundReason = reason;
      order.payment.refundedAt = new Date();
    }

    await order.save();
    await sendOrderEmail(order, 'cancelled', req);

    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE',
      entity: 'Order',
      entityId: order._id,
      details: {
        orderNumber: order.orderNumber,
        action: 'cancelled_by_customer',
        reason
      },
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ============================================
// ADMIN ROUTES
// ============================================

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
    if (req.query.paymentStatus) filter['payment.status'] = req.query.paymentStatus;
    if (req.query.search) {
      filter.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
        { invoiceNumber: { $regex: req.query.search, $options: 'i' } },
        { 'guestInfo.email': { $regex: req.query.search, $options: 'i' } },
        { 'guestInfo.firstName': { $regex: req.query.search, $options: 'i' } },
        { 'guestInfo.lastName': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: req.query.search, $options: 'i' } }
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

    // Status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      summary: summary[0] || {},
      statusBreakdown,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
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
        await sendOrderEmail(order, 'confirmed', req);
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
        await sendOrderEmail(order, 'shipped', req);
        break;
      
      case 'delivered':
        order.deliveredAt = new Date();
        if (order.tracking) {
          order.tracking.deliveredAt = new Date();
        }
        await sendOrderEmail(order, 'delivered', req);
        break;
      
      case 'cancelled':
        order.cancelledAt = new Date();
        await sendOrderEmail(order, 'cancelled', req);
        break;
    }

    await order.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE',
      entity: 'Order',
      entityId: order._id,
      details: {
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus: status,
        updatedBy: req.user.email
      },
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      data: order,
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error('Update order status error:', error);
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
          ],
          dailySalesLast30Days: [
            {
              $match: {
                createdAt: { $gte: moment().subtract(30, 'days').toDate() }
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                orders: { $sum: 1 },
                revenue: { $sum: '$total' }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get order stats error:', error);
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
      .populate('customer', 'firstName lastName email phone')
      .populate('items.product', 'productName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice-${order.orderNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // Header
    doc.fontSize(24).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    // Company Info
    doc.fontSize(10);
    doc.text('Your Store Name', 50, 100);
    doc.text('123 Business Street', 50, 115);
    doc.text('City, State 12345', 50, 130);
    doc.text('Email: sales@yourstore.com', 50, 145);
    doc.text('Phone: (555) 123-4567', 50, 160);
    
    // Invoice Info
    doc.text(`Invoice Number: ${order.invoiceNumber || order.orderNumber}`, 400, 100);
    doc.text(`Order Number: ${order.orderNumber}`, 400, 115);
    doc.text(`Date: ${moment(order.createdAt).format('MMMM DD, YYYY')}`, 400, 130);
    doc.text(`Status: ${order.status.toUpperCase()}`, 400, 145);
    
    doc.moveDown(3);

    // Customer Info
    const customerName = order.customer ? 
      `${order.customer.firstName} ${order.customer.lastName}` : 
      `${order.guestInfo.firstName} ${order.guestInfo.lastName}`;
    
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10);
    doc.text(customerName);
    doc.text(order.shippingAddress.email || order.guestInfo?.email);
    doc.text(order.shippingAddress.phone);
    doc.text(order.shippingAddress.addressLine1);
    if (order.shippingAddress.addressLine2) doc.text(order.shippingAddress.addressLine2);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`);
    doc.text(order.shippingAddress.country);
    
    doc.moveDown(2);

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
      let productName = item.productName;
      if (item.variation?.name) productName += ` (${item.variation.name})`;
      if (item.color?.name) productName += ` - ${item.color.name}`;
      
      doc.text(productName.substring(0, 40), 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`$${item.price.toFixed(2)}`, 400, y);
      doc.text(`$${item.total.toFixed(2)}`, 480, y);
      y += 20;
      
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });
    
    doc.moveDown(2);
    const summaryY = doc.y;
    
    doc.fontSize(10);
    doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, 400, summaryY);
    if (order.couponDiscount > 0) {
      doc.text(`Coupon Discount (${order.couponCode}): -$${order.couponDiscount.toFixed(2)}`, 400, summaryY + 15);
      doc.text(`Shipping: $${order.shippingCost.toFixed(2)}`, 400, summaryY + 30);
      doc.text(`Tax (${order.taxRate}%): $${order.tax.toFixed(2)}`, 400, summaryY + 45);
      doc.fontSize(12);
      doc.text(`Total: $${order.total.toFixed(2)}`, 400, summaryY + 65);
    } else {
      doc.text(`Shipping: $${order.shippingCost.toFixed(2)}`, 400, summaryY + 15);
      doc.text(`Tax (${order.taxRate}%): $${order.tax.toFixed(2)}`, 400, summaryY + 30);
      doc.fontSize(12);
      doc.text(`Total: $${order.total.toFixed(2)}`, 400, summaryY + 50);
    }
    
    // Footer
    doc.fontSize(8);
    doc.text('Thank you for your business!', 50, 750, { align: 'center' });
    doc.text(`Generated on ${moment().format('MMMM DD, YYYY h:mm A')}`, 50, 765, { align: 'center' });
    
    doc.end();
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update payment status (Admin)
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionId, refundAmount, refundReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldPaymentStatus = order.payment.status;
    order.payment.status = status;
    
    if (transactionId) order.payment.transactionId = transactionId;
    
    if (status === 'paid') {
      order.payment.paidAt = new Date();
    }
    
    if (status === 'refunded') {
      order.payment.refundAmount = refundAmount || order.total;
      order.payment.refundReason = refundReason;
      order.payment.refundedAt = new Date();
    }

    order.timeline.push({
      status: order.status,
      message: `Payment status updated from ${oldPaymentStatus} to ${status}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
      customerNotified: false
    });

    await order.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE',
      entity: 'Order',
      entityId: order._id,
      details: {
        orderNumber: order.orderNumber,
        oldPaymentStatus,
        newPaymentStatus: status,
        transactionId
      },
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      data: order,
      message: `Payment status updated to ${status}`
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
// ============================================
// RETURN MANAGEMENT FUNCTIONS
// ============================================

// @desc    Request return (Customer)
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
        message: 'Order cannot be returned. Return window may have expired (30 days after delivery).'
      });
    }

    // Check authorization
    const isOwner = order.customer && req.user && order.customer._id.toString() === req.user._id.toString();
    const isGuest = order.isGuest;
    
    if (!isOwner && !isGuest) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this order'
      });
    }

    // Check if return already requested
    if (order.return && order.return.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'A return request has already been processed for this order'
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
      status: order.status,
      message: `Return requested. Reason: ${reason}`,
      timestamp: new Date(),
      customerNotified: true
    });

    await order.save();

    // Notify admin
    const customerEmail = order.customer ? order.customer.email : order.guestInfo.email;
    const customerName = order.customer ? 
      `${order.customer.firstName} ${order.customer.lastName}` : 
      `${order.guestInfo.firstName} ${order.guestInfo.lastName}`;
    
    try {
      await sendEmail({
        email: process.env.ADMIN_EMAIL || 'admin@yourstore.com',
        subject: `Return Request - ${order.orderNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f97316; color: white; padding: 20px; text-align: center; }
              .content { background: #f9fafb; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Return Request</h2>
              </div>
              <div class="content">
                <p><strong>Order:</strong> ${order.orderNumber}</p>
                <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p><strong>Details:</strong> ${reasonDetails || 'N/A'}</p>
                <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
                <p><a href="${process.env.FRONTEND_URL}/admin/orders/${order._id}" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order →</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (emailError) {
      console.error('Failed to send return notification email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully',
      data: order
    });
  } catch (error) {
    console.error('Request return error:', error);
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

    if (!order.return || order.return.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending return request found for this order'
      });
    }

    const customerEmail = order.customer ? order.customer.email : order.guestInfo.email;
    const customerName = order.customer ? 
      `${order.customer.firstName} ${order.customer.lastName}` : 
      `${order.guestInfo.firstName} ${order.guestInfo.lastName}`;

    if (action === 'approve') {
      order.return.status = 'approved';
      order.return.approvedAt = new Date();
      order.return.approvedBy = req.user._id;
      order.return.refundAmount = refundAmount || order.total;
      
      // Update stock for returned items
      for (const returnItem of order.return.itemsReturned) {
        const orderItem = order.items.id(returnItem.itemId);
        if (orderItem) {
          const product = await Product.findById(orderItem.product);
          if (product) {
            if (orderItem.variation?.id) {
              const variation = product.variations.id(orderItem.variation.id);
              if (variation) {
                variation.stock += returnItem.quantity;
              }
            } else if (orderItem.color?.id) {
              const color = product.colors.id(orderItem.color.id);
              if (color) {
                color.stock += returnItem.quantity;
              }
            } else {
              product.inventory.currentStock += returnItem.quantity;
            }
            await product.save();
          }
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
      
      // Send approval email to customer
      try {
        await sendEmail({
          email: customerEmail,
          subject: `Return Request Approved - ${order.orderNumber}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
                .content { background: #f9fafb; padding: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Return Request Approved ✅</h2>
                </div>
                <div class="content">
                  <p>Dear <strong>${customerName}</strong>,</p>
                  <p>Your return request for order #${order.orderNumber} has been <strong>approved</strong>.</p>
                  <p><strong>Refund Amount:</strong> $${(refundAmount || order.total).toFixed(2)}</p>
                  <p><strong>Instructions:</strong> Please ship the items back to the following address:</p>
                  <p>
                    Your Store Name<br>
                    123 Return Address<br>
                    City, State 12345<br>
                    Country
                  </p>
                  ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
                  <p>Once we receive the items, we will process your refund within 3-5 business days.</p>
                  <p>Thank you for your patience.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      } catch (emailError) {
        console.error('Failed to send return approved email:', emailError);
      }
      
    } else if (action === 'reject') {
      order.return.status = 'rejected';
      
      // Send rejection email to customer
      try {
        await sendEmail({
          email: customerEmail,
          subject: `Return Request Update - ${order.orderNumber}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
                .content { background: #f9fafb; padding: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Return Request Update</h2>
                </div>
                <div class="content">
                  <p>Dear <strong>${customerName}</strong>,</p>
                  <p>Your return request for order #${order.orderNumber} has been reviewed.</p>
                  <p><strong>Status:</strong> Rejected ❌</p>
                  <p><strong>Reason:</strong> ${adminNotes || 'Does not meet our return policy criteria'}</p>
                  <p>If you have any questions, please contact our support team at support@yourstore.com</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      } catch (emailError) {
        console.error('Failed to send return rejected email:', emailError);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }

    order.timeline.push({
      status: order.status,
      message: `Return ${action}d by admin. ${adminNotes || ''}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
      customerNotified: true
    });

    order.adminNotes = adminNotes;
    await order.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE',
      entity: 'Order',
      entityId: order._id,
      details: {
        orderNumber: order.orderNumber,
        action: `return_${action}d`,
        refundAmount: action === 'approve' ? (refundAmount || order.total) : null,
        adminNotes
      },
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: `Return ${action}d successfully`,
      data: order
    });
  } catch (error) {
    console.error('Process return error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get return requests (Admin)
// @route   GET /api/orders/admin/returns
// @access  Private/Admin
exports.getReturnRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const filter = {
      'return.status': { $in: ['pending', 'approved', 'rejected'] }
    };
    
    if (req.query.status) {
      filter['return.status'] = req.query.status;
    }

    const orders = await Order.find(filter)
      .sort('-return.requestedAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customer', 'firstName lastName email')
      .populate('return.approvedBy', 'name email');

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
    console.error('Get return requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
// At the very bottom of orderController.js, make sure all functions are exported
module.exports = {
  createOrder,
  validateCoupon,
  getShippingMethods,
  calculateShippingAndTax,
  getMyOrders,
  getGuestOrder,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  generateInvoice,
  updatePaymentStatus,
  requestReturn,
  processReturn,
  getReturnRequests
};