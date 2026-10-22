/**
 * Cards & Curio Marketplace - HTML Email Templates (Functions Backend)
 * Fully responsive, cross-client email templates optimized for all viewports (Mobile 320px+, Tablet, Desktop, Outlook, Apple Mail, Gmail).
 */

const LOGIN_URL = process.env.APP_URL || "http://localhost:5173/login";
const SUPPORT_EMAIL = process.env.SENDGRID_FROM_EMAIL || "concierge@bentleycarwash.com";
const PRIMARY_GREEN = "#D4AF37";

/**
 * Common HTML wrapper matching the clean modern Cards & Curio branding.
 * Features fluid table-based layout, CSS resets, client-specific conditional logic,
 * responsive typography, and mobile media queries.
 */
function renderEmailWrapper(contentHtml: string) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Bentley Mobile Car Wash</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Cross-client CSS resets */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #f8fafc !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }
    table, td {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    img {
      border: 0 !important;
      height: auto !important;
      line-height: 100% !important;
      outline: none !important;
      text-decoration: none !important;
      -ms-interpolation-mode: bicubic !important;
    }
    body, table, td, p, a, li, blockquote {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    a {
      text-decoration: none;
    }
    /* Mobile responsive overrides */
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
      }
      .outer-padding {
        padding: 20px 12px !important;
      }
      .card-body {
        padding: 26px 18px !important;
        border-radius: 16px !important;
      }
      .logo-title {
        font-size: 24px !important;
      }
      .heading-title {
        font-size: 20px !important;
        line-height: 1.3 !important;
      }
      .body-text {
        font-size: 14px !important;
        line-height: 1.55 !important;
      }
      .info-box {
        padding: 16px 14px !important;
        margin: 18px 0 !important;
      }
      .info-label {
        display: block !important;
        width: 100% !important;
        margin-bottom: 2px !important;
      }
      .info-value {
        display: block !important;
        width: 100% !important;
        margin-bottom: 8px !important;
      }
      .button-cta {
        display: block !important;
        width: 100% !important;
        padding: 14px 16px !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
      .otp-code-text {
        font-size: 32px !important;
        letter-spacing: 6px !important;
      }
      .footer-text {
        font-size: 12px !important;
        line-height: 1.6 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- Preheader spacing -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Cards &amp; Curio Marketplace Notification
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; width: 100%;">
    <tr>
      <td align="center" class="outer-padding" style="padding: 40px 16px;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" width="600" align="center" border="0" cellpadding="0" cellspacing="0">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" class="email-container" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; margin: 0 auto;">
          <!-- Header / Brand Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="http://localhost:5173" target="_blank" style="text-decoration: none;">
                      <span class="logo-title" style="font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        Bentley <span style="color: ${PRIMARY_GREEN};">Car Wash</span>
                      </span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main White Card Container -->
          <tr>
            <td align="left">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
                <tr>
                  <td class="card-body" style="padding: 36px 32px;">
                    ${contentHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td align="center" style="padding-top: 28px; padding-bottom: 12px;">
              <p class="footer-text" style="margin: 0 0 6px 0; font-size: 13px; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
                &copy; 2026 Bentley Mobile Car Wash &amp; Detailing. All rights reserved.
              </p>
              <p class="footer-text" style="margin: 0; font-size: 13px; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;">
                Have questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: ${PRIMARY_GREEN}; text-decoration: none; font-weight: 600;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates a bulletproof, mobile-responsive Call-To-Action Button
 */
function renderActionButton(label: string, url: string) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; margin-bottom: 8px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" bgcolor="${PRIMARY_GREEN}" style="border-radius: 12px; background-color: ${PRIMARY_GREEN};">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="25%" stroke="f" fillcolor="${PRIMARY_GREEN}">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${label}</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${url}" target="_blank" class="button-cta" style="display: inline-block; background-color: ${PRIMARY_GREEN}; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-decoration: none; box-shadow: 0 4px 14px rgba(16, 188, 0, 0.25); text-align: center; border: 1px solid ${PRIMARY_GREEN};">
                  ${label}
                </a>
                <!--<![endif]-->
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * 1. Welcome Email for New Marketplace Users
 */
export const welcomeUserEmailTemplate = (userName: string) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
      Welcome to the Family! 🚀
    </h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Hello <strong style="color: #0f172a;">${userName}</strong>,
    </p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Great news! Your account has been created successfully on <strong style="color: ${PRIMARY_GREEN};">Cards &amp; Curio Marketplace</strong>.
    </p>
    <p class="body-text" style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      You can now explore rare trading cards, bid on classified listings, and connect with passionate collectors worldwide.
    </p>

    <!-- Info Box -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="info-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 100px; display: inline-block;">Account:</strong> ${userName}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 100px; display: inline-block;">Status:</strong> <span style="color: ${PRIMARY_GREEN}; font-weight: 700;">Active &amp; Verified</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 100px; display: inline-block;">Platform:</strong> Cards &amp; Curio Marketplace
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${renderActionButton("Go to Dashboard", LOGIN_URL)}
  `);
};

export const welcomeProEmailTemplate = (userName: string) => {
  return welcomeUserEmailTemplate(userName);
};

/**
 * 2. Order Confirmation Email for Buyers
 */
export const orderConfirmationEmailTemplate = (data: {
  buyerName: string;
  itemTitle: string;
  orderId: string;
  amount: number;
}) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
      Order Confirmed! 🎉
    </h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Hello <strong style="color: #0f172a;">${data.buyerName}</strong>,
    </p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Thank you for your purchase! Your order has been placed successfully on <strong style="color: ${PRIMARY_GREEN};">Cards &amp; Curio</strong>.
    </p>

    <!-- Info Box -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="info-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 110px; display: inline-block;">Item Title:</strong> ${data.itemTitle}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 110px; display: inline-block;">Order ID:</strong> #${data.orderId}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 110px; display: inline-block;">Total Paid:</strong> <span style="color: ${PRIMARY_GREEN}; font-weight: 700;">$${data.amount.toFixed(2)} USD</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p class="body-text" style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.6; color: #64748b;">
      You can track the shipment status and view receipt details anytime from your account dashboard.
    </p>

    ${renderActionButton("View Order Details", LOGIN_URL)}
  `);
};

/**
 * 3. Item Sold Notification for Sellers
 */
export const itemSoldEmailTemplate = (data: {
  sellerName: string;
  itemTitle: string;
  orderId: string;
  amount: number;
}) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
      Great News! Item Sold! 💰
    </h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Hello <strong style="color: #0f172a;">${data.sellerName}</strong>,
    </p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      A collector has just purchased your listing on <strong style="color: ${PRIMARY_GREEN};">Cards &amp; Curio Marketplace</strong>.
    </p>

    <!-- Info Box -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="info-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 120px; display: inline-block;">Item Name:</strong> ${data.itemTitle}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 120px; display: inline-block;">Order Ref:</strong> #${data.orderId}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 120px; display: inline-block;">Payout Amount:</strong> <span style="color: ${PRIMARY_GREEN}; font-weight: 700;">$${data.amount.toFixed(2)} USD</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p class="body-text" style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.6; color: #64748b;">
      Please log in to your seller portal to prepare the parcel for shipping and update tracking information.
    </p>

    ${renderActionButton("Go to Seller Portal", LOGIN_URL)}
  `);
};

/**
 * 4. Contact Form Submission Receipt (for User)
 */
export const contactReceiptEmailTemplate = (name: string, subject?: string) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
      We Received Your Message! 📩
    </h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Hello <strong style="color: #0f172a;">${name}</strong>,
    </p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Thank you for reaching out to <strong style="color: ${PRIMARY_GREEN};">Cards &amp; Curio Support</strong> regarding <strong>"${subject || "your inquiry"}"</strong>.
    </p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Our customer support team is reviewing your message and will respond directly to this email address shortly.
    </p>

    <!-- Info Box -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="info-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 100px; display: inline-block;">From:</strong> ${name}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 100px; display: inline-block;">Subject:</strong> ${subject || "General Inquiry"}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px; color: #475569; font-family: sans-serif;">
                <strong style="color: #0f172a; width: 100px; display: inline-block;">Status:</strong> <span style="color: ${PRIMARY_GREEN}; font-weight: 700;">Under Support Review</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `);
};

