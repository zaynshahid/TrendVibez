export function getLayout({ title, preheader, content }) {
  const appName = process.env.APP_NAME || 'TrendVibe';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
    
    body {
      font-family: 'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      width: 100% !important;
    }
    
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      width: 100%;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    a {
      text-decoration: none;
      color: #4f46e5;
    }

    .wrapper {
      background-color: #f8fafc;
      width: 100%;
      padding: 40px 0;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.05);
    }

    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);
      padding: 32px 40px;
      text-align: center;
    }

    .logo-container {
      display: inline-block;
      padding: 8px 16px;
      background-color: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      backdrop-filter: blur(8px);
    }

    .logo-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      font-family: 'Outfit', sans-serif;
    }

    .logo-dot {
      color: #f43f5e;
    }

    .content-body {
      padding: 40px;
    }

    .footer {
      background-color: #f1f5f9;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }

    .footer-text {
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
      margin: 8px 0;
    }

    .footer-links a {
      color: #64748b;
      margin: 0 12px;
      font-weight: 500;
      font-size: 13px;
    }

    .btn {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      padding: 14px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -2px rgba(79, 70, 229, 0.2);
      transition: background-color 0.2s;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-pending { background-color: #fef3c7; color: #d97706; }
    .status-confirmed { background-color: #dbeafe; color: #2563eb; }
    .status-processing { background-color: #e0f2fe; color: #0284c7; }
    .status-shipped { background-color: #f3e8ff; color: #7c3aed; }
    .status-delivered { background-color: #dcfce7; color: #16a34a; }
    .status-cancelled { background-color: #fee2e2; color: #dc2626; }

    @media only screen and (max-width: 600px) {
      .wrapper {
        padding: 0;
      }
      .container {
        border-radius: 0;
      }
      .content-body, .header, .footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${preheader}</span>` : ''}
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo-container">
          <span class="logo-text">${appName}<span class="logo-dot">.</span></span>
        </div>
      </div>
      
      <!-- Content Body -->
      <div class="content-body">
        ${content}
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <div class="footer-links">
          <a href="${process.env.APP_URL || 'http://localhost:5173'}">Shop</a>
          <a href="${process.env.APP_URL || 'http://localhost:5173'}/orders">My Orders</a>
          <a href="${process.env.APP_URL || 'http://localhost:5173'}/contact">Contact Us</a>
        </div>
        <p class="footer-text" style="margin-top: 20px;">
          &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br>
          This is an automated transaction email. If you have any questions, please contact our support.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
