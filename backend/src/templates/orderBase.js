import { getLayout } from './layout.js';

export function getOrderStatusBadge(status) {
  const normalized = (status || 'pending').toLowerCase();
  let badgeClass = 'status-pending';
  if (normalized === 'confirmed') badgeClass = 'status-confirmed';
  else if (normalized === 'processing') badgeClass = 'status-processing';
  else if (normalized === 'shipped') badgeClass = 'status-shipped';
  else if (normalized === 'delivered') badgeClass = 'status-delivered';
  else if (normalized === 'cancelled') badgeClass = 'status-cancelled';
  
  return `<span class="status-badge ${badgeClass}">${status}</span>`;
}

export function renderOrderTable(items) {
  if (!items || items.length === 0) return '';
  
  const rows = items.map(item => {
    const imageUrl = item.image || item.imageUrl || '';
    return `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 10px 12px 0; width: 56px; vertical-align: middle;">
        ${imageUrl ? `<img src="${imageUrl}" alt="${item.name}" width="52" height="52" style="width: 52px; height: 52px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" />` : `<div style="width: 52px; height: 52px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0;"></div>`}
      </td>
      <td style="padding: 12px 0; vertical-align: middle;">
        <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${item.name}</div>
        ${item.selectedColor ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">Size / Option: <span style="font-weight: 600; color: #4f46e5;">${item.selectedColor}</span></div>` : ''}
      </td>
      <td style="padding: 12px 0; text-align: center; color: #64748b; font-size: 14px; vertical-align: middle;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; text-align: right; color: #64748b; font-size: 14px; vertical-align: middle;">
        $${parseFloat(item.price).toFixed(2)}
      </td>
      <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px; vertical-align: middle;">
        $${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
      </td>
    </tr>
  `;
  }).join('');

  return `
    <table style="width: 100%; margin-top: 16px; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
          <th style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; width: 56px;">Item</th>
          <th style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b;"></th>
          <th style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; text-align: center; width: 50px;">Qty</th>
          <th style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; text-align: right; width: 75px;">Price</th>
          <th style="padding-bottom: 8px; font-size: 13px; font-weight: 600; color: #64748b; text-align: right; width: 85px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export function getOrderHtml({ messageTitle, messageBody, order }) {
  const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleDateString('en-US');

  const content = `
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; font-family: 'Outfit', sans-serif;">
      ${messageTitle}
    </h2>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
      Hi ${order.name},
      <br><br>
      ${messageBody}
    </p>
    
    <!-- Order Card Summary -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding-bottom: 12px; font-size: 13px; color: #64748b; font-weight: 500;">ORDER NUMBER</td>
          <td style="padding-bottom: 12px; font-size: 13px; color: #1e293b; font-weight: 600; text-align: right;">${order.orderReference || order.id}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px; font-size: 13px; color: #64748b; font-weight: 500;">ORDER DATE</td>
          <td style="padding-bottom: 12px; font-size: 13px; color: #1e293b; font-weight: 600; text-align: right;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px; font-size: 13px; color: #64748b; font-weight: 500;">STATUS</td>
          <td style="padding-bottom: 12px; text-align: right;">${getOrderStatusBadge(order.status)}</td>
        </tr>
      </table>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 16px; margin-bottom: 16px;"></div>
      
      <h3 style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px;">ORDER ITEMS</h3>
      ${renderOrderTable(order.items)}
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 16px; margin-bottom: 16px;"></div>
      
      <table style="width: 100%;">
        <tr>
          <td style="font-size: 15px; color: #1e293b; font-weight: 700;">TOTAL AMOUNT</td>
          <td style="font-size: 18px; color: #4f46e5; font-weight: 700; text-align: right;">$${parseFloat(order.totalAmount).toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- Shipping Address -->
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">SHIPPING ADDRESS</h3>
      <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0; white-space: pre-line;">${order.address}</p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin-top: 20px;">
      <a href="${process.env.APP_URL || 'http://localhost:5173'}/orders/${order.id}" class="btn">View Order Details</a>
    </div>
  `;

  return getLayout({
    title: `${messageTitle} - ${order.orderReference || order.id}`,
    preheader: messageTitle,
    content: content
  });
}
