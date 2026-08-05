import { getLayout } from './layout.js';

export function getPasswordResetHtml(user, resetLink) {
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; font-family: 'Outfit', sans-serif;">
      Reset Your Password
    </h2>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Hi ${user.name || 'there'},
      <br><br>
      We received a request to reset the password associated with your TrendVibe account. Click the button below to set a new password:
    </p>
    
    <!-- Action Button -->
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${resetLink}" class="btn" style="background-color: #f43f5e; box-shadow: 0 4px 6px -1px rgba(244, 63, 94, 0.2);">Reset Password</a>
    </div>
    
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
      <p style="font-size: 13px; line-height: 1.5; color: #b45309; margin: 0;">
        <strong>Notice:</strong> This password reset link is only valid for <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email and your password will remain unchanged.
      </p>
    </div>
    
    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
      If the button above doesn't work, copy and paste this URL into your browser:<br>
      <a href="${resetLink}" style="word-break: break-all;">${resetLink}</a>
    </p>
  `;

  return getLayout({
    title: 'Reset Your Password - TrendVibe',
    preheader: 'Set a new password for your TrendVibe account',
    content: content
  });
}
