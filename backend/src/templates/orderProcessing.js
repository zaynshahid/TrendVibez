import { getOrderHtml } from './orderBase.js';

export function getOrderProcessingHtml(order) {
  return getOrderHtml({
    messageTitle: 'We are preparing your order',
    messageBody: 'We are currently processing and packaging your items. Our team is carefully inspecting everything to ensure top quality. We will send you another update once it ships.',
    order
  });
}
