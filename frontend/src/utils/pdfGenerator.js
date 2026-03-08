// PDF generation utility for orders
export const generateOrderPDF = (orderData) => {
  // Create a new window for PDF content
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Popup blocked. Please allow popups for this site.');
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const orderNumber = orderData._id ? orderData._id.slice(-8).toUpperCase() : 'N/A';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Order Receipt #${orderNumber}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #333;
          line-height: 1.6;
        }
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .order-info {
          background: #f8f9fa;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
        }
        .order-info h2 {
          margin: 0 0 15px 0;
          color: #495057;
          font-size: 20px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .info-label {
          font-weight: 600;
          color: #6c757d;
        }
        .info-value {
          font-weight: 500;
          color: #495057;
        }
        .restaurant-info {
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
          background: #fff;
        }
        .restaurant-name {
          font-size: 22px;
          font-weight: bold;
          color: #495057;
          margin: 0 0 8px 0;
        }
        .restaurant-location {
          color: #6c757d;
          font-size: 16px;
          margin: 0;
        }
        .items-section {
          padding: 20px;
        }
        .items-section h3 {
          margin: 0 0 20px 0;
          color: #495057;
          font-size: 18px;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f3f4;
        }
        .item:last-child {
          border-bottom: none;
        }
        .item-details {
          flex: 1;
        }
        .item-name {
          font-weight: 600;
          color: #495057;
          margin: 0 0 4px 0;
        }
        .item-category {
          color: #6c757d;
          font-size: 14px;
          text-transform: capitalize;
        }
        .combo-badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          margin-left: 8px;
        }
        .item-quantity {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          color: #495057;
          margin: 0 15px;
        }
        .item-price {
          font-weight: bold;
          color: #28a745;
          font-size: 16px;
        }
        .totals-section {
          background: #f8f9fa;
          padding: 20px;
          border-top: 2px solid #dee2e6;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 8px 0;
        }
        .total-label {
          color: #6c757d;
          font-size: 16px;
        }
        .total-value {
          font-weight: 600;
          color: #495057;
          font-size: 16px;
        }
        .final-total {
          border-top: 2px solid #dee2e6;
          padding-top: 12px;
          margin-top: 12px;
        }
        .final-total .total-label {
          font-size: 18px;
          font-weight: bold;
          color: #495057;
        }
        .final-total .total-value {
          font-size: 20px;
          font-weight: bold;
          color: #28a745;
        }
        .footer {
          background: #495057;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
          opacity: 0.9;
        }
        .thank-you {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        @media print {
          body { margin: 0; }
          .receipt-container { 
            max-width: none; 
            border: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header -->
        <div class="header">
          <h1>🍽️ Student Connect</h1>
          <p>Order Receipt</p>
        </div>

        <!-- Order Information -->
        <div class="order-info">
          <h2>Order Details</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Order #:</span>
              <span class="info-value">${orderNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date & Time:</span>
              <span class="info-value">${currentDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="info-value">Confirmed</span>
            </div>
          </div>
        </div>

        <!-- Restaurant Information -->
        <div class="restaurant-info">
          <h2 class="restaurant-name">${orderData.restaurant?.name || 'Restaurant'}</h2>
          <p class="restaurant-location">📍 ${orderData.restaurant?.location || 'Location not available'}</p>
        </div>

        <!-- Order Items -->
        <div class="items-section">
          <h3>Order Items</h3>
          ${orderData.items.map(item => {
            const itemName = item.name || 'Unknown Item';
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            const itemCategory = item.category || 'food';
            const isCombo = item.isCombo || false;
            
            return `
              <div class="item">
                <div class="item-details">
                  <div class="item-name">
                    ${itemName}
                    ${isCombo ? '<span class="combo-badge">Combo</span>' : ''}
                  </div>
                  <div class="item-category">${itemCategory}</div>
                </div>
                <div class="item-quantity">×${itemQuantity}</div>
                <div class="item-price">LKR ${(itemPrice * itemQuantity).toFixed(2)}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Totals -->
        <div class="totals-section">
          <div class="total-row">
            <span class="total-label">Subtotal (${orderData.items.length} item${orderData.items.length !== 1 ? 's' : ''}):</span>
            <span class="total-value">LKR ${orderData.subtotal?.toFixed(2) || orderData.totalAmount?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="total-row final-total">
            <span class="total-label">Total Amount:</span>
            <span class="total-value">LKR ${(orderData.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="thank-you">Thank you for your order! 🎉</p>
          <p>Student Connect - Connecting Students to Great Food</p>
          <p>Keep this receipt for your records</p>
        </div>
      </div>

      <script>
        // Auto print when page loads
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 500);
        };
        
        // Close window after printing
        window.onafterprint = function() {
          window.close();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Alternative PDF generation using browser's built-in functionality
export const downloadOrderPDF = (orderData) => {
  try {
    generateOrderPDF(orderData);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    // Fallback: create a downloadable text receipt
    const receiptText = createTextReceipt(orderData);
    downloadTextReceipt(receiptText, `order-${orderData._id || 'receipt'}.txt`);
  }
};

const createTextReceipt = (orderData) => {
  const orderNumber = orderData._id ? orderData._id.slice(-8).toUpperCase() : 'N/A';
  const currentDate = new Date().toLocaleDateString();
  
  return `
=====================================
       STUDENT CONNECT RECEIPT
=====================================

Order #: ${orderNumber}
Date: ${currentDate}
Restaurant: ${orderData.restaurant?.name || 'Restaurant'}
Location: ${orderData.restaurant?.location || 'N/A'}

-------------------------------------
ORDER ITEMS
-------------------------------------
${orderData.items.map(item => 
  `${item.name} ${item.isCombo ? '(Combo)' : ''}\n  Qty: ${item.quantity} x LKR ${item.price?.toFixed(2)} = LKR ${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

-------------------------------------
TOTALS
-------------------------------------
Subtotal: LKR ${orderData.totalAmount?.toFixed(2) || '0.00'}
Total: LKR ${(orderData.totalAmount || 0).toFixed(2)}

=====================================
     Thank you for your order!
=====================================
  `;
};

const downloadTextReceipt = (text, filename) => {
  const element = document.createElement('a');
  const file = new Blob([text], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export default { generateOrderPDF, downloadOrderPDF };