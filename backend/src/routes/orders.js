import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getCartByUserId, createOrder, getOrders, getOrderById, updateOrderStatus, approveRefund, deleteOrder, query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getRates } from '../services/currencyService.js';
import {
  sendOrderPlacedEmail,
  sendOrderConfirmedEmail,
  sendProcessingEmail,
  sendShippedEmail,
  sendDeliveredEmail,
  sendCancelledEmail,
  sendLowStockEmail,
  sendAdminOrderPlacedEmail,
  sendRefundApprovedEmail
} from '../services/emailService.js';
import { logActivity, getClientIp } from '../services/activityLogger.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
const checkoutRateLimit = createRateLimiter({
  scope: 'checkout',
  limit: 5,
  windowMs: 15 * 60 * 1000,
  keyGenerator: req => [req.ip, req.user?.id || 'anonymous']
});

function getEffectiveProductPrice(product) {
  const price = Number(product?.price);
  const discountPercent = Number(product?.discountPercent || 0);
  if (!Number.isFinite(price)) return 0;
  if (discountPercent > 0) {
    return parseFloat((price * (1 - discountPercent / 100)).toFixed(2));
  }
  return price;
}

// CREATE ORDER (Checkout & Pay)
router.post('/', requireAuth, checkoutRateLimit, async (req, res) => {
  const { name, email, address, paymentMethod, currencyCode, platform } = req.body;

  if (!name || !email || !address) {
    return res.status(400).json({ message: 'Delivery name, email, and address are required' });
  }

  try {
    const userCart = await getCartByUserId(req.user.id);
    if (userCart.length === 0) {
      return res.status(400).json({ message: 'Cannot place order: Cart is empty' });
    }

    // Determine normalized acquisition platform
    let orderPlatform = 'Direct';
    if (typeof platform === 'string') {
      const pLower = platform.trim().toLowerCase();
      if (pLower.includes('insta')) orderPlatform = 'Instagram';
      else if (pLower.includes('fb') || pLower.includes('face')) orderPlatform = 'Facebook';
      else if (pLower) orderPlatform = platform.trim();
    }

    const orderItems = [];
    let totalAmount = 0;

    // Validate stock and construct order items
    for (const item of userCart) {
      const product = item.product;
      if (product.name === 'Product Unavailable' || !product.id) {
        return res.status(404).json({ message: `Product not found: ID ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product '${product.name}'. Only ${product.stock} left, requested ${item.quantity}.`
        });
      }

      const itemPrice = getEffectiveProductPrice(product);
      
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        image: product.image,
        selectedColor: item.selectedColor || ''
      });

      totalAmount += itemPrice * item.quantity;
    }

    // Generate a random invoice reference: TV-XXXXXX
    const orderRef = `TV-${Math.floor(100000 + Math.random() * 900000)}`;
    const normalizedPaymentMethod = typeof paymentMethod === 'string'
      ? paymentMethod.trim().toLowerCase()
      : '';
    if (normalizedPaymentMethod !== 'cash on delivery') {
      return res.status(400).json({ message: 'Only Cash on Delivery is currently available.' });
    }
    const supportedCurrencies = ['USD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR'];
    const orderCurrency = supportedCurrencies.includes(currencyCode) ? currencyCode : 'USD';
    const exchangeRates = await getRates();
    const orderCurrencyRate = Number(exchangeRates.rates?.[orderCurrency]);
    if (!Number.isFinite(orderCurrencyRate) || orderCurrencyRate <= 0) {
      return res.status(503).json({ message: 'Currency conversion is temporarily unavailable.' });
    }
    
    const newOrder = await createOrder({
      id: uuidv4(),
      orderReference: orderRef,
      userId: req.user.id,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      currencyCode: orderCurrency,
      currencyRate: orderCurrencyRate,
      name,
      email,
      address,
      paymentMethod: 'Cash on Delivery',
      platform: orderPlatform,
      createdAt: new Date().toISOString(),
      items: orderItems
    });

    // Fire email notifications in the background so request is not delayed
    (async () => {
      try {
        // 1. Customer: Order Placed email
        const emailResult = await sendOrderPlacedEmail(newOrder);

        // Log customer order-placed email to audit trail
        logActivity({
          adminId: 'SYSTEM',
          adminName: 'System (Auto)',
          action: 'SEND_EMAIL',
          module: 'email',
          recordId: newOrder.orderReference || newOrder.id,
          newData: {
            type: 'ORDER_PLACED',
            recipient: newOrder.email,
            customerName: newOrder.name,
            orderReference: newOrder.orderReference,
            subject: `Thank you for your order – ${newOrder.orderReference || newOrder.id}`,
            status: emailResult?.success ? 'sent' : 'failed'
          }
        });

        // Fetch admin emails
        const admins = await query("SELECT email FROM users WHERE role = 'admin'");
        
        // 2. Admin: New Order Placed email
        for (const admin of admins) {
          await sendAdminOrderPlacedEmail(admin.email, newOrder);
        }

        // 3. Admin: Low Stock alerts (if stock falls below safety limit of 5)
        for (const item of newOrder.items) {
          const prodRows = await query("SELECT id, name, image, category, price, stock FROM products WHERE id = ?", [item.productId]);
          if (prodRows.length > 0) {
            const product = prodRows[0];
            if (parseInt(product.stock) < 5) {
              for (const admin of admins) {
                await sendLowStockEmail(admin.email, {
                  id: product.id,
                  name: product.name,
                  image: product.image,
                  category: product.category,
                  price: parseFloat(product.price),
                  stock: parseInt(product.stock)
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('⚠️ [Email Error] Background order email triggers failed:', err);
      }
    })();

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({ message: error.message || 'Order submission failed.' });
  }
});

// GET USER'S ORDER HISTORY (Or ALL orders if Admin)
router.get('/', requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const orders = await getOrders(req.user.id, isAdmin);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET SPECIFIC ORDER DETAIL BY ID (User owned or Admin)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Allow only the owner or an admin to access details
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: You do not own this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// UPDATE ORDER STATUS (Admin Only)
router.put('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updatedOrder = await updateOrderStatus(req.params.id, status);

    // Log the status change
    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'UPDATE_ORDER_STATUS',
      module: 'orders',
      recordId: order.id,
      oldData: { orderReference: order.orderReference, status: order.status },
      newData: { orderReference: order.orderReference, status },
      ipAddress: getClientIp(req)
    });

    // Send order status change email in the background
    const adminIdForLog = req.user.id;
    const adminNameForLog = req.user.name;
    const ipForLog = getClientIp(req);
    (async () => {
      try {
        let emailType = null;
        let emailResult = null;

        if (status === 'Pending') {
          emailType = 'ORDER_PLACED';
          emailResult = await sendOrderPlacedEmail(updatedOrder);
        } else if (status === 'Confirmed') {
          emailType = 'ORDER_CONFIRMED';
          emailResult = await sendOrderConfirmedEmail(updatedOrder);
        } else if (status === 'Processing') {
          emailType = 'ORDER_PROCESSING';
          emailResult = await sendProcessingEmail(updatedOrder);
        } else if (status === 'Shipped') {
          emailType = 'ORDER_SHIPPED';
          emailResult = await sendShippedEmail(updatedOrder);
        } else if (status === 'Delivered') {
          emailType = 'ORDER_DELIVERED';
          emailResult = await sendDeliveredEmail(updatedOrder);
        } else if (status === 'Cancelled') {
          emailType = 'ORDER_CANCELLED';
          emailResult = await sendCancelledEmail(updatedOrder);
        }

        // Log the email dispatch to the audit trail
        if (emailType) {
          logActivity({
            adminId: adminIdForLog,
            adminName: adminNameForLog,
            action: 'SEND_EMAIL',
            module: 'email',
            recordId: updatedOrder.orderReference || updatedOrder.id,
            newData: {
              type: emailType,
              recipient: updatedOrder.email,
              customerName: updatedOrder.name,
              orderReference: updatedOrder.orderReference,
              subject: `${emailType.replace(/_/g, ' ')} – ${updatedOrder.orderReference || updatedOrder.id}`,
              status: emailResult?.success ? 'sent' : 'failed'
            },
            ipAddress: ipForLog
          });
        }
      } catch (err) {
        console.error('⚠️ [Email Error] Background order status email trigger failed:', err);
      }
    })();

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// APPROVE REFUND (Admin Only)
router.post('/:id/refund', requireAdmin, async (req, res) => {
  const { refundAmount } = req.body;
  const parsedAmount = parseFloat(refundAmount);

  if (!refundAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'A valid refund amount greater than 0 is required.' });
  }

  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.refundStatus === 'Approved') {
      return res.status(400).json({ message: 'A refund has already been approved for this order.' });
    }

    if (parsedAmount > order.totalAmount) {
      return res.status(400).json({ message: `Refund amount cannot exceed the order total of $${order.totalAmount.toFixed(2)}.` });
    }

    const updatedOrder = await approveRefund(req.params.id, parsedAmount);

    // Log the refund approval
    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'APPROVE_REFUND',
      module: 'orders',
      recordId: order.id,
      oldData: { orderReference: order.orderReference, refundStatus: order.refundStatus || 'None' },
      newData: { orderReference: order.orderReference, refundStatus: 'Approved', refundAmount: parsedAmount },
      ipAddress: getClientIp(req)
    });

    // Send refund approval email in the background
    const adminIdForLog = req.user.id;
    const adminNameForLog = req.user.name;
    const ipForLog = getClientIp(req);
    (async () => {
      try {
        const emailResult = await sendRefundApprovedEmail(updatedOrder, parsedAmount);
        logActivity({
          adminId: adminIdForLog,
          adminName: adminNameForLog,
          action: 'SEND_EMAIL',
          module: 'email',
          recordId: updatedOrder.orderReference || updatedOrder.id,
          newData: {
            type: 'REFUND_APPROVED',
            recipient: updatedOrder.email,
            customerName: updatedOrder.name,
            orderReference: updatedOrder.orderReference,
            refundAmount: parsedAmount,
            subject: `Your refund has been approved – ${updatedOrder.orderReference || updatedOrder.id}`,
            status: emailResult?.success ? 'sent' : 'failed'
          },
          ipAddress: ipForLog
        });
      } catch (err) {
        console.error('⚠️ [Email Error] Refund approval email failed:', err);
      }
    })();

    res.json(updatedOrder);
  } catch (error) {
    console.error('Approve refund error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE/CANCEL ORDER (Admin Only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await deleteOrder(req.params.id);

    logActivity({
      adminId: req.user.id,
      adminName: req.user.name,
      action: 'DELETE_ORDER',
      module: 'orders',
      recordId: order.id,
      oldData: { orderReference: order.orderReference, totalAmount: order.totalAmount, status: order.status, customer: order.name },
      ipAddress: getClientIp(req)
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
