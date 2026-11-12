/**
 * Bentley Mobile Car Wash & Detailing - HTML Email Templates
 * Minimalist, modern email templates for Customers and Admin.
 * Design tokens: Primary Red (#dc2626), Dark (#111418), Border (#e5e7eb), Background (#f8fafc).
 */

const LOGIN_URL = process.env.APP_URL || "https://bentleymobilecarwash.pages.dev";
const SUPPORT_EMAIL = process.env.SMTP_USER || "bentleymobilecarwash@gmail.com";

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
                  Questions? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #dc2626; font-weight: 600; text-decoration: none;">${SUPPORT_EMAIL}</a>
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
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 8px 0;">
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

/* =========================================================================
   CUSTOMER EMAIL TEMPLATES
   ========================================================================= */

/**
 * 1. Customer Booking Confirmation Email Template
 * Clean summary with complete booking details (without next steps).
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
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 8px; font-size: 13px;">
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
      ${booking.paymentMethod ? `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Payment Method</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${booking.paymentMethod}</td>
      </tr>` : ''}
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

    ${renderActionButton("View Booking in App", `${LOGIN_URL}?open=booking&id=${encodeURIComponent(booking.bookingId)}`)}
  `);
};

/**
 * 2. Customer Product Store Order Confirmation Email Template
 * Clean summary with complete order & items details (without delivery steps).
 */
