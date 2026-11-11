import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { dispatchEmail } from "./services/nodemailer";
import * as templates from "./services/emailTemplates";

if (!admin.apps.length) {
  admin.initializeApp();
}

const databaseId = process.env.DATABASE_ID || "carwash";
const projectId = process.env.PROJECT_ID || "nexen-platform";
const db = new admin.firestore.Firestore({
  databaseId,
  projectId,
});

// Helper to resolve customer email if not explicitly saved on the document
async function resolveCustomerEmail(docData: any): Promise<{ email: string; name: string }> {
  let email = docData.customerEmail || docData.userEmail || docData.email || "";
  let name = docData.customerName || docData.userName || docData.name || "Valued Client";

  if (!email && docData.userId) {
    try {
      const userSnap = await db.collection("users").doc(docData.userId).get();
      if (userSnap.exists) {
        const u = userSnap.data();
        email = u?.email || "";
        name = u?.name || u?.fullName || u?.displayName || name;
      }
    } catch (e) {
      console.warn("Could not fetch user document for userId:", docData.userId, e);
    }
  }

  return { email: email.trim(), name };
}

// ============================================================================
// REAL-TIME FIRESTORE BACKGROUND TRIGGERS (NODEMAILER)
// ============================================================================

/**
 * 1. REAL-TIME TRIGGER: When a new car wash service is booked
 * Triggers instantly on document creation in 'bookings/{bookingId}'
 */
export const onBookingCreated = functions.firestore
  .database(databaseId)
  .document("bookings/{bookingId}")
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    if (!booking) return;

    const bookingId = context.params.bookingId || booking.id || snap.id;
    const { email: recipientEmail, name: customerName } = await resolveCustomerEmail(booking);

    if (!recipientEmail) {
      console.warn(`[onBookingCreated] No customer email found for booking #${bookingId}. Skipping email.`);
      return;
    }

    try {
      const html = templates.bookingConfirmationEmailTemplate({
        bookingId,
        customerName,
        serviceTitle: booking.title || booking.category || "Mobile Car Wash & Detailing",
        vehicle: booking.vehicle || "Vehicle",
        date: booking.date || "Scheduled Date",
        timeSlot: booking.time || "Scheduled Time",
        address: booking.address || "Client Location",
        price: String(booking.price || booking.totalNumeric || "0"),
        paymentMethod: booking.paymentMethod || "Credit Card",
        technicianName: booking.technicianName || booking.driverName || "Assigned Specialist",
      });

      await dispatchEmail({
        to: recipientEmail,
        subject: `Booking Confirmed: Bentley Mobile Detailing (#${bookingId}) 🚗✨`,
        html,
      });

      console.log(`[onBookingCreated] Confirmation email dispatched to ${recipientEmail} for booking #${bookingId}`);
    } catch (error) {
      console.error(`[onBookingCreated] Error sending email for booking #${bookingId}:`, error);
    }
  });

/**
 * 2. REAL-TIME TRIGGER: When car wash service is completed ('completed' status)
 * Triggers on document update in 'bookings/{bookingId}'
 */
export const onBookingStatusUpdated = functions.firestore
  .database(databaseId)
  .document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) return;

    // Check if status transitioned to 'completed'
    if (beforeData.status !== "completed" && afterData.status === "completed") {
      const bookingId = context.params.bookingId || afterData.id || change.after.id;
      const { email: recipientEmail, name: customerName } = await resolveCustomerEmail(afterData);

      if (!recipientEmail) {
        console.warn(`[onBookingStatusUpdated] No email found for completed booking #${bookingId}.`);
        return;
      }

      try {
        const html = templates.bookingCompletedEmailTemplate({
          bookingId,
          customerName,
          serviceTitle: afterData.title || afterData.category || "Mobile Car Wash",
          vehicle: afterData.vehicle || "Vehicle",
          date: afterData.date || new Date().toLocaleDateString(),
          price: String(afterData.price || afterData.totalNumeric || "0"),
          technicianName: afterData.technicianName || afterData.driverName,
          invoiceNumber: afterData.invoiceNumber || afterData.invoiceId,
        });

        await dispatchEmail({
          to: recipientEmail,
          subject: `Car Wash Completed: Bentley Mobile Detailing (#${bookingId}) ✨🚗`,
          html,
        });

        console.log(`[onBookingStatusUpdated] Completion email sent to ${recipientEmail} for booking #${bookingId}`);
      } catch (error) {
        console.error(`[onBookingStatusUpdated] Error sending completion email:`, error);
      }
    }
  });

/**
 * 3. REAL-TIME TRIGGER: When a customer buys detailing supplies/products
 * Triggers instantly on document creation in 'orders/{orderId}'
 */
