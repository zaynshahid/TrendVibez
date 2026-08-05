import { getLayout } from './layout.js';
import { renderOrderTable } from './orderBase.js';

export function getAdminOrderPlacedHtml(order) {
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; color: #4f46e5; margin-top: 0; margin-bottom: 16px; font-family: 'Outfit', sans-serif;">
      🎉 New Order Received!
    </h2>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Hello Admin,
      <br><br>
      A customer has successfully placed an order. Below are the order details:
    </p>
    
    <!-- Customer Info -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
      <h3 style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px;">CUSTOMER INFO</h3>
      <table style="width: 100%; font-size: 13px;">
        <tr>
          <td style="padding-bottom: 8px; color: #64748b; font-weight: 500; width: 100px;">Name:</td>
          <td style="padding-bottom: 8px; color: #1e293b; font-weight: 600;">${order.name}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px; color: #64748b; font-weight: 500;">Email:</td>
          <td style="padding-bottom: 8px; color: #1e293b; font-weight: 600;"><a href="mailto:${order.email}">${order.email}</a></td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500; vertical-align: top;">Shipping To:</td>
          <td style="color: #1e293b; font-weight: 600; white-space: pre-line;">${order.address}</td>
        </tr>
      </table>
    </div>
    
    <!-- Order Card Summary -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding-bottom: 12px; font-size: 13px; color: #64748b; font-weight: 500;">ORDER REFERENCE</td>
          <td style="padding-bottom: 12px; font-size: 13px; color: #1e293b; font-weight: 600; text-align: right;">${order.orderReference || order.id}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px; font-size: 13px; color: #64748b; font-weight: 500;">TOTAL AMOUNT</td>
          <td style="padding-bottom: 12px; font-size: 16px; color: #4f46e5; font-weight: 700; text-align: right;">$${parseFloat(order.totalAmount).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="font-size: 13px; color: #64748b; font-weight: 500;">PAYMENT METHOD</td>
          <td style="font-size: 13px; color: #1e293b; font-weight: 600; text-align: right;">${order.paymentMethod || 'Mock Card'}</td>
        </tr>
      </table>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 16px; margin-bottom: 16px;"></div>
      
      <h3 style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px;">ITEMS LIST</h3>
      ${renderOrderTable(order.items)}
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.APP_URL || 'http://localhost:5173'}/admin/orders/${order.id}" class="btn">View in Admin Panel</a>
    </div>
  `;

  return getLayout({
    title: `New Order Received: ${order.orderReference || order.id}`,
    preheader: `New sale of $${parseFloat(order.totalAmount).toFixed(2)} from ${order.name}`,
    content: content
  });
}
