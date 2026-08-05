import { getOrderHtml } from './orderBase.js';

export function getOrderPlacedHtml(order) {
  return getOrderHtml({
    messageTitle: 'Thank you for your order',
    messageBody: 'Thank you for shopping with us! We have received your order and are currently preparing it. We will notify you as soon as your order status changes.',
    order
  });
}
