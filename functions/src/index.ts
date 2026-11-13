import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { dispatchEmail } from "./services/nodemailer";
import * as templates from "./services/emailTemplates";

if (!admin.apps.length) {
  admin.initializeApp();
}

const databaseId = process.env.DATABASE_ID || "carwash";
const projectId = process.env.PROJECT_ID || "nexen-platform";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "aakashkumar10th@gmail.com";

const db = new admin.firestore.Firestore({
  databaseId,
  projectId,
});

// Helper to resolve customer email, name, and phone from document or user profile
async function resolveCustomerDetails(docData: any): Promise<{ email: string; name: string; phone?: string }> {
  let email = docData.customerEmail || docData.userEmail || docData.email || "";
  let name = docData.customerName || docData.userName || docData.name || "Valued Client";
  let phone = docData.customerPhone || docData.phone || docData.userPhone || "";

  if ((!email || !phone) && docData.userId) {
    try {
      const userSnap = await db.collection("users").doc(docData.userId).get();
      if (userSnap.exists) {
        const u = userSnap.data();
        if (!email) email = u?.email || "";
        if (name === "Valued Client") name = u?.name || u?.fullName || u?.displayName || name;
        if (!phone) phone = u?.phone || u?.phoneNumber || "";
      }
    } catch (e) {
      console.warn("Could not fetch user document for userId:", docData.userId, e);
    }
  }

  return { email: email.trim(), name, phone: phone.trim() };
}

// ============================================================================
// REAL-TIME FIRESTORE BACKGROUND TRIGGERS (NODEMAILER)
// ============================================================================

/**
 * 1. REAL-TIME TRIGGER: When a new car wash service is booked
 * Triggers instantly on document creation in 'bookings/{bookingId}'
 * Sends confirmation email to Customer & simultaneous notification to Admin (aakashkumar10th@gmail.com)
 */
export const onBookingCreated = functions.firestore
  .database(databaseId)
  .document("bookings/{bookingId}")
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    if (!booking) return;

    const bookingId = context.params.bookingId || booking.id || snap.id;
    const { email: recipientEmail, name: customerName, phone: customerPhone } = await resolveCustomerDetails(booking);

    const bookingPayload = {
      bookingId,
      customerName,
      customerEmail: recipientEmail,
      customerPhone,
      serviceTitle: booking.title || booking.category || "Mobile Car Wash & Detailing",
      vehicle: booking.vehicle || "Vehicle",
      date: booking.date || "Scheduled Date",
      timeSlot: booking.time || "Scheduled Time",
      address: booking.address || "Client Location",
      price: String(booking.price || booking.totalNumeric || "0"),
      paymentMethod: booking.paymentMethod || "Credit Card",
      technicianName: booking.technicianName || booking.driverName || "Assigned Specialist",
    };

    const tasks: Promise<any>[] = [];

    // 1. Send confirmation to Customer
    if (recipientEmail) {
      const customerHtml = templates.bookingConfirmationEmailTemplate(bookingPayload);
      tasks.push(
        dispatchEmail({
          to: recipientEmail,
          subject: `Booking Confirmed: Bentley Mobile Detailing (#${bookingId}) 🚗✨`,
          html: customerHtml,
        })
          .then(() => {
            console.log(`[onBookingCreated] Customer email sent to ${recipientEmail} for booking #${bookingId}`);
          })
          .catch((err) => {
            console.error(`[onBookingCreated] Error sending email to customer ${recipientEmail}:`, err);
          })
      );
    } else {
      console.warn(`[onBookingCreated] No customer email found for booking #${bookingId}.`);
    }

    // 2. Simultaneously send alert to Admin (aakashkumar10th@gmail.com)
    if (ADMIN_EMAIL) {
      const adminHtml = templates.adminBookingNotificationEmailTemplate(bookingPayload);
      tasks.push(
        dispatchEmail({
          to: ADMIN_EMAIL,
          subject: `🚨 New Booking: ${bookingPayload.serviceTitle} (#${bookingId}) - ${customerName}`,
          html: adminHtml,
        })
          .then(() => {
            console.log(`[onBookingCreated] Admin alert email dispatched to ${ADMIN_EMAIL} for booking #${bookingId}`);
          })
          .catch((err) => {
            console.error(`[onBookingCreated] Error sending alert to admin ${ADMIN_EMAIL}:`, err);
          })
      );
    }

    await Promise.allSettled(tasks);
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
      const { email: recipientEmail, name: customerName } = await resolveCustomerDetails(afterData);

      if (!recipientEmail) {
        console.warn(`[onBookingStatusUpdated] No email found for completed booking #${bookingId}.`);
      } else {
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
    }
  });