/**
 * 5. OTP Two-Factor Verification Code Email
 */
export const otpVerificationEmailTemplate = (userName: string, otpCode: string) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; text-align: center;">
      Two-Factor Authentication
    </h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Hello <strong style="color: #0f172a;">${userName}</strong>,
    </p>
    <p class="body-text" style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      A sign-in attempt was initiated for your account requiring Two-Factor Authentication. Please use the following one-time verification code:
    </p>

    <!-- OTP Display Box -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td align="center" bgcolor="#f0fdf4" style="background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 16px; padding: 22px 16px;">
          <span class="otp-code-text" style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: ${PRIMARY_GREEN}; display: inline-block; word-break: break-all;">
            ${otpCode}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 16px 0 6px 0; font-size: 13px; color: #ef4444; text-align: center; font-weight: 700; font-family: sans-serif;">
      ⏱️ This OTP code expires in 15 minutes and can only be used once.
    </p>
    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; font-family: sans-serif;">
      If you did not initiate this login request, please change your password immediately.
    </p>
  `);
};

/**
 * 6. News Blast / Platform Announcement Email
 */
export const newsBlastEmailTemplate = (data: { title: string; message: string; userName?: string }) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
      📢 ${data.title}
    </h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Hello <strong style="color: #0f172a;">${data.userName || "Valued Collector"}</strong>,
    </p>
    
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="info-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 18px 0;">
      <tr>
        <td style="padding: 18px 20px; font-size: 15px; line-height: 1.65; color: #1e293b; font-family: sans-serif; white-space: pre-wrap; word-break: break-word;">
          ${data.message}
        </td>
      </tr>
    </table>

    ${renderActionButton("Visit Cards & Curio", LOGIN_URL)}
  `);
};

