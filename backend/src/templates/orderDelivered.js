import { getOrderHtml } from './orderBase.js';

export function getOrderDeliveredHtml(order) {
  return getOrderHtml({
    messageTitle: 'Your order has been delivered',
    messageBody: 'Hooray! Our records show that your order has been successfully delivered. We hope you enjoy your purchase!',
    order
  });
}