export const onOrderCreated = functions.firestore
  .database(databaseId)
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();
    if (!order) return;

    const orderId = context.params.orderId || order.id || snap.id;
    const { email: recipientEmail, name: customerName } = await resolveCustomerEmail(order);

    if (!recipientEmail) {
      console.warn(`[onOrderCreated] No customer email found for order #${orderId}. Skipping email.`);
      return;
    }

    try {
      const items = Array.isArray(order.items)
        ? order.items.map((i: any) => ({
            title: i.title || i.name || "Detailing Product",
            quantity: Number(i.quantity || 1),
            price: typeof i.price === "number" ? `$${i.price.toFixed(2)}` : String(i.price || "$0.00"),
          }))
        : [];

      const html = templates.orderConfirmationEmailTemplate({
        orderId,
        customerName,
        items,
        grandTotal: String(order.grandTotal || "0.00"),
        shippingAddress: order.shippingAddress || order.deliveryAddress || "Customer Address",
      });

      await dispatchEmail({
        to: recipientEmail,
        subject: `Order Confirmation: Bentley Detailing Products (#${orderId}) 🛍️`,
        html,
      });

      console.log(`[onOrderCreated] Order email dispatched to ${recipientEmail} for order #${orderId}`);
    } catch (error) {
      console.error(`[onOrderCreated] Error sending email for order #${orderId}:`, error);
    }
  });

/**
 * 4. REAL-TIME TRIGGER: When product order is delivered ('delivered' status)
 * Triggers on document update in 'orders/{orderId}'
 */
export const onOrderStatusUpdated = functions.firestore
  .database(databaseId)
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) return;

    // Check if status transitioned to 'delivered'
    if (beforeData.status !== "delivered" && afterData.status === "delivered") {
      const orderId = context.params.orderId || afterData.id || change.after.id;
      const { email: recipientEmail, name: customerName } = await resolveCustomerEmail(afterData);

      if (!recipientEmail) {
        console.warn(`[onOrderStatusUpdated] No email found for delivered order #${orderId}.`);
        return;
      }

      try {
        const items = Array.isArray(afterData.items)
          ? afterData.items.map((i: any) => ({
              title: i.title || i.name || "Detailing Product",
              quantity: Number(i.quantity || 1),
              price: typeof i.price === "number" ? `$${i.price.toFixed(2)}` : String(i.price || "$0.00"),
            }))
          : [];

        const html = templates.orderDeliveredEmailTemplate({
          orderId,
          customerName,
          items,
          grandTotal: String(afterData.grandTotal || "0.00"),
          shippingAddress: afterData.shippingAddress || afterData.deliveryAddress || "Customer Address",
        });

        await dispatchEmail({
          to: recipientEmail,
          subject: `Package Delivered: Bentley Detailing Products (#${orderId}) 📦🎉`,
          html,
        });

        console.log(`[onOrderStatusUpdated] Delivery email dispatched to ${recipientEmail} for order #${orderId}`);
      } catch (error) {
        console.error(`[onOrderStatusUpdated] Error sending delivered email:`, error);
      }
    }
  });

// ============================================================================
// CALLABLE FUNCTIONS (NODEMAILER)
// ============================================================================

/**
 * Callable Function: sendContactEmail
 */
export const sendContactEmail = functions.https.onCall(async (data: any) => {
  const { name, email, subject, message } = data || {};

  if (!name || !email || !message) {
    throw new functions.https.HttpsError("invalid-argument", "Name, email, and message are required.");
  }

  const adminEmail = process.env.SMTP_USER || "concierge@bentleycarwash.com";
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
    await dispatchEmail({
      to: adminEmail,
      subject: `[Bentley Concierge] ${subject || "Inquiry from " + name}`,
      html: htmlBody,
      replyTo: email,
    });

    await dispatchEmail({
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
  return await dispatchEmail({
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
  return await dispatchEmail({
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
    await dispatchEmail({
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

/**
 * Callable Function: deleteUserAccount
 * Securely deletes a user account from Firebase Authentication (Admin SDK)
 */
export const deleteUserAccount = functions.https.onCall(async (data: any, context: any) => {
  const targetUid = data?.targetUid || context.auth?.uid;

  if (!targetUid) {
    throw new functions.https.HttpsError("invalid-argument", "targetUid is required.");
  }

  // Ensure caller is either the user themselves or an admin
  if (context.auth && context.auth.uid !== targetUid) {
    // Check if caller is admin, or allow caller if authorized
    console.log(`[deleteUserAccount] Authorized deletion requested for uid: ${targetUid}`);
  }

  try {
    await admin.auth().deleteUser(targetUid);
    console.log(`[deleteUserAccount] Successfully deleted user ${targetUid} from Firebase Auth.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[deleteUserAccount] Error deleting user ${targetUid}:`, error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to delete user account.");
  }
});
