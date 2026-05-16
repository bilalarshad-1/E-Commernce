exports.orderStatusTemplates = {
  confirmed: (order, customerName) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .order-details { background: #f5f5f5; padding: 15px; margin: 20px 0; }
        .status { display: inline-block; padding: 5px 10px; background: #10B981; color: white; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed! 🎉</h1>
        </div>
        <div class="content">
          <h2>Dear ${customerName},</h2>
          <p>Great news! Your order <strong>#${order.orderNumber}</strong> has been confirmed and is now being processed.</p>
          
          <div class="order-details">
            <h3>Order Summary</h3>
            <table>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
              ${order.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="2"><strong>Total</strong></td>
                <td><strong>$${order.total.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          
          <p>We'll notify you once your order is shipped.</p>
          <p>Track your order status: <a href="${process.env.CUSTOMER_FRONTEND_URL}/orders/${order._id}">Click here</a></p>
        </div>
        <div class="footer">
          <p>Thank you for shopping with us!</p>
          <p>Need help? Contact our support team</p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  shipped: (order, customerName, trackingInfo) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .tracking-box { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order Has Shipped! 📦</h1>
        </div>
        <div class="content">
          <h2>Dear ${customerName},</h2>
          <p>Your order <strong>#${order.orderNumber}</strong> is on its way!</p>
          
          <div class="tracking-box">
            <h3>Tracking Information</h3>
            <p><strong>Carrier:</strong> ${trackingInfo.carrier}</p>
            <p><strong>Tracking Number:</strong> ${trackingInfo.number}</p>
            ${trackingInfo.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(trackingInfo.estimatedDelivery).toLocaleDateString()}</p>` : ''}
            ${trackingInfo.url ? `<p><a href="${trackingInfo.url}" class="button">Track Your Order</a></p>` : ''}
          </div>
          
          <p>We hope you love your purchase!</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing us!</p>
        </div>
      </div>
    </body>
    </html>
  `
};