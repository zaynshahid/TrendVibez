import { getOrderHtml } from './orderBase.js';

export function getOrderShippedHtml(order) {
  return getOrderHtml({
    messageTitle: 'Your order is on the way',
    messageBody: 'Your package is on its way! We have handed it over to our shipping partner. You will receive it shortly at the address below.',
    order
  });
}
