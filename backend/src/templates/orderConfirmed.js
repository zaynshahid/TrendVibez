import { getOrderHtml } from './orderBase.js';

export function getOrderConfirmedHtml(order) {
  return getOrderHtml({
    messageTitle: 'Your order has been confirmed',
    messageBody: 'Great news! Your order has been confirmed and we are getting ready to prepare your items. You can find your receipt details below.',
    order
  });
}