/**
 * 7. Newsletter Broadcast Email Template
 */
export const newsletterBroadcastEmailTemplate = (bodyContentHtml: string, recipientEmail: string) => {
  const unsubscribeUrl = `https://cardsandcurio.com/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Cards &amp; Curio Newsletter</title>
  <style type="text/css">
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #f8fafc !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }
    table, td {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    img {
      border: 0 !important;
      height: auto !important;
      line-height: 100% !important;
      outline: none !important;
      text-decoration: none !important;
      max-width: 100% !important;
    }
    body, table, td, p, a, li, blockquote {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .outer-padding {
        padding: 20px 12px !important;
      }
      .card-body {
        padding: 24px 16px !important;
        border-radius: 14px !important;
      }
      .logo-title {
        font-size: 22px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc">
    <tr>
      <td align="center" class="outer-padding" style="padding: 36px 16px;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" width="600" align="center" border="0" cellpadding="0" cellspacing="0">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" class="email-container" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; margin: 0 auto;">
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <h2 class="logo-title" style="margin: 0; font-size: 26px; font-weight: 800; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                Cards <span style="color: ${PRIMARY_GREEN};">&amp; Curio</span>
              </h2>
            </td>
          </tr>
          <tr>
            <td align="left">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; border-radius: 16px; border: 1px solid ${PRIMARY_GREEN}; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);">
                <tr>
                  <td class="card-body" style="padding: 32px 28px; font-size: 15px; line-height: 1.65; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; word-break: break-word;">
                    ${bodyContentHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; font-family: sans-serif; text-align: center;">
                &copy; 2026 Cards &amp; Curio. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-family: sans-serif; text-align: center; line-height: 1.6;">
                You received this email because you are subscribed to Cards &amp; Curio updates.<br />
                To opt out of future emails, you can <a href="${unsubscribeUrl}" style="color: #0f172a; text-decoration: underline; font-weight: 700;">unsubscribe here</a>.
              </p>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * 8. Password Reset Email Template
 */
export const passwordResetEmailTemplate = (userName: string, resetUrl?: string) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
      Reset Your Password 🔐
    </h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Hello <strong style="color: #0f172a;">${userName}</strong>,
    </p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      We received a request to reset the password for your <strong style="color: ${PRIMARY_GREEN};">Cards &amp; Curio</strong> account.
    </p>
    <p class="body-text" style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
      Click the button below to set up a new secure password. If you did not request this password reset, you can safely disregard this email.
    </p>

    ${renderActionButton("Reset Password", resetUrl || LOGIN_URL)}
  `);
};

