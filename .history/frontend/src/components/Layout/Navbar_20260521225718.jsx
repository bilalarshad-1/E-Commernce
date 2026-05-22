import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">DesiCart</h3>
            <p className="text-gray-400 mb-4">
              Pakistan's #1 online shopping destination. Shop the best products at amazing prices with fast delivery.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition"><FiFacebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition"><FiTwitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition"><FiInstagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition"><FiYoutube size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/shop" className="text-gray-400 hover:text-white transition">Shop</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition">Contact Us</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-white transition">FAQ</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-xl font-bold mb-4">Policies</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white transition">Terms & Conditions</Link></li>
              <li><Link to="/returns" className="text-gray-400 hover:text-white transition">Return Policy</Link></li>
              <li><Link to="/shipping" className="text-gray-400 hover:text-white transition">Shipping Info</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-400">
                <FiMapPin /> Karachi, Pakistan
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <FiPhone /> +92 300 1234567
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <FiMail /> support@desicart.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} DesiCart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;