import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import Layout from '../components/Layout/Layout';
import toast from 'react-hot-toast';
import { FiTruck, FiCreditCard, FiDollarSign, FiShield, FiTag, FiTrash2 } from 'react-icons/fi';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    paymentMethod: 'cod',
    shippingMethod: 'standard',
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
    fetchShippingMethods();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cartTotal, shippingCost, discountAmount, formData.shippingMethod, formData.country]);

  const fetchShippingMethods = async () => {
    try {
      const response = await orderService.getShippingMethods();
      setShippingMethods(response.data.data || []);
    } catch (error) {
      console.error('Fetch shipping methods error:', error);
      setShippingMethods([
        { name: 'standard', displayName: 'Standard Shipping', cost: 10, minDays: 3, maxDays: 7 },
        { name: 'express', displayName: 'Express Shipping', cost: 25, minDays: 1, maxDays: 3 }
      ]);
    }
  };

  const calculateTotal = async () => {
    setCalculating(true);
    try {
      const items = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        variationId: item.variation?.id || null
      }));
      
      const response = await orderService.calculateShippingAndTax({
        items,
        shippingAddress: {
          country: formData.country,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode
        },
        couponCode: couponApplied?.code,
        shippingMethod: formData.shippingMethod
      });
      
      if (response.data.success) {
        const data = response.data.data;
        setShippingCost(data.shippingCost);
        setTaxAmount(data.tax);
        setDiscountAmount(data.couponDiscount);
        setFinalTotal(data.total);
      }
    } catch (error) {
      console.error('Calculate error:', error);
      const shipping = cartTotal > 100 ? 0 : 10;
      const tax = cartTotal * 0.1;
      setShippingCost(shipping);
      setTaxAmount(tax);
      setFinalTotal(cartTotal + shipping + tax);
    } finally {
      setCalculating(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    try {
      const items = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        variationId: item.variation?.id || null
      }));
      
      const response = await orderService.validateCoupon({
        couponCode,
        subtotal: cartTotal,
        userId: user?._id || null
      });
      
      if (response.data.success) {
        setCouponApplied({
          code: couponCode,
          discount: response.data.data.discount,
          discountType: response.data.data.discountType,
          freeShipping: response.data.data.freeShipping
        });
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon code');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const orderItems = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      variationId: item.variation?.id || null,
      colorId: item.color?.id || null
    }));

    const orderData = {
      items: orderItems,
      shippingAddress: {
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country
      },
      paymentMethod: formData.paymentMethod,
      shippingMethod: formData.shippingMethod,
      ...(couponApplied && { couponCode: couponApplied.code }),
      isGuest: !isAuthenticated,
      ...(!isAuthenticated && {
        guestInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        }
      })
    };

    try {
      const response = await orderService.createOrder(orderData);
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/order/${response.data.data.order._id}`);
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  const subtotal = cartTotal;
  const selectedShippingMethod = shippingMethods.find(m => m.name === formData.shippingMethod);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="input-field" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 2 (Optional)</label>
                  <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State/Province *</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code *</label>
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country *</label>
                    <select name="country" value={formData.country} onChange={handleChange} required className="input-field">
                      <option value="Pakistan">Pakistan</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-semibold mt-6 mb-4">Shipping Method</h2>
              <div className="space-y-3 mb-6">
                {shippingMethods.map(method => (
                  <label key={method.name} className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer ${formData.shippingMethod === method.name ? 'border-indigo-600 bg-indigo-50' : 'hover:border-indigo-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shippingMethod" value={method.name} checked={formData.shippingMethod === method.name} onChange={handleChange} className="text-indigo-600" />
                      <div>
                        <p className="font-medium">{method.displayName}</p>
                        <p className="text-sm text-gray-500">Delivery in {method.minDays}-{method.maxDays} business days</p>
                      </div>
                    </div>
                    <span className="font-semibold">{method.cost === 0 ? 'Free' : `$${method.cost.toFixed(2)}`}</span>
                  </label>
                ))}
              </div>

              <h2 className="text-xl font-semibold mt-6 mb-4">Payment Method</h2>
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-indigo-300">
                  <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} className="text-indigo-600" />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay when you receive your order</p>
                  </div>
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary py-3">
                {loading ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {/* Coupon */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input type="text" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={!!couponApplied} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  {couponApplied ? (
                    <button onClick={() => setCouponApplied(null)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm">Remove</button>
                  ) : (
                    <button onClick={handleApplyCoupon} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Apply</button>
                  )}
                </div>
                {couponApplied && <p className="text-xs text-green-600 mt-1">Coupon applied! {couponApplied.discount}% off</p>}
              </div>
              
              {/* Items */}
              <div className="max-h-64 overflow-y-auto mb-4 space-y-3">
                {cartItems.map(item => (
                  <div key={item.cartKey} className="flex gap-3 text-sm">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Shipping</span><span>{calculating ? '...' : `$${shippingCost.toFixed(2)}`}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{calculating ? '...' : `$${taxAmount.toFixed(2)}`}</span></div>
              </div>
              <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t">
                <span>Total</span>
                <span className="text-indigo-600">{calculating ? '...' : `$${finalTotal.toFixed(2)}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;