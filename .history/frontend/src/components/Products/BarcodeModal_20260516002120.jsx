// components/products/BarcodeModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiDownload, FiPrinter, FiCopy, FiCheck, FiSearch, FiRotateCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { . } from "react-icons/bs";
const BarcodeModal = ({ isOpen, onClose, product, onSave }) => {
  const [barcodeNumber, setBarcodeNumber] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128');
  const [barcodeHeight, setBarcodeHeight] = useState(50);
  const [barcodeWidth, setBarcodeWidth] = useState(2);
  const [includeText, setIncludeText] = useState(true);
  const [copied, setCopied] = useState(false);
  const [barcodeImageUrl, setBarcodeImageUrl] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      const existingBarcode = product.barcode?.number || '';
      setBarcodeNumber(existingBarcode);
      if (existingBarcode) {
        generateBarcode(existingBarcode);
      }
    }
  }, [isOpen, product]);

  const generateBarcode = (code) => {
    if (!code) return;
    
    const url = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(code)}&code=${barcodeFormat}&dpi=96&height=${barcodeHeight}&width=${barcodeWidth}&includetext=${includeText}`;
    setBarcodeImageUrl(url);
  };

  const handleBarcodeNumberChange = (e) => {
    const value = e.target.value.toUpperCase();
    setBarcodeNumber(value);
    if (value) {
      generateBarcode(value);
    }
  };

  const handleFormatChange = (e) => {
    const format = e.target.value;
    setBarcodeFormat(format);
    if (barcodeNumber) {
      generateBarcode(barcodeNumber);
    }
  };

  const handleHeightChange = (e) => {
    const height = parseInt(e.target.value);
    setBarcodeHeight(height);
    if (barcodeNumber) {
      generateBarcode(barcodeNumber);
    }
  };

  const handleWidthChange = (e) => {
    const width = parseFloat(e.target.value);
    setBarcodeWidth(width);
    if (barcodeNumber) {
      generateBarcode(barcodeNumber);
    }
  };

  const handleIncludeTextChange = (e) => {
    const include = e.target.checked;
    setIncludeText(include);
    if (barcodeNumber) {
      generateBarcode(barcodeNumber);
    }
  };

  const generateRandomBarcode = () => {
    const prefixes = {
      'CODE128': 'PROD',
      'EAN13': '59',
      'EAN8': '4',
      'UPC-A': '0',
      'CODE39': 'PRD'
    };
    const prefix = prefixes[barcodeFormat] || 'PROD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newBarcode = `${prefix}${timestamp}${random}`;
    setBarcodeNumber(newBarcode);
    generateBarcode(newBarcode);
    toast.success('Random barcode generated');
  };

  const handleScanBarcode = () => {
    setIsScanning(true);
    // Simulate barcode scanner input
    // In production, you would use a barcode scanner API or device
    setTimeout(() => {
      setIsScanning(false);
      if (scanInput) {
        setBarcodeNumber(scanInput.toUpperCase());
        generateBarcode(scanInput.toUpperCase());
        setScanInput('');
        toast.success('Barcode scanned successfully');
      }
    }, 1000);
  };

  const handleDownload = async () => {
    if (!barcodeImageUrl) {
      toast.error('No barcode to download');
      return;
    }
    
    try {
      const response = await fetch(barcodeImageUrl);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.download = `barcode-${barcodeNumber}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Barcode downloaded successfully');
    } catch (error) {
      toast.error('Failed to download barcode');
    }
  };

  const handlePrint = () => {
    if (!barcodeImageUrl) {
      toast.error('No barcode to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode - ${product?.productName || 'Product'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }
            .barcode-card {
              background: white;
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .barcode-image {
              margin: 20px 0;
            }
            .barcode-number {
              font-size: 20px;
              letter-spacing: 2px;
              margin: 10px 0;
              font-weight: bold;
            }
            .product-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .price {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
              margin-top: 10px;
            }
            @media print {
              body { background: white; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-card">
            <div class="product-name">${product?.productName || 'Product'}</div>
            <div class="barcode-image">
              <img src="${barcodeImageUrl}" alt="Barcode" style="max-width: 100%;" />
            </div>
            <div class="barcode-number">${barcodeNumber}</div>
            <div class="price">$${(product?.price || 0).toFixed(2)}</div>
            <div class="no-print" style="margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; cursor: pointer;">Close</button>
            </div>
          </div>
          <script>
            window.print();
            setTimeout(() => window.close(), 500);
          </script>
        </body>
      </html>
    `);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(barcodeNumber);
    setCopied(true);
    toast.success('Barcode copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!barcodeNumber) {
      toast.error('Please enter or generate a barcode number');
      return;
    }
    onSave({ number: barcodeNumber, format: barcodeFormat, imageUrl: barcodeImageUrl });
    toast.success('Barcode saved successfully');
    onClose();
  };

  const barcodeFormats = [
    { value: 'CODE128', label: 'Code 128 (Alphanumeric)' },
    { value: 'CODE39', label: 'Code 39 (Alphanumeric)' },
    { value: 'EAN13', label: 'EAN-13 (13 digits)' },
    { value: 'EAN8', label: 'EAN-8 (8 digits)' },
    { value: 'UPC-A', label: 'UPC-A (12 digits)' },
    { value: 'CODABAR', label: 'Codabar' },
    { value: 'ITF', label: 'ITF (Interleaved 2 of 5)' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiBarcode className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Generate Barcode</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Barcode Preview */}
            <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center">
              {barcodeImageUrl ? (
                <>
                  <img 
                    src={barcodeImageUrl}
                    alt="Barcode Preview"
                    className="border border-gray-200 rounded-lg shadow-sm bg-white p-4"
                  />
                  <div className="mt-4 text-center">
                    <p className="font-mono text-lg font-bold tracking-wider">{barcodeNumber}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleDownload}
                      className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
                    >
                      <FiDownload className="h-3 w-3" />
                      Download
                    </button>
                    <button
                      onClick={handlePrint}
                      className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
                    >
                      <FiPrinter className="h-3 w-3" />
                      Print
                    </button>
                    <button
                      onClick={handleCopy}
                      className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"
                    >
                      {copied ? <FiCheck className="h-3 w-3" /> : <FiCopy className="h-3 w-3" />}
                      Copy
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <FiBarcode className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Enter barcode number to preview</p>
                </div>
              )}
            </div>

            {/* Barcode Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeNumber}
                    onChange={handleBarcodeNumberChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                    placeholder="Enter barcode number"
                  />
                  <button
                    onClick={generateRandomBarcode}
                    className="btn-secondary flex items-center gap-1"
                    title="Generate Random"
                  >
                    <FiRotateCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode Format
                </label>
                <select
                  value={barcodeFormat}
                  onChange={handleFormatChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {barcodeFormats.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height: {barcodeHeight}px
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={barcodeHeight}
                    onChange={handleHeightChange}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width: {barcodeWidth}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={barcodeWidth}
                    onChange={handleWidthChange}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeText"
                  checked={includeText}
                  onChange={handleIncludeTextChange}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="includeText" className="text-sm text-gray-700">
                  Include text below barcode
                </label>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scan Barcode (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleScanBarcode()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Scan or type barcode"
                    disabled={isScanning}
                  />
                  <button
                    onClick={handleScanBarcode}
                    disabled={isScanning}
                    className="btn-primary flex items-center gap-1"
                  >
                    {isScanning ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FiSearch className="h-4 w-4" />
                    )}
                    Scan
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use a barcode scanner or enter the barcode number manually
                </p>
              </div>

              {product && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <strong>Product:</strong> {product.productName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Price:</strong> ${(product.price || 0).toFixed(2)}
                  </p>
                  {product.barcode?.number && product.barcode.number !== barcodeNumber && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Note: This product already has a barcode. Generating a new one will replace it.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} className="btn-primary flex-1">
              Save Barcode
            </button>
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeModal;