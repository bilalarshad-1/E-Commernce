const Customer = require('../models/Customer');
const CustomerAuditLog = require('../models/CustomerAuditLog');
const auditLog = require('../middleware/auditMiddleware');

// @desc    Get all customers (Admin)
// @route   GET /api/admin/customers
// @access  Private/Admin
exports.getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || '-createdAt';
    
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.isActive) filter.isActive = req.query.isActive === 'true';
    if (req.query.isEmailVerified) filter.isEmailVerified = req.query.isEmailVerified === 'true';
    
    const customers = await Customer.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Customer.countDocuments(filter);
    
    await auditLog(req, 'VIEW', 'Customer', null, { action: 'viewed-customers-list' });
    
    res.status(200).json({
      success: true,
      data: customers,
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

// @desc    Get single customer (Admin)
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    await auditLog(req, 'VIEW', 'Customer', customer._id, {
      action: 'viewed-customer-details',
      customerEmail: customer.email
    });
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update customer (Admin)
// @route   PUT /api/admin/customers/:id
// @access  Private/Admin
exports.updateCustomer = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'email', 'phone', 'isActive', 'isEmailVerified', 'role'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    await auditLog(req, 'UPDATE', 'Customer', customer._id, {
      updatedFields: Object.keys(updates),
      updatedBy: req.user.email
    });
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete customer (Admin)
// @route   DELETE /api/admin/customers/:id
// @access  Private/Admin
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    await auditLog(req, 'DELETE', 'Customer', customer._id, {
      deletedCustomer: { name: `${customer.firstName} ${customer.lastName}`, email: customer.email },
      deletedBy: req.user.email
    });
    
    await customer.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get customer audit logs (Admin)
// @route   GET /api/admin/customers/:id/audit-logs
// @access  Private/Admin
exports.getCustomerAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const logs = await CustomerAuditLog.find({ customer: req.params.id })
      .sort('-timestamp')
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await CustomerAuditLog.countDocuments({ customer: req.params.id });
    
    res.status(200).json({
      success: true,
      data: logs,
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

// @desc    Get customer statistics (Admin)
// @route   GET /api/admin/customers/stats/summary
// @access  Private/Admin
exports.getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ isActive: true });
    const verifiedCustomers = await Customer.countDocuments({ isEmailVerified: true });
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });
    
    const topSpenders = await Customer.find()
      .sort('-totalSpent')
      .limit(5)
      .select('firstName lastName email totalSpent totalOrders');
    
    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        verifiedCustomers,
        newCustomersThisMonth,
        topSpenders
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