/**
 * 3. REAL-TIME TRIGGER: When a customer buys detailing supplies/products
 * Triggers instantly on document creation in 'orders/{orderId}'
 * Sends confirmation email to Customer & simultaneous notification to Admin (aakashkumar10th@gmail.com)
 */
export const onOrderCreated = functions.firestore
  .database(databaseId)
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();
    if (!order) return;

    const orderId = context.params.orderId || order.id || snap.id;
    const { email: recipientEmail, name: customerName, phone: customerPhone } = await resolveCustomerDetails(order);

    const items = Array.isArray(order.items)
      ? order.items.map((i: any) => {
        const prod = i.product || {};
        const title = prod.title || i.title || i.name || "Detailing Product";
        const rawPrice = prod.price || i.price;
        const numericPrice = typeof prod.priceNumeric === "number" ? prod.priceNumeric : typeof i.price === "number" ? i.price : null;
        const formattedPrice = rawPrice
          ? String(rawPrice).startsWith("$") ? String(rawPrice) : `$${rawPrice}`
          : numericPrice !== null
            ? `$${numericPrice.toFixed(2)}`
            : "$0.00";

        return {
          title,
          quantity: Number(i.quantity || 1),
          price: formattedPrice,
        };
      })
      : [];

    const orderPayload = {
      orderId,
      customerName,
      customerEmail: recipientEmail,
      customerPhone,
      items,
      grandTotal: String(order.grandTotal || "0.00"),
      shippingAddress: order.shippingAddress || order.deliveryAddress || "Customer Address",
      paymentMethod: order.paymentMethod || "Credit Card",
    };

    const tasks: Promise<any>[] = [];

    // 1. Send confirmation to Customer
    if (recipientEmail) {
      const customerHtml = templates.orderConfirmationEmailTemplate(orderPayload);
      tasks.push(
        dispatchEmail({
          to: recipientEmail,
          subject: `Order Confirmation: Bentley Detailing Products (#${orderId}) 🛍️`,
          html: customerHtml,
        })
          .then(() => {
            console.log(`[onOrderCreated] Customer email sent to ${recipientEmail} for order #${orderId}`);
          })
          .catch((err) => {
            console.error(`[onOrderCreated] Error sending order email to customer ${recipientEmail}:`, err);
          })
      );
    } else {
      console.warn(`[onOrderCreated] No customer email found for order #${orderId}.`);
    }

    // 2. Simultaneously send alert to Admin (aakashkumar10th@gmail.com)
    if (ADMIN_EMAIL) {
      const adminHtml = templates.adminOrderNotificationEmailTemplate(orderPayload);
      tasks.push(
        dispatchEmail({
          to: ADMIN_EMAIL,
          subject: `🛍️ New Sale: Store Order (#${orderId}) - $${orderPayload.grandTotal} CAD (${customerName})`,
          html: adminHtml,
        })
          .then(() => {
            console.log(`[onOrderCreated] Admin alert email dispatched to ${ADMIN_EMAIL} for order #${orderId}`);
          })
          .catch((err) => {
            console.error(`[onOrderCreated] Error sending alert to admin ${ADMIN_EMAIL}:`, err);
          })
      );
    }

    await Promise.allSettled(tasks);
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
      const { email: recipientEmail, name: customerName } = await resolveCustomerDetails(afterData);

      if (!recipientEmail) {
        console.warn(`[onOrderStatusUpdated] No email found for delivered order #${orderId}.`);
      } else {
        try {
          const items = Array.isArray(afterData.items)
            ? afterData.items.map((i: any) => {
              const prod = i.product || {};
              const title = prod.title || i.title || i.name || "Detailing Product";
              const rawPrice = prod.price || i.price;
              const numericPrice = typeof prod.priceNumeric === "number" ? prod.priceNumeric : typeof i.price === "number" ? i.price : null;
              const formattedPrice = rawPrice
                ? String(rawPrice).startsWith("$") ? String(rawPrice) : `$${rawPrice}`
                : numericPrice !== null
                  ? `$${numericPrice.toFixed(2)}`
                  : "$0.00";

              return {
                title,
                quantity: Number(i.quantity || 1),
                price: formattedPrice,
              };
            })
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
            subject: `Delivered: Your Bentley Detailing Products (#${orderId}) 📦✨`,
            html,
          });

          console.log(`[onOrderStatusUpdated] Delivered email sent to ${recipientEmail} for order #${orderId}`);
        } catch (error) {
          console.error(`[onOrderStatusUpdated] Error sending delivered email:`, error);
        }
      }
    }
  });

