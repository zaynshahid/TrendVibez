import { getLayout } from './layout.js';

export function getLowStockHtml(product) {
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; color: #dc2626; margin-top: 0; margin-bottom: 16px; font-family: 'Outfit', sans-serif;">
      ⚠️ Inventory Warning: Low Stock Alert
    </h2>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Hello Admin,
      <br><br>
      This is an automated system notification that the stock level for the following product has fallen below the safety threshold (5 units). Please replenish this product immediately to avoid running out of stock.
    </p>
    
    <!-- Product Card -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
      <table style="width: 100%;">
        <tr>
          ${product.image ? `
          <td style="width: 80px; padding-right: 16px; vertical-align: top;">
            <img src="${product.image}" alt="${product.name}" style="width: 80px; height: auto; border-radius: 8px; border: 1px solid #e2e8f0;">
          </td>
          ` : ''}
          <td style="vertical-align: top;">
            <h4 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0;">${product.name}</h4>
            <p style="font-size: 13px; color: #64748b; margin: 0 0 8px 0;">ID: ${product.id}</p>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Category: ${product.category} | Price: $${parseFloat(product.price).toFixed(2)}</p>
          </td>
        </tr>
      </table>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 16px; margin-bottom: 16px;"></div>
      
      <table style="width: 100%;">
        <tr>
          <td style="font-size: 14px; color: #64748b; font-weight: 500;">CURRENT STOCK LEVEL</td>
          <td style="font-size: 18px; color: #dc2626; font-weight: 700; text-align: right;">${product.stock} items remaining</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.APP_URL || 'http://localhost:5173'}/admin/products" class="btn" style="background-color: #dc2626; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">Manage Stock</a>
    </div>
  `;

  return getLayout({
    title: `Low Stock Warning: ${product.name}`,
    preheader: `Stock for ${product.name} is down to ${product.stock} units!`,
    content: content
  });
}
