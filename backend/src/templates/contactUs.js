import { getLayout } from './layout.js';

export function getContactUsHtml({ name, email, subject, message }) {
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; font-family: 'Outfit', sans-serif;">
      New Support Inquiry Received
    </h2>
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Hello Admin,
      <br><br>
      A customer has submitted a new inquiry via the contact form on the website. The details are below:
    </p>
    
    <!-- Info Card -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 30px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding-bottom: 12px; font-size: 13px; color: #64748b; font-weight: 500; width: 100px;">SENDER</td>
          <td style="padding-bottom: 12px; font-size: 13px; color: #1e293b; font-weight: 600;">${name}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px; font-size: 13px; color: #64748b; font-weight: 500;">EMAIL</td>
          <td style="padding-bottom: 12px; font-size: 13px; color: #1e293b; font-weight: 600;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px; font-size: 13px; color: #64748b; font-weight: 500;">SUBJECT</td>
          <td style="padding-bottom: 12px; font-size: 13px; color: #1e293b; font-weight: 600;">${subject}</td>
        </tr>
      </table>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 16px; margin-bottom: 16px;"></div>
      
      <h3 style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px;">MESSAGE:</h3>
      <div style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0; white-space: pre-wrap; background-color: #ffffff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">${message}</div>
    </div>
    
    <div style="text-align: center;">
      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" class="btn">Reply via Email</a>
    </div>
  `;

  return getLayout({
    title: `Contact Form Inquiry: ${subject}`,
    preheader: `New contact submission from ${name}`,
    content: content
  });
}
