/**
 * Bentley Mobile Car Wash & Detailing - HTML Email Templates
 * Fully responsive, cross-client email templates matching Bentley luxury automotive styling.
 */

const LOGIN_URL = process.env.APP_URL || "http://localhost:5173";
const SUPPORT_EMAIL = process.env.SENDGRID_FROM_EMAIL || "concierge@bentleycarwash.com";
const PRIMARY_GOLD = "#D4AF37";

/**
 * Common HTML wrapper matching the clean modern Bentley luxury branding.
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
    }
    table, td {
      border-collapse: collapse !important;
    }
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .card-body {
        padding: 24px 18px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f8fafc;">
  <center style="width: 100%; background-color: #f8fafc;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
      <tr>
        <td align="center" style="padding: 20px 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
            <!-- Header -->
            <tr>
              <td align="center" style="background-color: #0f172a; padding: 28px 24px; border-bottom: 2px solid ${PRIMARY_GOLD};">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">BENTLEY MOBILE CAR WASH</h1>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: ${PRIMARY_GOLD}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Premium Eco-Friendly Detailing</p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td class="card-body" style="padding: 36px 32px; background-color: #ffffff;">
                ${contentHtml}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
                <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">Bentley Mobile Car Wash &amp; Auto Detailing</p>
                <p style="margin: 0 0 10px 0;">Kelowna &amp; Okanagan Valley, British Columbia, Canada</p>
                <p style="margin: 0; font-size: 11px;">
                  Need assistance? Contact our concierge at <a href="mailto:${SUPPORT_EMAIL}" style="color: #0f172a; font-weight: 700; text-decoration: underline;">${SUPPORT_EMAIL}</a>
                </p>
                <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8;">&copy; ${currentYear} Bentley Mobile Car Wash. All rights reserved.</p>
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

function renderActionButton(buttonText: string, actionUrl: string) {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 10px 0;">
      <tr>
        <td align="center">
          <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 9999px; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            ${buttonText} &rarr;
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
  stripePaymentId?: string;
  technicianName?: string;
}) => {
  return renderEmailWrapper(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #a7f3d0;">
        Appointment Confirmed &amp; Paid
      </span>
      <h2 style="margin: 14px 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Your Detail is Scheduled!</h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        Hello <strong>${booking.customerName}</strong>, our mobile detailing technician will arrive on time with a fully equipped mobile unit.
      </p>
    </div>

    <!-- Booking Details Card -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin: 20px 0; font-size: 13px;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Booking Reference</td>
        <td align="right" style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 800; font-family: monospace; color: #0f172a;">${booking.bookingId}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Service Package</td>
        <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${booking.serviceTitle}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Target Vehicle</td>
        <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${booking.vehicle}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Scheduled Time</td>
        <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${booking.date} at ${booking.timeSlot}</td>
      </tr>
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Location / Dispatch Address</td>
        <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${booking.address}</td>
      </tr>
      ${booking.technicianName ? `
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Assigned Technician</td>
        <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${booking.technicianName}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 14px 18px; font-weight: 800; color: #0f172a; font-size: 14px;">Total Paid</td>
        <td align="right" style="padding: 14px 18px; font-weight: 800; font-size: 16px; color: #059669; font-family: monospace;">${booking.price} CAD</td>
      </tr>
      ${booking.stripePaymentId ? `
      <tr>
        <td style="padding: 8px 18px 14px; font-size: 11px; color: #94a3b8;" colspan="2">
          Stripe Payment Authorization: <span style="font-family: monospace; color: #64748b;">${booking.stripePaymentId}</span>
        </td>
      </tr>` : ''}
    </table>

    <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; margin-top: 20px; font-size: 12px; color: #475569; line-height: 1.5;">
      <strong>What to expect next:</strong> Our technician brings 100% pure deionized spot-free water, whisper-quiet generators, and biodegradable pH-neutral chemicals. Please ensure vehicle keys are accessible.
    </div>

    ${renderActionButton("View Booking in App", LOGIN_URL)}
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
  stripePaymentId?: string;
}) => {
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding: 10px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">
        ${item.title} <span style="color: #64748b; font-size: 11px;">(Qty: ${item.quantity})</span>
      </td>
      <td align="right" style="padding: 10px 18px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; color: #0f172a;">
        ${item.price}
      </td>
    </tr>
  `).join('');

  return renderEmailWrapper(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #bfdbfe;">
        Order Placed Successfully
      </span>
      <h2 style="margin: 14px 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Bentley Detailing Products</h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        Thank you for ordering, <strong>${order.customerName}</strong>! Your official detailing supplies are being prepped.
      </p>
    </div>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin: 20px 0; font-size: 13px;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Order Number</td>
        <td align="right" style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 800; font-family: monospace; color: #0f172a;">${order.orderId}</td>
      </tr>
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Delivery Address</td>
        <td align="right" style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${order.shippingAddress}</td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; font-weight: 800; color: #0f172a; font-size: 14px;">Total Paid</td>
        <td align="right" style="padding: 14px 18px; font-weight: 800; font-size: 16px; color: #059669; font-family: monospace;">$${order.grandTotal} CAD</td>
      </tr>
    </table>

    ${renderActionButton("Track Your Order", LOGIN_URL)}
  `);
};

/**
 * 3. Password Reset Email Template
 */
export const passwordResetEmailTemplate = (userName: string, resetUrl: string) => {
  return renderEmailWrapper(`
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a;">Reset Your Password</h2>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
      Hello <strong>${userName}</strong>,<br/><br/>
      We received a request to reset the password for your Bentley Mobile Car Wash account. Click the button below to choose a new secure password.
    </p>

    ${renderActionButton("Reset Password", resetUrl)}

    <p style="margin: 20px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
      If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.
    </p>
  `);
};
