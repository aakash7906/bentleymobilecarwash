/**
 * Bentley Mobile Car Wash & Detailing - HTML Email Templates
 * Minimalist, modern email templates inspired by clean design systems.
 * Uses brand design tokens: Primary Red (#dc2626), Dark (#111418), Border (#e5e7eb), Background (#f8fafc).
 */

const LOGIN_URL = process.env.APP_URL || "https://bentleymobilecarwash.pages.dev";
const SUPPORT_EMAIL = process.env.SMTP_USER || "concierge@bentleycarwash.com";

/**
 * Common HTML wrapper with a minimalist card layout:
 * - Brand logo / title centered at the top outside the card.
 * - Clean white card with rounded corners and light border.
 * - Minimal footer beneath the card.
 */
function renderEmailWrapper(contentHtml: string) {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <title>Bentley Mobile Car Wash</title>
  <style type="text/css">
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #f8fafc !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      border-collapse: collapse !important;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .card-body {
        padding: 28px 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 32px 12px; background-color: #f8fafc;">
  <center style="width: 100%; background-color: #f8fafc;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 0 0 20px 0;">
          <!-- Centered Brand Header Outside Card -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
            <tr>
              <td align="center">
                <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #111418; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Bentley<span style="color: #dc2626;">.</span>
                </span>
                <div style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">
                  Mobile Car Wash &bull; Detailing
                </div>
              </td>
            </tr>
          </table>

          <!-- Minimalist White Card -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); overflow: hidden;">
            <tr>
              <td class="card-body" style="padding: 40px 36px; background-color: #ffffff;">
                ${contentHtml}
              </td>
            </tr>
          </table>

          <!-- Minimal Footer Beneath Card -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 24px auto 0 auto; text-align: center;">
            <tr>
              <td style="text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.6; padding: 0 16px;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #6b7280;">Bentley Mobile Car Wash &amp; Auto Detailing</p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #9ca3af;">Kelowna &amp; Okanagan Valley, British Columbia</p>
                <p style="margin: 0 0 12px 0; font-size: 11px;">
                  Questions? Reach out to <a href="mailto:${SUPPORT_EMAIL}" style="color: #dc2626; font-weight: 600; text-decoration: none;">${SUPPORT_EMAIL}</a>
                </p>
                <p style="margin: 0; font-size: 11px; color: #cbd5e1;">&copy; ${currentYear} Bentley Mobile Car Wash. All rights reserved.</p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

/**
 * Modern minimalist CTA button matching the project's signature red theme.
 */
function renderActionButton(buttonText: string, actionUrl: string) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 8px 0;">
      <tr>
        <td align="center">
          <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; background-color: #dc2626; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25); letter-spacing: 0.2px;">
            ${buttonText}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * 1. Booking Confirmation Email Template
 */
