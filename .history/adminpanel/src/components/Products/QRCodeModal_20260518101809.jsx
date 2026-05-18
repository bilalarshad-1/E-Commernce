// components/products/QRCodeModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiPrinter, FiCopy, FiCheck, FiEdit2, FiSave } from 'react-icons/fi';
import { MdQrCodeScanner } from "react-icons/md";
import toast from 'react-hot-toast';

const QRCodeModal = ({ isOpen, onClose, product, onSave }) => {
  const [qrData, setQrData] = useState('');
  const [qrSize, setQrSize] = useState(200);
  const [copied, setCopied] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      const defaultUrl = `${window.location.origin}/product/${product._id}`;
      const existingData = product.qrCode?.data || defaultUrl;
      setQrData(existingData);
      setEditedData(existingData);
      generateQRCode(existingData);
    }
  }, [isOpen, product]);

  const generateQRCode = (data) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(data)}`;
    setQrImageUrl(url);
  };

  const handleQrDataChange = (e) => {
    const newData = e.target.value;
    setEditedData(newData);
    generateQRCode(newData);
  };

  const handleSaveData = () => {
    setQrData(editedData);
    setIsEditing(false);
    generateQRCode(editedData);
    toast.success('QR data updated');
  };

  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setQrSize(newSize);
    generateQRCode(qrData);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.download = `qrcode-${product?.productName?.replace(/[^a-z0-9]/gi, '_') || 'product'}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('QR Code downloaded successfully');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${product?.productName || 'Product'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
            .qr-card { background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            img { max-width: 250px; margin: 20px auto; }
            .product-name { font-size: 18px; font-weight: bold; margin: 15px 0 5px; }
            .product-url { font-size: 12px; color: #666; word-break: break-all; max-width: 300px; margin-top: 10px; }
            @media print { body { background: white; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <img src="${qrImageUrl}" alt="QR Code" />
            <div class="product-name">${product?.productName || 'Product'}</div>
            <div class="product-url">${qrData}</div>
            <div class="no-print" style="margin-top: 30px;">
              <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Close</button>
            </div>
          </div>
          <script>window.print();setTimeout(()=>window.close(),500);</script>
        </body>
      </html>
    `);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrData);
    setCopied(true);
    toast.success('QR data copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!qrData) {
      toast.error('Please enter QR data');
      return;
    }
    onSave({ data: qrData });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MdQrCodeScanner className="h-6 w-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Generate QR Code</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* QR Code Preview */}
                <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center">
                  {qrImageUrl && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <img 
                        src={qrImageUrl}
                        alt="QR Code Preview"
                        className="border-2 border-gray-200 rounded-lg shadow-sm"
                        style={{ width: qrSize, height: qrSize }}
                      />
                      <div className="flex gap-2 mt-4 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDownload}
                          className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
                        >
                          <FiDownload className="h-3 w-3" />
                          Download
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handlePrint}
                          className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
                        >
                          <FiPrinter className="h-3 w-3" />
                          Print
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCopy}
                          className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
                        >
                          {copied ? <FiCheck className="h-3 w-3" /> : <FiCopy className="h-3 w-3" />}
                          Copy
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* QR Code Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QR Data / URL
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedData}
                          onChange={handleQrDataChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          placeholder="Enter URL or text for QR code"
                        />
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSaveData}
                            className="btn-primary flex items-center gap-1 text-sm px-3 py-1.5"
                          >
                            <FiSave className="h-3 w-3" />
                            Save
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditing(false)}
                            className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm break-all">
                          {qrData}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsEditing(true)}
                          className="btn-secondary flex items-center gap-1"
                        >
                          <FiEdit2 className="h-4 w-4" />
                          Edit
                        </motion.button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      This will be encoded into the QR code. Users will see this when scanning.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QR Code Size: {qrSize}px
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="400"
                      step="10"
                      value={qrSize}
                      onChange={handleSizeChange}
                      className="w-full"
                    />
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Product URL:</strong> {window.location.origin}/product/{product?._id}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      This URL will direct customers to the product page when scanned
                    </p>
                  </div>

                  {product && product.qrCode?.data && product.qrCode.data !== qrData && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs text-yellow-600">
                        Note: This product already has a QR code. Generating a new one will replace it.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="btn-primary flex-1"
                >
                  Save QR Code
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QRCodeModal;