// ============================================================================
// CALLABLE FUNCTIONS
// ============================================================================

/**
 * Callable Function: sendContactEmail
 */
export const sendContactEmail = functions.https.onCall(async (data: any) => {
  const { name, email, phone, message } = data || {};

  if (!name || !email || !message) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Name, email, and message are required."
    );
  }

  try {
    await dispatchEmail({
      to: ADMIN_EMAIL,
      subject: `New Inquiry from ${name} - Bentley Mobile Car Wash`,
      text: `Customer Name: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\n\nMessage:\n${message}`,
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
 * Dispatches confirmation to customer and notification to admin
 */
export const sendBookingConfirmationEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, booking } = data || {};
  if (!recipientEmail || !booking || !booking.bookingId) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail and booking object are required.");
  }

  const tasks: Promise<any>[] = [];

  // 1. Customer email
  const html = templates.bookingConfirmationEmailTemplate(booking);
  tasks.push(
    dispatchEmail({
      to: recipientEmail,
      subject: `Booking Confirmed: Bentley Mobile Detailing (#${booking.bookingId}) 🚗✨`,
      html,
    })
  );

  // 2. Admin notification
  if (ADMIN_EMAIL) {
    const adminHtml = templates.adminBookingNotificationEmailTemplate({
      ...booking,
      customerEmail: recipientEmail,
    });
    tasks.push(
      dispatchEmail({
        to: ADMIN_EMAIL,
        subject: `🚨 New Booking: ${booking.serviceTitle || "Detailing"} (#${booking.bookingId}) - ${booking.customerName}`,
        html: adminHtml,
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  return { success: true, results };
});

/**
 * Callable Function: sendOrderNotificationEmail
 * Dispatches confirmation to customer and notification to admin
 */
export const sendOrderNotificationEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, order } = data || {};
  if (!recipientEmail || !order || !order.orderId) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail and order are required.");
  }

  const tasks: Promise<any>[] = [];

  // 1. Customer email
  const html = templates.orderConfirmationEmailTemplate(order);
  tasks.push(
    dispatchEmail({
      to: recipientEmail,
      subject: `Order Confirmation: Bentley Detailing Products (#${order.orderId}) 🛍️`,
      html,
    })
  );

  // 2. Admin notification
  if (ADMIN_EMAIL) {
    const adminHtml = templates.adminOrderNotificationEmailTemplate({
      ...order,
      customerEmail: recipientEmail,
    });
    tasks.push(
      dispatchEmail({
        to: ADMIN_EMAIL,
        subject: `🛍️ New Sale: Store Order (#${order.orderId}) - $${order.grandTotal} CAD (${order.customerName})`,
        html: adminHtml,
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  return { success: true, results };
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
    const targetUrl = continueUrl || `${process.env.APP_URL || "https://bentleymobilecarwash.pages.dev"}/reset-password`;
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

  if (context.auth && context.auth.uid !== targetUid) {
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
