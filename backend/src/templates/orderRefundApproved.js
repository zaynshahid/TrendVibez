import { getLayout } from './layout.js';
import { formatOrderAmount } from './orderBase.js';

export function getOrderRefundApprovedHtml(order, refundAmount) {
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US');

  const refundFormatted = formatOrderAmount(refundAmount, order);

  const content = `
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; font-family: 'Outfit', sans-serif;">
      Your Refund Has Been Approved ✅
    </h2>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
      Hi ${order.name},
      <br><br>
      Great news! Your refund request for <strong>Order #${order.orderReference || order.id}</strong> has been reviewed and <strong style="color: #059669;">approved</strong>.
      <br><br>
      Please allow <strong>3–5 business days</strong> for the funds to appear in your original payment method. Processing times may vary slightly depending on your bank or card issuer.
    </p>

    <!-- Refund Summary Card -->
    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; border: 1px solid #bbf7d0; margin-bottom: 30px;">
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
          <td style="padding-bottom: 0; font-size: 15px; color: #1e293b; font-weight: 700;">REFUND AMOUNT</td>
          <td style="padding-bottom: 0; font-size: 22px; color: #059669; font-weight: 800; text-align: right;">${refundFormatted}</td>
        </tr>
      </table>
    </div>

    <!-- Timeline note -->
    <div style="background-color: #eff6ff; border-radius: 12px; padding: 18px 20px; border: 1px solid #bfdbfe; margin-bottom: 30px;">
      <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 600;">
        ⏱️ &nbsp;Refund Processing Timeline
      </p>
      <p style="margin: 6px 0 0; font-size: 13px; color: #3b82f6; line-height: 1.5;">
        Your refund of <strong>${refundFormatted}</strong> will be credited to your original payment method within <strong>3–5 business days</strong>.
        If you have not received your refund after 5 business days, please contact our support team.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-top: 20px;">
      <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard" class="btn">View My Orders</a>
    </div>
  `;

  return getLayout({
    title: `Refund Approved – ${order.orderReference || order.id}`,
    preheader: `Your refund of ${refundFormatted} for Order ${order.orderReference || order.id} has been approved.`,
    content,
  });
}
