import { getLayout } from './layout.js';

export function getWelcomeHtml(user) {
  const content = `
    <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; font-family: 'Outfit', sans-serif;">
      Welcome to TrendVibe, ${user.name}!
    </h2>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      We're absolutely thrilled to have you join our fashion community. TrendVibe is dedicated to bringing you the latest trends, curated styles, and premium quality garments.
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
      To help you get started, explore our new arrivals and find your next favorite outfit.
    </p>
    
    <!-- Call to Action -->
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${process.env.APP_URL || 'http://localhost:5173'}" class="btn">Start Shopping Now</a>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
      <p style="font-size: 14px; color: #64748b; margin: 0;">
        Your registered email: <strong>${user.email}</strong>
      </p>
    </div>
  `;

  return getLayout({
    title: 'Welcome to TrendVibe!',
    preheader: `We're thrilled to have you, ${user.name}!`,
    content: content
  });
}