export const orderConfirmationEmailTemplate = (order: {
  orderId: string;
  customerName: string;
  items: Array<{ title: string; quantity: number; price: string }>;
  grandTotal: string;
  shippingAddress: string;
  paymentMethod?: string;
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
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 8px; font-size: 13px;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Order Reference</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-family: monospace; color: #111418;">${order.orderId}</td>
      </tr>
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Shipping Address</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${order.shippingAddress}</td>
      </tr>
      ${order.paymentMethod ? `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Payment Method</td>
        <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${order.paymentMethod}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 14px 16px; font-weight: 700; color: #111418;">Total Paid</td>
        <td align="right" style="padding: 14px 16px; font-weight: 800; font-size: 15px; color: #059669; font-family: monospace;">$${order.grandTotal} CAD</td>
      </tr>
    </table>

    ${renderActionButton("Track Your Order", `${LOGIN_URL}?open=order&id=${encodeURIComponent(order.orderId)}`)}
  `);
};

/**
 * 3. Customer Password Reset Email Template
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
 * 4. Customer Car Wash Completed Successfully Email Template
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
      Your car wash is complete, ${booking.customerName}! ✨
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
      Our detailing specialist has completed servicing your vehicle. We hope you enjoy that showroom finish and fresh interior feel!
    </p>

    <!-- Details Card -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 8px; font-size: 13px;">
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

    ${renderActionButton("View Booking & Rate Service", `${LOGIN_URL}?open=booking&id=${encodeURIComponent(booking.bookingId)}`)}
  `);
};

/**
 * 5. Customer Product Store Order Delivered Email Template
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
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 8px; font-size: 13px;">
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

    ${renderActionButton("Open App & View Orders", `${LOGIN_URL}?open=order&id=${encodeURIComponent(order.orderId)}`)}
  `);
};

/* =========================================================================
   ADMIN EMAIL TEMPLATES (Bentley Car Wash Admin / Owner)
   ========================================================================= */

/**
 * 6. Admin Booking Notification Email Template
 * Sent to bentleymobilecarwash@gmail.com whenever a customer places a new booking.
 */
export const adminBookingNotificationEmailTemplate = (booking: {
  bookingId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceTitle: string;
  vehicle: string;
  date: string;
  timeSlot: string;
  address: string;
  price: string;
  paymentMethod?: string;
}) => {
  return renderEmailWrapper(`
    <!-- Status Badge -->
    <div style="margin-bottom: 12px;">
      <span style="display: inline-block; background-color: #fef2f2; color: #dc2626; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #fee2e2;">
        🚨 New Booking Alert
      </span>
    </div>

    <!-- Headline -->
    <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #111418; line-height: 1.3; letter-spacing: -0.3px;">
      New Appointment Scheduled! 🚗
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
      A customer has just booked a detailing service. Please review the appointment details below and dispatch a technician.
    </p>

    <!-- Customer Information Block -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 16px; font-size: 13px;">
      <tr>
        <td colspan="2" style="padding: 10px 16px; background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-top-left-radius: 13px; border-top-right-radius: 13px;">
          Customer Contact
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Client Name</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111418;">${booking.customerName}</td>
      </tr>
      ${booking.customerEmail ? `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Email Address</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">
          <a href="mailto:${booking.customerEmail}" style="color: #dc2626; text-decoration: underline;">${booking.customerEmail}</a>
        </td>
      </tr>` : ''}
      ${booking.customerPhone ? `
      <tr>
        <td style="padding: 10px 16px; color: #6b7280; font-weight: 500;">Phone Number</td>
        <td align="right" style="padding: 10px 16px; font-weight: 600; color: #111418;">
          <a href="tel:${booking.customerPhone}" style="color: #111418; text-decoration: none;">${booking.customerPhone}</a>
        </td>
      </tr>` : ''}
    </table>

    <!-- Service & Appointment Details Block -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 8px; font-size: 13px;">
      <tr>
        <td colspan="2" style="padding: 10px 16px; background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-top-left-radius: 13px; border-top-right-radius: 13px;">
          Appointment Details
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Booking ID</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-family: monospace; color: #111418;">${booking.bookingId}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Service Package</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111418;">${booking.serviceTitle}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Vehicle</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${booking.vehicle}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Scheduled Slot</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${booking.date} at ${booking.timeSlot}</td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Dispatch Address</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${booking.address}</td>
      </tr>
      ${booking.paymentMethod ? `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Payment Method</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${booking.paymentMethod}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 12px 16px; font-weight: 700; color: #111418;">Total Amount</td>
        <td align="right" style="padding: 12px 16px; font-weight: 800; font-size: 15px; color: #059669; font-family: monospace;">${booking.price} CAD</td>
      </tr>
    </table>

    ${renderActionButton("Open Driver Dashboard", `${LOGIN_URL}?open=driver`)}
  `);
};

/**
 * 7. Admin Order Notification Email Template
 * Sent to bentleymobilecarwash@gmail.com whenever a customer places an order for detailing products.
 */
export const adminOrderNotificationEmailTemplate = (order: {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{ title: string; quantity: number; price: string }>;
  grandTotal: string;
  shippingAddress: string;
  paymentMethod?: string;
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
    <!-- Status Badge -->
    <div style="margin-bottom: 12px;">
      <span style="display: inline-block; background-color: #fef2f2; color: #dc2626; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #fee2e2;">
        🛍️ New Product Sale
      </span>
    </div>

    <!-- Headline -->
    <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #111418; line-height: 1.3; letter-spacing: -0.3px;">
      New Store Order Received! 📦
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
      A customer has placed an order for detailing products. Please prepare the items for packing and dispatch.
    </p>

    <!-- Customer Information Block -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 16px; font-size: 13px;">
      <tr>
        <td colspan="2" style="padding: 10px 16px; background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-top-left-radius: 13px; border-top-right-radius: 13px;">
          Customer Contact
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Client Name</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; color: #111418;">${order.customerName}</td>
      </tr>
      ${order.customerEmail ? `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Email Address</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">
          <a href="mailto:${order.customerEmail}" style="color: #dc2626; text-decoration: underline;">${order.customerEmail}</a>
        </td>
      </tr>` : ''}
      ${order.customerPhone ? `
      <tr>
        <td style="padding: 10px 16px; color: #6b7280; font-weight: 500;">Phone Number</td>
        <td align="right" style="padding: 10px 16px; font-weight: 600; color: #111418;">
          <a href="tel:${order.customerPhone}" style="color: #111418; text-decoration: none;">${order.customerPhone}</a>
        </td>
      </tr>` : ''}
    </table>

    <!-- Order Items & Shipping Block -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; margin-bottom: 8px; font-size: 13px;">
      <tr>
        <td colspan="2" style="padding: 10px 16px; background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; border-top-left-radius: 13px; border-top-right-radius: 13px;">
          Order Breakdown
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Order ID</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 700; font-family: monospace; color: #111418;">${order.orderId}</td>
      </tr>
      ${itemsHtml}
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Delivery Address</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${order.shippingAddress}</td>
      </tr>
      ${order.paymentMethod ? `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500;">Payment Method</td>
        <td align="right" style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111418;">${order.paymentMethod}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 12px 16px; font-weight: 700; color: #111418;">Total Revenue</td>
        <td align="right" style="padding: 12px 16px; font-weight: 800; font-size: 15px; color: #059669; font-family: monospace;">$${order.grandTotal} CAD</td>
      </tr>
    </table>

    ${renderActionButton("Manage Orders in Dashboard", `${LOGIN_URL}?open=driver`)}
  `);
};
