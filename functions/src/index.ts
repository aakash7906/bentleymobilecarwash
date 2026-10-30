import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { dispatchSendGridEmail } from "./services/sendgrid";
import * as templates from "./services/emailTemplates";

if (!admin.apps.length) {
  admin.initializeApp();
}

// ============================================================================
// TRANSACTIONAL EMAILS FOR CAR WASH
// ============================================================================

/**
 * Callable Function: sendContactEmail
 */
export const sendContactEmail = functions.https.onCall(async (data: any) => {
  const { name, email, subject, message } = data || {};

  if (!name || !email || !message) {
    throw new functions.https.HttpsError("invalid-argument", "Name, email, and message are required.");
  }

  const adminEmail = process.env.SENDGRID_ADMIN_EMAIL || "concierge@bentleycarwash.com";
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">New Concierge Inquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #D4AF37; padding: 12px 16px; margin-top: 16px; border-radius: 4px;">
        <p style="white-space: pre-wrap; margin: 0; font-size: 14px;">${message}</p>
      </div>
    </div>
  `;

  try {
    await dispatchSendGridEmail({
      to: adminEmail,
      subject: `[Bentley Concierge] ${subject || "Inquiry from " + name}`,
      html: htmlBody,
      replyTo: email,
    });

    await dispatchSendGridEmail({
      to: email,
      subject: `We received your inquiry - Bentley Mobile Car Wash`,
      text: `Hi ${name},\n\nThank you for contacting Bentley Mobile Car Wash! We have received your message and our concierge team will get back to you shortly.\n\nWarm regards,\nBentley Concierge Team`,
    });

    return { success: true, message: "Contact message sent successfully." };
  } catch (error: any) {
    console.error("Error sending contact email:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to send contact email.");
  }
});

/**
 * Callable Function: sendBookingConfirmationEmail
 */
export const sendBookingConfirmationEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, booking } = data || {};
  if (!recipientEmail || !booking || !booking.bookingId) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail and booking object are required.");
  }

  const html = templates.bookingConfirmationEmailTemplate(booking);
  return await dispatchSendGridEmail({
    to: recipientEmail,
    subject: `Booking Confirmed: Bentley Mobile Detailing (#${booking.bookingId}) 🚗✨`,
    html,
  });
});

/**
 * Callable Function: sendOrderNotificationEmail
 */
export const sendOrderNotificationEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, order } = data || {};
  if (!recipientEmail || !order || !order.orderId) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail and order are required.");
  }

  const html = templates.orderConfirmationEmailTemplate(order);
  return await dispatchSendGridEmail({
    to: recipientEmail,
    subject: `Order Confirmation: Bentley Detailing Products (#${order.orderId}) 🛍️`,
    html,
  });
});

/**
 * Callable Function: sendCustomPasswordResetEmail
 */
export const sendCustomPasswordResetEmail = functions.https.onCall(async (data: any) => {
  const { email, continueUrl } = data || {};
  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required.");
  }

  try {
    const targetUrl = continueUrl || `${process.env.APP_URL || "http://localhost:5173"}/reset-password`;
    const actionCodeSettings = {
      url: targetUrl,
      handleCodeInApp: true,
    };

    const link = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
    const urlObj = new URL(link);
    const oobCode = urlObj.searchParams.get("oobCode");
    const directResetUrl = `${targetUrl}?oobCode=${oobCode}`;

    let userName = "Member";
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      if (userRecord.displayName) {
        userName = userRecord.displayName;
      }
    } catch {
      // ignore
    }

    const html = templates.passwordResetEmailTemplate(userName, directResetUrl);
    await dispatchSendGridEmail({
      to: email,
      subject: `Reset Your Bentley Mobile Car Wash Password 🔐`,
      html,
    });

    return { success: true, message: "Password reset email dispatched successfully." };
  } catch (error: any) {
    console.error("Error sending custom password reset email:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to send password reset email.");
  }
});
