import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { dispatchSendGridEmail } from "./services/sendgrid";
import * as templates from "./services/emailTemplates";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Returns initialized Firestore database reference (supporting custom database ID if set)
 */
function getDb(): admin.firestore.Firestore {
  return admin.firestore();
}

/**
 * Lazy initializer for Stripe
 */
function getStripe(): Stripe | null {
  let stripeConfigSecret: string | null = null;
  try {
    stripeConfigSecret = functions.config()?.stripe?.secret || null;
  } catch (e) {
    // ignore
  }
  const stripeKey =
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET ||
    stripeConfigSecret ||
    "";

  if (!stripeKey || stripeKey === "sk_test_placeholder" || !stripeKey.startsWith("sk_")) {
    return null;
  }
  return new Stripe(stripeKey, {
    apiVersion: "2022-11-15" as any,
  });
}

/**
 * Helper to set standard permissive CORS headers for HTTP endpoints
 */
function handleCors(req: functions.https.Request, res: functions.Response<any>): boolean {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

// ============================================================================
// 1. BACKEND — CREATE CHECKOUT SESSION
// ============================================================================

/**
 * Core business logic for creating a car wash Stripe Checkout Session
 */
async function executeCreateCarwashCheckout(data: any, authUid?: string) {
  const {
    type = "booking", // 'booking' | 'shop_order'
    bookingId,
    orderId,
    serviceTitle = "Bentley Mobile Detailing Service",
    customerName = "Valued Customer",
    customerEmail = "",
    customerPhone = "",
    vehicle = "Luxury Vehicle",
    vehicleType = "Sedan",
    date = "",
    timeSlot = "",
    address = "Mobile Client Location",
    amount,
    currency = "cad",
    items = [],
    successUrl,
    cancelUrl,
  } = data || {};

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("A valid positive 'amount' is required.");
  }

  const appBaseUrl = process.env.APP_URL || "http://localhost:5173";
  const refId = bookingId || orderId || `BW-${Math.floor(100000 + Math.random() * 900000)}`;

  const stripe = getStripe();

  // If real Stripe secret is configured, create live Stripe Checkout Session
  if (stripe) {
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (type === "shop_order" && Array.isArray(items) && items.length > 0) {
      lineItems = items.map((item: any) => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.title || item.product?.title || "Bentley Detailing Product",
            description: item.product?.description?.slice(0, 200) || undefined,
          },
          unit_amount: Math.round(parseFloat(item.priceNumeric || item.product?.priceNumeric || numericAmount) * 100),
        },
        quantity: item.quantity || 1,
      }));
    } else {
      lineItems = [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Bentley Detail: ${serviceTitle}`,
              description: `Mobile Detailing for ${vehicle} (${vehicleType}) on ${date} at ${timeSlot}`,
            },
            unit_amount: Math.round(numericAmount * 100),
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail || undefined,
      client_reference_id: refId,
      metadata: {
        type,
        refId,
        bookingId: bookingId || refId,
        customerName,
        customerEmail,
        customerPhone,
        vehicle,
        date,
        timeSlot,
        address,
        userId: authUid || "",
      },
      success_url: successUrl || `${appBaseUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${refId}&status=success`,
      cancel_url: cancelUrl || `${appBaseUrl}?booking_id=${refId}&status=cancelled`,
    });

    // Save pending state in Firestore
    const collectionName = type === "shop_order" ? "orders" : "bookings";
    await getDb()
      .collection(collectionName)
      .doc(refId)
      .set(
        {
          id: refId,
          stripeSessionId: session.id,
          paymentStatus: "awaiting_payment",
          status: "pending",
          customerName,
          customerEmail,
          customerPhone,
          price: `$${numericAmount.toFixed(2)}`,
          totalNumeric: numericAmount,
          currency: currency.toUpperCase(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
      paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      mock: false,
    };
  }

  // Simulation Mode (when test placeholder key is in use)
  const simulatedSessionId = `cs_test_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  const simulatedPaymentIntent = `pi_test_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

  const collectionName = type === "shop_order" ? "orders" : "bookings";
  await getDb()
    .collection(collectionName)
    .doc(refId)
    .set(
      {
        id: refId,
        stripeSessionId: simulatedSessionId,
        stripePaymentId: simulatedPaymentIntent,
        paymentStatus: "awaiting_payment",
        customerName,
        customerEmail,
        customerPhone,
        price: `$${numericAmount.toFixed(2)}`,
        totalNumeric: numericAmount,
        currency: currency.toUpperCase(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return {
    success: true,
    sessionId: simulatedSessionId,
    url: `${appBaseUrl}?session_id=${simulatedSessionId}&booking_id=${refId}&status=success`,
    paymentIntentId: simulatedPaymentIntent,
    mock: true,
  };
}

/**
 * Endpoint: POST /api/create-carwash-checkout (or /createCarwashCheckout)
 */
export const createCarwashCheckout = functions.https.onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const result = await executeCreateCarwashCheckout(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("[createCarwashCheckout] Error:", error);
    res.status(400).json({ error: error.message || "Checkout session creation failed." });
  }
});

/**
 * Callable Function: createCarwashCheckoutSession
 */
export const createCarwashCheckoutSession = functions.https.onCall(async (data, context) => {
  try {
    return await executeCreateCarwashCheckout(data, context.auth?.uid);
  } catch (error: any) {
    console.error("[createCarwashCheckoutSession] Error:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to create checkout session.");
  }
});

// ============================================================================
// 2. VERIFY PAYMENT & CONFIRM BOOKING
// ============================================================================

/**
 * Core business logic for verifying payment and marking booking/order confirmed
 */
async function executeVerifyPaymentAndConfirm(data: any) {
  const { sessionId, paymentIntentId, bookingId, orderId } = data || {};
  const refId = bookingId || orderId;

  if (!refId && !sessionId && !paymentIntentId) {
    throw new Error("bookingId/orderId, sessionId, or paymentIntentId is required.");
  }

  const stripe = getStripe();
  let isPaid = false;
  let finalPaymentIntent = paymentIntentId;
  let cardBrand = "Card";
  let cardLast4 = "4242";

  if (stripe) {
    // 1. Verify via Stripe Checkout Session
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"],
      });
      isPaid = session.payment_status === "paid" || session.status === "complete";
      if (session.payment_intent && typeof session.payment_intent === "object") {
        finalPaymentIntent = session.payment_intent.id;
        const charge = (session.payment_intent as any).charges?.data?.[0];
        if (charge?.payment_method_details?.card) {
          cardBrand = charge.payment_method_details.card.brand || cardBrand;
          cardLast4 = charge.payment_method_details.card.last4 || cardLast4;
        }
      } else if (typeof session.payment_intent === "string") {
        finalPaymentIntent = session.payment_intent;
      }
    }
    // 2. Verify via Stripe PaymentIntent directly
    else if (paymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      isPaid = intent.status === "succeeded";
      finalPaymentIntent = intent.id;
      const charge = (intent as any).charges?.data?.[0];
      if (charge?.payment_method_details?.card) {
        cardBrand = charge.payment_method_details.card.brand || cardBrand;
        cardLast4 = charge.payment_method_details.card.last4 || cardLast4;
      }
    }
  } else {
    // Test/simulation mode: accept payment verification
    isPaid = true;
    finalPaymentIntent = paymentIntentId || sessionId || `pi_sim_${Date.now()}`;
  }

  if (!isPaid) {
    throw new Error("Payment has not been completed or verified by Stripe.");
  }

  // Determine target collection (bookings or orders)
  const isOrder = !!orderId;
  const collectionName = isOrder ? "orders" : "bookings";
  const docRef = getDb().collection(collectionName).doc(refId);
  const docSnap = await docRef.get();

  const docData = docSnap.exists ? docSnap.data() : null;

  // Update document status in Firestore
  await docRef.set(
    {
      status: isOrder ? "processing" : "scheduled",
      paymentStatus: "paid",
      stripePaymentId: finalPaymentIntent,
      cardBrand,
      cardLast4,
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Send branded confirmation email via SendGrid if email is available
  const recipientEmail = docData?.customerEmail || data?.customerEmail;
  if (recipientEmail) {
    try {
      if (!isOrder) {
        const emailHtml = templates.bookingConfirmationEmailTemplate({
          bookingId: refId,
          customerName: docData?.customerName || data?.customerName || "Member",
          serviceTitle: docData?.title || docData?.serviceTitle || "Mobile Detailing Service",
          vehicle: docData?.vehicle || "Registered Vehicle",
          date: docData?.date || "Scheduled Date",
          timeSlot: docData?.time || docData?.timeSlot || "Scheduled Time",
          address: docData?.address || "Client Location",
          price: docData?.price || `$${docData?.totalNumeric || 0}`,
          stripePaymentId: finalPaymentIntent,
          technicianName: docData?.technicianName || "Alex Rivera",
        });

        await dispatchSendGridEmail({
          to: recipientEmail,
          subject: `Booking Confirmed: Bentley Mobile Detailing (#${refId}) 🚗✨`,
          html: emailHtml,
        });
      } else {
        const emailHtml = templates.orderConfirmationEmailTemplate({
          orderId: refId,
          customerName: docData?.customerName || "Member",
          items: docData?.items || [],
          grandTotal: docData?.grandTotal || `${docData?.totalNumeric || 0}`,
          shippingAddress: docData?.shippingAddress || "Registered Delivery Address",
          stripePaymentId: finalPaymentIntent,
        });

        await dispatchSendGridEmail({
          to: recipientEmail,
          subject: `Order Receipt: Bentley Detailing Care (#${refId}) 🛍️`,
          html: emailHtml,
        });
      }
    } catch (emailErr) {
      console.warn("[verifyPayment] Confirmation email dispatch notice:", emailErr);
    }
  }

  return {
    success: true,
    verified: true,
    paymentStatus: "paid",
    id: refId,
    bookingId: isOrder ? undefined : refId,
    orderId: isOrder ? refId : undefined,
    stripePaymentId: finalPaymentIntent,
    cardBrand,
    cardLast4,
  };
}