export const bookingConfirmationEmailTemplate = (booking: {
  bookingId: string;
  customerName: string;
  serviceTitle: string;
  vehicle: string;
  date: string;
  timeSlot: string;
  address: string;
  price: string;
  paymentMethod?: string;
  technicianName?: string;
}) => {
  return renderEmailWrapper(`
    <!-- Headline & Greeting -->
    <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #111418; line-height: 1.3; letter-spacing: -0.3px;">
      Your detailing is confirmed, ${booking.customerName}! 🚗
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
      Thank you for booking with Bentley Mobile Car Wash. Our mobile detailing technician is scheduled to arrive at your address with a fully self-contained unit.
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 24px; font-size: 13px;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Booking Reference</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-family: monospace; color: #111418;">${booking.bookingId}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Service Package</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111418;">${booking.serviceTitle}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Target Vehicle</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${booking.vehicle}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Date &amp; Time</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${booking.date} at ${booking.timeSlot}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Dispatch Address</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${booking.address}</td>
      </tr>
      ${booking.technicianName ? `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Assigned Detailer</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111418;">${booking.technicianName}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 14px 16px; font-weight: 700; color: #111418;">Total Paid</td>
        <td align="right" style="padding: 14px 16px; font-weight: 800; font-size: 15px; color: #059669; font-family: monospace;">${booking.price} CAD</td>
      </tr>
    </table>

    <!-- Next Steps List -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
      <tr>
        <td style="font-size: 14px; font-weight: 700; color: #111418; padding-bottom: 14px;">Next steps for your appointment:</td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">1</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Vehicle Access:</strong> Please ensure keys are accessible and the car is parked with 3-4 feet of clearance.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">2</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Zero Hassle:</strong> Our mobile van carries spot-free pure water, gentle power, and eco-safe detailing chemicals.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 4px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">3</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Track Progress:</strong> View live booking status, track the arrival time, or adjust details directly in the app.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${renderActionButton("View Booking in App", `${LOGIN_URL}?open=booking&id=${encodeURIComponent(booking.bookingId)}`)}
  `);
};

/**
 * 2. Product Store Order Confirmation Email Template
 */
export const orderConfirmationEmailTemplate = (order: {
  orderId: string;
  customerName: string;
  items: Array<{ title: string; quantity: number; price: string }>;
  grandTotal: string;
  shippingAddress: string;
}) => {
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #111418; font-weight: 600;">
        ${item.title} <span style="color: #6b7280; font-size: 12px; font-weight: 400;">&times; ${item.quantity}</span>
      </td>
      <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-weight: 700; color: #111418;">
        ${item.price}
      </td>
    </tr>
  `).join('');

  return renderEmailWrapper(`
    <!-- Headline & Greeting -->
    <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #111418; line-height: 1.3; letter-spacing: -0.3px;">
      Order confirmed, ${order.customerName}! 📦
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
      Thank you for purchasing official Bentley car care supplies. We are preparing your order for fast dispatch.
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 24px; font-size: 13px;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Order Reference</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-family: monospace; color: #111418;">${order.orderId}</td>
      </tr>
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Shipping Address</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${order.shippingAddress}</td>
      </tr>
      <tr>
        <td style="padding: 14px 16px; font-weight: 700; color: #111418;">Total Paid</td>
        <td align="right" style="padding: 14px 16px; font-weight: 800; font-size: 15px; color: #059669; font-family: monospace;">$${order.grandTotal} CAD</td>
      </tr>
    </table>

    <!-- Next Steps List -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
      <tr>
        <td style="font-size: 14px; font-weight: 700; color: #111418; padding-bottom: 14px;">Next steps for your delivery:</td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">1</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Packing &amp; Inspection:</strong> Your car care products are carefully packaged to prevent any leaks or transit damage.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">2</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Courier Dispatch:</strong> As soon as the courier scans your package, tracking updates will be accessible.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 4px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">3</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Track in App:</strong> Monitor order milestones, reorder essentials, and view invoices in your app account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${renderActionButton("Track Your Order", `${LOGIN_URL}?open=order&id=${encodeURIComponent(order.orderId)}`)}
  `);
};

/**
 * 3. Password Reset Email Template
 */
export const passwordResetEmailTemplate = (userName: string, resetUrl: string) => {
  return renderEmailWrapper(`
    <!-- Headline & Greeting -->
    <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #111418; line-height: 1.3; letter-spacing: -0.3px;">
      Reset your password 🔐
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
      Hello <strong>${userName}</strong>,<br/>
      We received a request to reset the password for your Bentley Mobile Car Wash account. Click the button below to choose a new password.
    </p>

    ${renderActionButton("Reset Password", resetUrl)}

    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #9ca3af; line-height: 1.5; text-align: center;">
      If you did not request a password reset, you can safely disregard this email. Your account remains completely secure.
    </div>
  `);
};

/**
 * 4. Car Wash Completed Successfully Email Template
 */