export const documentStatusEmailTemplate = (userName: string, documentName: string, status: 'approved' | 'rejected') => {
  const isApproved = status === 'approved';
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a;">Document Status Update</h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; color: #334155;">Hello <strong style="color: #0f172a;">${userName}</strong>,</p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">Your document <strong>${documentName}</strong> has been reviewed.</p>
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="info-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px; font-size: 14px; color: #475569;">
          <strong>Status:</strong> <span style="color: ${isApproved ? '#16a34a' : '#dc2626'}; font-weight: 700;">${isApproved ? 'Approved' : 'Rejected'}</span>
        </td>
      </tr>
    </table>
    ${renderActionButton("Go to Dashboard", LOGIN_URL)}
  `);
};

export const veteranStatusEmailTemplate = (userName: string, status: 'verified' | 'rejected') => {
  const isVerified = status === 'verified';
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a;">Military / Veteran Status Update</h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; color: #334155;">Hello <strong style="color: #0f172a;">${userName}</strong>,</p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">Your military verification request has been evaluated.</p>
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="info-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px; font-size: 14px; color: #475569;">
          <strong>Status:</strong> <span style="color: ${isVerified ? '#16a34a' : '#dc2626'}; font-weight: 700;">${isVerified ? 'Verified' : 'Rejected'}</span>
        </td>
      </tr>
    </table>
    ${renderActionButton("Go to Dashboard", LOGIN_URL)}
  `);
};

export const newProSignupAdminEmailTemplate = (proDetails: { name: string; email: string; phone?: string; role?: string; }) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a;">New Registration Alert 🔐</h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; color: #334155;">A new user has registered on Cards &amp; Curio:</p>
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="info-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 20px 0;">
      <tr>
        <td style="padding: 16px 20px; font-size: 14px; color: #475569;">
          <div><strong>Name:</strong> ${proDetails.name}</div>
          <div style="margin-top: 6px;"><strong>Email:</strong> ${proDetails.email}</div>
        </td>
      </tr>
    </table>
    ${renderActionButton("Open Admin Console", LOGIN_URL)}
  `);
};

export const newLeadNotificationEmailTemplate = (leadData: { shortTitle: string; proName: string }) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a;">New Lead Alert 🚀</h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; color: #334155;">Hello <strong style="color: #0f172a;">${leadData.proName}</strong>,</p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">A new lead matching your profile is available: <strong>${leadData.shortTitle}</strong>.</p>
    ${renderActionButton("View Lead Details", LOGIN_URL)}
  `);
};

export const newBookingNotificationEmailTemplate = (bookingData: { serviceTitle: string; proName: string }) => {
  return renderEmailWrapper(`
    <h1 class="heading-title" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a;">New Booking Confirmed 🎉</h1>
    <p class="body-text" style="margin: 0 0 14px 0; font-size: 15px; color: #334155;">Hello <strong style="color: #0f172a;">${bookingData.proName}</strong>,</p>
    <p class="body-text" style="margin: 0 0 16px 0; font-size: 15px; color: #334155;">A new booking has been confirmed for: <strong>${bookingData.serviceTitle}</strong>.</p>
    ${renderActionButton("View Booking", LOGIN_URL)}
  `);
};