/**
 * Endpoint: POST /verifyPaymentAndConfirmBooking (or /api/verify-carwash-payment)
 */
export const verifyPaymentAndConfirmBooking = functions.https.onRequest(async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const result = await executeVerifyPaymentAndConfirm(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("[verifyPaymentAndConfirmBooking] Error:", error);
    res.status(400).json({ error: error.message || "Payment verification failed." });
  }
});

/**
 * Callable Function: verifyPaymentAndConfirmBookingCallable
 */
export const verifyPaymentAndConfirmBookingCallable = functions.https.onCall(async (data) => {
  try {
    return await executeVerifyPaymentAndConfirm(data);
  } catch (error: any) {
    console.error("[verifyPaymentAndConfirmBookingCallable] Error:", error);
    throw new functions.https.HttpsError("internal", error.message || "Verification failed.");
  }
});

// ============================================================================
// 3. STRIPE WEBHOOK HANDLER
// ============================================================================

/**
 * Endpoint: POST /stripeWebhook
 * Listens for checkout.session.completed and payment_intent.succeeded
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  const stripe = getStripe();
  if (!stripe) {
    res.status(200).json({ received: true, mode: "simulation" });
    return;
  }

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err: any) {
    console.error(`[stripeWebhook] Webhook signature verification failed:`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle successful payments
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const refId = session.client_reference_id || session.metadata?.refId || session.metadata?.bookingId;
    if (refId) {
      try {
        await executeVerifyPaymentAndConfirm({
          sessionId: session.id,
          bookingId: session.metadata?.type === "shop_order" ? undefined : refId,
          orderId: session.metadata?.type === "shop_order" ? refId : undefined,
        });
      } catch (e) {
        console.error(`[stripeWebhook] Failed to confirm from session:`, e);
      }
    }
  } else if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const refId = intent.metadata?.bookingId || intent.metadata?.refId;
    if (refId) {
      try {
        await executeVerifyPaymentAndConfirm({
          paymentIntentId: intent.id,
          bookingId: refId,
        });
      } catch (e) {
        console.error(`[stripeWebhook] Failed to confirm from intent:`, e);
      }
    }
  }

  res.status(200).json({ received: true });
});

// ============================================================================
// 4. TRANSACTIONAL EMAILS FOR CAR WASH
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

// ============================================================================
// 5. USER ACCOUNT DELETION (Required by DeleteUser.tsx)
// ============================================================================

/**
 * Callable Function: deleteUserAccount
 */
export const deleteUserAccount = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required to delete account.");
  }

  const callerUid = context.auth.uid;
  const targetUid = data?.targetUid || callerUid;

  if (targetUid !== callerUid) {
    const callerDoc = await getDb().collection("users").doc(callerUid).get();
    const callerRole = (callerDoc.data()?.role || "").toString().toLowerCase();
    const allowedRoles = ["admin", "super_admin", "owner"];
    if (!allowedRoles.includes(callerRole) && context.auth.token?.admin !== true) {
      throw new functions.https.HttpsError("permission-denied", "Unauthorized to delete other users.");
    }
  }

  try {
    await getDb().collection("users").doc(targetUid).delete();
    try {
      await admin.auth().deleteUser(targetUid);
    } catch (authError: any) {
      console.warn(`[deleteUserAccount] Auth user deletion warning:`, authError.message);
    }
    return { success: true, message: `User account ${targetUid} deleted successfully.` };
  } catch (error: any) {
    console.error(`[deleteUserAccount] Failed to delete user ${targetUid}:`, error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to delete user account.");
  }
});
