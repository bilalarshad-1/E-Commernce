const Newsletter = require('../models/Newsletter');
const sendEmail = require('../utils/emailService');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
exports.subscribe = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    
    if (existing) {
      if (existing.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Email already subscribed'
        });
      } else {
        // Reactivate subscription
        existing.status = 'active';
        existing.name = name || existing.name;
        existing.unsubscribedAt = null;
        await existing.save();
        
        // Send welcome back email
        await sendEmail({
          email: existing.email,
          subject: 'Welcome Back to Our Newsletter!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Welcome Back! 🎉</h2>
              <p>Dear ${name || 'Valued Customer'},</p>
              <p>You have successfully resubscribed to our newsletter. You'll now receive:</p>
              <ul>
                <li>Exclusive deals and discounts</li>
                <li>New product announcements</li>
                <li>Style inspiration and tips</li>
                <li>Early access to sales</li>
              </ul>
              <p>Thank you for being part of our community!</p>
              <hr style="margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">You can unsubscribe anytime by clicking the link in our emails.</p>
            </div>
          `
        });
        
        return res.status(200).json({
          success: true,
          message: 'Successfully resubscribed to newsletter'
        });
      }
    }

    // Create new subscription
    const subscription = await Newsletter.create({
      email,
      name: name || null,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')
    });

    // Send welcome email
    await sendEmail({
      email: subscription.email,
      subject: 'Welcome to Our Newsletter! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to ShopHub Family! 🛍️</h2>
          <p>Dear ${name || 'Valued Customer'},</p>
          <p>Thank you for subscribing to our newsletter! You're now part of our exclusive community.</p>
          <h3>What you'll get:</h3>
          <ul>
            <li><strong>10% OFF</strong> your next purchase (check your email for coupon code)</li>
            <li>Exclusive early access to sales</li>
            <li>Member-only discounts and deals</li>
            <li>New product announcements</li>
            <li>Style guides and tips</li>
          </ul>
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">🎁 <strong>Your Welcome Coupon:</strong> <span style="color: #4F46E5; font-size: 18px;">WELCOME10</span></p>
            <p style="margin: 5px 0 0; font-size: 12px;">Use code at checkout for 10% off your first order</p>
          </div>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">We respect your privacy. Unsubscribe anytime.</p>
        </div>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: {
        email: subscription.email,
        subscribedAt: subscription.subscribedAt
      }
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already subscribed'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    const subscription = await Newsletter.findOne({ email });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    subscription.status = 'unsubscribed';
    subscription.unsubscribedAt = new Date();
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get newsletter stats (Admin)
// @route   GET /api/newsletter/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments({ status: 'active' });
    const newThisMonth = await Newsletter.countDocuments({
      status: 'active',
      subscribedAt: { $gte: new Date(new Date().setDate(1)) }
    });
    const unsubscribed = await Newsletter.countDocuments({ status: 'unsubscribed' });
    
    res.status(200).json({
      success: true,
      data: {
        totalSubscribers,
        newThisMonth,
        unsubscribed
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Send newsletter to all subscribers (Admin)
// @route   POST /api/newsletter/send
// @access  Private/Admin
exports.sendNewsletter = async (req, res) => {
  try {
    const { subject, content, html } = req.body;
    
    if (!subject || (!content && !html)) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }
    
    const subscribers = await Newsletter.find({ status: 'active' });
    
    let successCount = 0;
    let failCount = 0;
    
    for (const subscriber of subscribers) {
      try {
        await sendEmail({
          email: subscriber.email,
          subject: subject,
          html: html || `<div>${content}</div>`
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        failCount++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Newsletter sent to ${successCount} subscribers`,
      data: {
        total: subscribers.length,
        success: successCount,
        failed: failCount
      }
    });
  } catch (error) {
    console.error('Send newsletter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};