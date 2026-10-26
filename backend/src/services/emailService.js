import nodemailer from 'nodemailer';
import { logEmail, hasEmailBeenSent } from '../db.js';

// Import templates
import { getOrderPlacedHtml } from '../templates/orderPlaced.js';
import { getOrderConfirmedHtml } from '../templates/orderConfirmed.js';
import { getOrderProcessingHtml } from '../templates/orderProcessing.js';
import { getOrderShippedHtml } from '../templates/orderShipped.js';
import { getOrderDeliveredHtml } from '../templates/orderDelivered.js';
import { getOrderCancelledHtml } from '../templates/orderCancelled.js';
import { getWelcomeHtml } from '../templates/welcome.js';
import { getPasswordResetHtml } from '../templates/passwordReset.js';
import { getContactUsHtml } from '../templates/contactUs.js';
import { getLowStockHtml } from '../templates/lowStock.js';
import { getAdminOrderPlacedHtml } from '../templates/adminOrderPlaced.js';
import { getOrderRefundApprovedHtml } from '../templates/orderRefundApproved.js';

// ─── Nodemailer Gmail Transporter ────────────────────────────────────────────
let transporterInstance = null;

const getTransporter = () => {
  if (!transporterInstance) {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.warn('⚠️  Warning: EMAIL_USER or EMAIL_PASS is not set in .env. Emails will fail.');
    }

    transporterInstance = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user || '',
        pass: pass || '',
      },
    });
  }
  return transporterInstance;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Core send function using Gmail SMTP
async function sendMail({ to, subject, html }) {
  if (!to) throw new Error('Recipient email is required');
  if (!validateEmail(to)) throw new Error(`Invalid email address format: ${to}`);
  if (!subject) throw new Error('Subject is required');

  const from = `"${process.env.APP_NAME || 'TrendVibe'}" <${process.env.EMAIL_USER}>`;
  const transporter = getTransporter();

  const info = await transporter.sendMail({ from, to, subject, html });
  console.log(`[Gmail SMTP] Message sent: ${info.messageId}`);
  return info;
}

// Shared wrapper — logs result to DB, suppresses errors so order flow is never blocked
async function safeSend({ to, subject, html, preventDuplicate = false }) {
  try {
    if (preventDuplicate) {
      const alreadySent = await hasEmailBeenSent(to, subject);
      if (alreadySent) {
        console.log(`[Email Service] Duplicate skipped → ${to} | "${subject}"`);
        return { success: true, message: 'Duplicate email skipped' };
      }
    }

    const data = await sendMail({ to, subject, html });

    await logEmail({ recipient: to, subject, status: 'Success' });
    console.log(`[Email Service] ✅ Sent → ${to} | "${subject}"`);
    return { success: true, data };

  } catch (err) {
    // Log failure but never crash the request
    try {
      await logEmail({
        recipient: to || 'unknown@example.com',
        subject: subject || 'No Subject',
        status: 'Failed',
        errorMessage: err.message,
      });
    } catch (dbErr) {
      console.error('Failed to log email error to DB:', dbErr.message);
    }

    console.warn(`⚠️  [Email Warning] Failed → ${to || 'unknown'} | "${subject}" | Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ─── Exported Service Methods ─────────────────────────────────────────────────

export async function sendOrderPlacedEmail(order) {
  const html = getOrderPlacedHtml(order);
  const subject = `Thank you for your order – ${order.orderReference || order.id}`;
  return safeSend({ to: order.email, subject, html, preventDuplicate: true });
}

export async function sendOrderConfirmedEmail(order) {
  const html = getOrderConfirmedHtml(order);
  const subject = `Your order has been confirmed – ${order.orderReference || order.id}`;
  return safeSend({ to: order.email, subject, html, preventDuplicate: true });
}

export async function sendProcessingEmail(order) {
  const html = getOrderProcessingHtml(order);
  const subject = `We are preparing your order – ${order.orderReference || order.id}`;
  return safeSend({ to: order.email, subject, html, preventDuplicate: true });
}

export async function sendShippedEmail(order) {
  const html = getOrderShippedHtml(order);
  const subject = `Your order is on the way – ${order.orderReference || order.id}`;
  return safeSend({ to: order.email, subject, html, preventDuplicate: true });
}

export async function sendDeliveredEmail(order) {
  const html = getOrderDeliveredHtml(order);
  const subject = `Your order has been delivered – ${order.orderReference || order.id}`;
  return safeSend({ to: order.email, subject, html, preventDuplicate: true });
}

export async function sendCancelledEmail(order) {
  const html = getOrderCancelledHtml(order);
  const subject = `Your order has been cancelled – ${order.orderReference || order.id}`;
  return safeSend({ to: order.email, subject, html, preventDuplicate: true });
}

export async function sendWelcomeEmail(user) {
  const html = getWelcomeHtml(user);
  const subject = `Welcome to ${process.env.APP_NAME || 'TrendVibe'}, ${user.name}!`;
  return safeSend({ to: user.email, subject, html });
}

export async function sendPasswordResetEmail(user, resetLink) {
  const html = getPasswordResetHtml(user, resetLink);
  const subject = `Reset your password – ${process.env.APP_NAME || 'TrendVibe'}`;
  return safeSend({ to: user.email, subject, html });
}

export async function sendContactUsEmail({ name, email, subject, message }) {
  const html = getContactUsHtml({ name, email, subject, message });
  const adminEmail = process.env.EMAIL_USER;
  return safeSend({ to: adminEmail, subject: `[Contact Form] ${subject}`, html });
}

export async function sendLowStockEmail(adminEmail, product) {
  const html = getLowStockHtml(product);
  const subject = `⚠️ Low Stock Warning: ${product.name}`;
  return safeSend({ to: adminEmail, subject, html, preventDuplicate: true });
}

export async function sendAdminOrderPlacedEmail(adminEmail, order) {
  const html = getAdminOrderPlacedHtml(order);
  const subject = `🎉 New Order Placed: ${order.orderReference || order.id}`;
  return safeSend({ to: adminEmail, subject, html });
}

export async function sendRefundApprovedEmail(order, refundAmount) {
  const html = getOrderRefundApprovedHtml(order, refundAmount);
  const subject = `Your refund has been approved – ${order.orderReference || order.id}`;
  return safeSend({ to: order.email, subject, html, preventDuplicate: false });
}