export const bookingCompletedEmailTemplate = (booking: {
  bookingId: string;
  customerName: string;
  serviceTitle: string;
  vehicle: string;
  date: string;
  price: string;
  technicianName?: string;
  invoiceNumber?: string;
}) => {
  return renderEmailWrapper(`
    <!-- Headline & Greeting -->
    <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #111418; line-height: 1.3; letter-spacing: -0.3px;">
      Your car wash is complete, ${booking.customerName}!
      
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
      Our detailing specialist has completed servicing your vehicle. We hope you enjoy that showroom finish and fresh interior feel!
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 24px; font-size: 13px;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Booking Reference</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-family: monospace; color: #111418;">${booking.bookingId}</td>
      </tr>
      ${booking.invoiceNumber ? `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Official Invoice #</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111418;">${booking.invoiceNumber}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Service Package</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111418;">${booking.serviceTitle}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Vehicle Detailed</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${booking.vehicle}</td>
      </tr>
      ${booking.technicianName ? `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Completed By</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111418;">${booking.technicianName}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 14px 16px; font-weight: 700; color: #111418;">Total Paid</td>
        <td align="right" style="padding: 14px 16px; font-weight: 800; font-size: 15px; color: #059669; font-family: monospace;">${booking.price} CAD</td>
      </tr>
    </table>

    <!-- Next Steps List -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
      <tr>
        <td style="font-size: 14px; font-weight: 700; color: #111418; padding-bottom: 14px;">Next steps &amp; feedback:</td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">1</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Inspect Your Vehicle:</strong> Check out the deep-cleaned rims, spot-free exterior glass, and refreshed interior.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">2</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Leave a Review:</strong> Rate your technician and tell us how we did — your feedback keeps our standard high.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 4px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">3</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Download Invoice:</strong> Your PDF receipt and service breakdown are stored securely in your Bentley app profile.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${renderActionButton("View Booking & Rate Service", `${LOGIN_URL}?open=booking&id=${encodeURIComponent(booking.bookingId)}`)}
  `);
};

/**
 * 5. Product Store Order Delivered Email Template
 */
export const orderDeliveredEmailTemplate = (order: {
  orderId: string;
  customerName: string;
  items: Array<{ title: string; quantity: number; price: string }>;
  grandTotal: string;
  shippingAddress: string;
}) => {
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #111418; font-weight: 600;">
        ${item.title} <span style="color: #6b7280; font-size: 12px; font-weight: 400;">&times; ${item.quantity}</span>
      </td>
      <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-weight: 700; color: #111418;">
        ${item.price}
      </td>
    </tr>
  `).join('');

  return renderEmailWrapper(`
    <!-- Headline & Greeting -->
    <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #111418; line-height: 1.3; letter-spacing: -0.3px;">
      Your order has arrived, ${order.customerName}! 🎉
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
      Your package of premium Bentley car care products has been delivered to your destination.
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 24px; font-size: 13px;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Order Reference</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-family: monospace; color: #111418;">${order.orderId}</td>
      </tr>
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Delivered To</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${order.shippingAddress}</td>
      </tr>
      <tr>
        <td style="padding: 14px 16px; font-weight: 700; color: #111418;">Total Amount</td>
        <td align="right" style="padding: 14px 16px; font-weight: 800; font-size: 15px; color: #059669; font-family: monospace;">$${order.grandTotal} CAD</td>
      </tr>
    </table>

    <!-- Next Steps List -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
      <tr>
        <td style="font-size: 14px; font-weight: 700; color: #111418; padding-bottom: 14px;">Next steps with your supplies:</td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">1</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Check Package:</strong> Unbox your items and inspect the bottles and microfiber towels.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">2</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Application Guide:</strong> Check the instructions on each bottle for recommended dilution and application techniques.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 4px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 28px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px; border: 1px solid #fee2e2;">3</div>
              </td>
              <td valign="top" style="padding-left: 10px; font-size: 13px; line-height: 1.5; color: #4b5563;">
                <strong style="color: #111418;">Easy Reorder:</strong> Running low on spray or shampoo? Reorder anytime with one tap from the Bentley app.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${renderActionButton("Open App & View Orders", `${LOGIN_URL}?open=order&id=${encodeURIComponent(order.orderId)}`)}
  `);
};
