import { getOrderHtml } from './orderBase.js';

export function getOrderCancelledHtml(order) {
  return getOrderHtml({
    messageTitle: 'Your order has been cancelled',
    messageBody: 'We regret to inform you that your order has been cancelled. If this was a mistake or if you have any questions, please contact our support team immediately.',
    order
  });
}
