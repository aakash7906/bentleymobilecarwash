import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { dispatchSendGridEmail, generateDefaultEmailHtml } from "./services/sendgrid";
import * as templates from "./services/emailTemplates";


if (!admin.apps.length) {
  admin.initializeApp();
}

// Lazy initializer for Stripe
function getStripe() {
  let stripeConfigSecret: string | null = null;
  try {
    stripeConfigSecret = functions.config()?.stripe?.secret || null;
  } catch (e) {
    // ignore
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY || 
                    process.env.STRIPE_SECRET || 
                    stripeConfigSecret || 
                    "";
  if (!stripeKey || stripeKey === "sk_test_placeholder" || !stripeKey.startsWith("sk_")) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Stripe Secret Key is not configured on the backend. Please set STRIPE_SECRET_KEY in functions environment or Firebase config."
    );
  }
  return new Stripe(stripeKey, {
    apiVersion: "2022-11-15" as any
  });
}


/**
 * Callable Cloud Function: createStripePaymentIntent
 * Secures payment parameters on the server and generates a Stripe Client Secret.
 */
export const createStripePaymentIntent = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // 1. Ensure the user calling the function is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called by an authenticated user."
    );
  }

  const { amount, bidId, name } = data;

  // 2. Validate essential request inputs
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A valid 'amount' number greater than 0 is required."
    );
  }
  if (!bidId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A valid 'bidId' string is required to track this transaction."
    );
  }

  try {
    // 3. Create the payment intent with Stripe
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects the amount in cents
      currency: "usd",
      metadata: {
        bidId: bidId,
        buyerId: context.auth.uid,
        buyerEmail: context.auth.token.email || "",
        productName: name || "Classified Item"
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // 4. Return the client secret to initialize Stripe Elements on the client side
    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    };
  } catch (err: any) {
    console.error("Stripe payment intent creation failed:", err);
    throw new functions.https.HttpsError(
      "internal",
      err.message || "Unable to initialize Stripe payment intent."
    );
  }
});

/**
 * Callable Cloud Function: createStripeConnectAccount
 * Creates a Stripe Connect Express account and returns onboarding Link URL.
 */
export const createStripeConnectAccount = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }


  try {
    // Check if account already exists
    const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get();
    let accountId = userDoc.exists ? userDoc.data()?.stripeConnectAccountId : null;

    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: "express",
        email: context.auth.token.email || "",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });
      accountId = account.id;
      await admin.firestore().collection("users").doc(context.auth.uid).set({
        stripeConnectAccountId: accountId,
        stripeConnectStatus: "pending",
        stripeConnectConnected: false,
        stripeConnectEmail: context.auth.token.email || ""
      }, { merge: true });
    }

    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: data.refreshUrl || "http://localhost:5173/dashboard/payments?stripe_callback=refresh",
      return_url: data.returnUrl || "http://localhost:5173/dashboard/payments?stripe_callback=success",
      type: "account_onboarding"
    });

    return {
      url: accountLink.url,
      accountId: accountId,
      mock: false
    };
  } catch (err: any) {
    console.error("Stripe Connect Account creation failed:", err);
    throw new functions.https.HttpsError("internal", err.message || "Failed to create Connect Account.");
  }
});

/**
 * Callable Cloud Function: checkStripeConnectStatus
 * Checks onboarding status and saves to database.
 */
export const checkStripeConnectStatus = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const userDocRef = admin.firestore().collection("users").doc(context.auth.uid);
  const userDoc = await userDocRef.get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User profile not found.");
  }

  const accountId = userDoc.data()?.stripeConnectAccountId;
  if (!accountId) {
    throw new functions.https.HttpsError("failed-precondition", "Stripe Connect account not initialized.");
  }


  try {
    const account = await getStripe().accounts.retrieve(accountId);
    const connected = account.charges_enabled && account.payouts_enabled;
    if (connected) {
      await userDocRef.set({
        stripeConnectConnected: true,
        stripeConnectStatus: "connected",
        stripeConnectEmail: account.email || context.auth.token.email || ""
      }, { merge: true });
    }
    return {
      connected,
      status: connected ? "connected" : "pending",
      details: account
    };
  } catch (err: any) {
    console.error("Stripe retrieve account failed:", err);
    throw new functions.https.HttpsError("internal", err.message || "Failed to check Stripe Connect status.");
  }
});

/**
 * Callable Cloud Function: getStripeConnectBalance
 * Retrieves the available and pending Stripe balances.
 */
export const getStripeConnectBalance = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const userDocRef = admin.firestore().collection("users").doc(context.auth.uid);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User profile not found.");
  }

  const accountId = userDoc.data()?.stripeConnectAccountId;
  if (!accountId) {
    return { available: 0, pending: 0, connected: false };
  }


  try {
    const stripeBalance = await getStripe().balance.retrieve({ stripeAccount: accountId });
    const available = stripeBalance.available.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) / 100;
    const pending = stripeBalance.pending.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0) / 100;

    return {
      available,
      pending,
      connected: true,
      mock: false
    };
  } catch (err: any) {
    console.error("Failed to retrieve Stripe balance:", err);
    throw new functions.https.HttpsError("internal", err.message || "Failed to retrieve Stripe balance.");
  }
});

/**
 * Callable Cloud Function: createStripeConnectPayout
 * Executes a payout (withdrawal) from the user's Stripe Connect balance to their bank account.
 */
export const createStripeConnectPayout = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { amount } = data;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "A valid 'amount' number greater than 0 is required.");
  }

  const userDocRef = admin.firestore().collection("users").doc(context.auth.uid);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User profile not found.");
  }

  const accountId = userDoc.data()?.stripeConnectAccountId;
  if (!accountId) {
    throw new functions.https.HttpsError("failed-precondition", "Stripe Connect account not setup.");
  }


  try {
    const amountInCents = Math.round(amount * 100);
    const payout = await getStripe().payouts.create({
      amount: amountInCents,
      currency: "usd",
    }, {
      stripeAccount: accountId
    });

    await userDocRef.collection("payouts").add({
      payoutId: payout.id,
      amount: amount,
      currency: "usd",
      status: payout.status || "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      payoutId: payout.id,
      amount: amount,
      mock: false
    };
  } catch (err: any) {
    console.error("Stripe payout creation failed:", err);
    throw new functions.https.HttpsError("internal", err.message || "Stripe payout failed.");
  }
});

/**
 * Callable Cloud Function: sendContactEmail
 * Handles website contact form submissions and dispatches notifications via SendGrid.
 */
export const sendContactEmail = functions.https.onCall(async (data: any) => {
  const { name, email, subject, message } = data || {};

  if (!name || !email || !message) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Name, email, and message are required fields."
    );
  }

  const emailSubject = `[Contact Form] ${subject || "Inquiry from " + name}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">New Contact Us Submission</h2>
      <p><strong>Sender Name:</strong> ${name}</p>
      <p><strong>Sender Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Subject:</strong> ${subject || "N/A"}</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-top: 16px; border-radius: 4px;">
        <strong style="color: #475569; display: block; margin-bottom: 6px;">Message Content:</strong>
        <p style="white-space: pre-wrap; margin: 0; font-size: 14px;">${message}</p>
      </div>
    </div>
  `;

  try {
    // Send email to site support/admin
    const adminEmail = process.env.SENDGRID_ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL || "concierge@bentleycarwash.com";
    await dispatchSendGridEmail({
      to: adminEmail,
      subject: emailSubject,
      html: htmlBody,
      replyTo: email
    });

    // Send automated confirmation receipt to the user
    await dispatchSendGridEmail({
      to: email,
      subject: `We received your inquiry - Bentley Mobile Car Wash`,
      text: `Hi ${name},\n\nThank you for reaching out to Bentley Mobile Car Wash! We have received your message regarding "${subject || "your inquiry"}" and our team will get back to you shortly.\n\nBest regards,\nBentley Concierge Team`,
    });

    return { success: true, message: "Contact message sent successfully via SendGrid." };
  } catch (error: any) {
    console.error("Error sending contact email:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to send contact email.");
  }
});

/**
 * Callable Cloud Function: sendEmail
 * General-purpose authenticated email dispatcher using SendGrid.
 */
export const sendEmail = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required to send emails.");
  }

  const { to, subject, text, html, bcc, cc } = data || {};
  if (!to || !subject || (!text && !html)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Destination 'to', 'subject', and content ('text' or 'html') are required."
    );
  }

  try {
    const result = await dispatchSendGridEmail({ to, subject, text, html, bcc, cc });
    return result;
  } catch (error: any) {
    throw new functions.https.HttpsError("internal", error.message || "Email dispatch failed.");
  }
});

/**
 * Callable Cloud Function: sendOrderNotificationEmail
 * Dispatches transactional notifications for purchases, bids, and order updates.
 */
export const sendOrderNotificationEmail = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

  const { recipientEmail, recipientName, itemTitle, orderId, amount, type } = data || {};

  if (!recipientEmail || !itemTitle || !amount) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail, itemTitle, and amount are required.");
  }

  const titleText = type === "seller" ? "Item Sold Notification" : "Order Confirmation";
  const subject = `${titleText}: ${itemTitle} (#${orderId || "BENTLEY-" + Date.now().toString().slice(-6)})`;

  const htmlContent = generateDefaultEmailHtml(
    subject,
    `Hi ${recipientName || "Collector"},\n\n` +
    (type === "seller"
      ? `Great news! Your item "${itemTitle}" has been purchased for $${amount.toFixed(2)}.`
      : `Thank you for your purchase of "${itemTitle}" for $${amount.toFixed(2)}. Your transaction has been logged securely.`) +
    `\n\nOrder ID: #${orderId || "N/A"}\nAmount: $${amount.toFixed(2)}\n\nThank you for choosing Bentley Mobile Car Wash!`
  );

  try {
    const result = await dispatchSendGridEmail({
      to: recipientEmail,
      subject: subject,
      html: htmlContent
    });
    return result;
  } catch (error: any) {
    console.error("Order notification email error:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to dispatch order notification.");
  }
});

/**
 * Callable Cloud Function: sendWelcomeProEmail
 */
export const sendWelcomeProEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, userName } = data || {};
  if (!recipientEmail || !userName) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail and userName are required.");
  }

  const html = templates.welcomeProEmailTemplate(userName);
  return await dispatchSendGridEmail({
    to: recipientEmail,
    subject: `Welcome to the Bentley Mobile Car Wash family, ${userName}! 🚀`,
    html
  });
});

/**
 * Callable Cloud Function: sendWelcomeUserEmail
 */
export const sendWelcomeUserEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, userName, html } = data || {};
  if (!recipientEmail) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail is required.");
  }

  const name = userName || "Collector";
  const emailHtml = html || templates.welcomeUserEmailTemplate(name);
  return await dispatchSendGridEmail({
    to: recipientEmail,
    subject: `Welcome to Bentley Mobile Car Wash, ${name}! 🚀`,
    html: emailHtml
  });
});

/**
 * Callable Cloud Function: sendDocumentStatusEmail
 */
export const sendDocumentStatusEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, userName, documentName, status } = data || {};
  if (!recipientEmail || !userName || !documentName || !status) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail, userName, documentName, and status are required.");
  }

  const html = templates.documentStatusEmailTemplate(userName, documentName, status);
  return await dispatchSendGridEmail({
    to: recipientEmail,
    subject: `Document Status Update: ${documentName}`,
    html
  });
});

/**
 * Callable Cloud Function: sendVeteranStatusEmail
 */
export const sendVeteranStatusEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, userName, status } = data || {};
  if (!recipientEmail || !userName || !status) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail, userName, and status are required.");
  }

  const html = templates.veteranStatusEmailTemplate(userName, status);
  return await dispatchSendGridEmail({
    to: recipientEmail,
    subject: `Veteran Status Update`,
    html
  });
});

/**
 * Callable Cloud Function: sendNewProSignupAdminEmail
 */
export const sendNewProSignupAdminEmail = functions.https.onCall(async (data: any) => {
  const { adminEmail, proDetails } = data || {};
  if (!proDetails || !proDetails.name || !proDetails.email) {
    throw new functions.https.HttpsError("invalid-argument", "Valid proDetails object is required.");
  }

  const targetAdminEmail = adminEmail || process.env.SENDGRID_ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL || "concierge@bentleycarwash.com";
  const html = templates.newProSignupAdminEmailTemplate(proDetails);
  return await dispatchSendGridEmail({
    to: targetAdminEmail,
    subject: `🔐 ADMIN: New Professional Registration - ${proDetails.name}`,
    html
  });
});

/**
 * Callable Cloud Function: sendNewLeadNotificationEmail
 */
export const sendNewLeadNotificationEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, leadData } = data || {};
  if (!recipientEmail || !leadData || !leadData.proName || !leadData.shortTitle) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail and leadData are required.");
  }

  const html = templates.newLeadNotificationEmailTemplate(leadData);
  return await dispatchSendGridEmail({
    to: recipientEmail,
    subject: `New Lead Available: ${leadData.shortTitle} 🚀`,
    html
  });
});

/**
 * Callable Cloud Function: sendNewBookingNotificationEmail
 */
export const sendNewBookingNotificationEmail = functions.https.onCall(async (data: any) => {
  const { recipientEmail, bookingData } = data || {};
  if (!recipientEmail || !bookingData || !bookingData.proName || !bookingData.serviceTitle) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail and bookingData are required.");
  }

  const html = templates.newBookingNotificationEmailTemplate(bookingData);
  return await dispatchSendGridEmail({
    to: recipientEmail,
    subject: `New Booking Confirmed: ${bookingData.serviceTitle} 🎉`,
    html
  });
});

/**
 * Callable Cloud Function: sendOtpVerificationEmail
 */
export const sendOtpVerificationEmail = functions.https.onCall(async (data: any) => {
  let { recipientEmail, userName, otpCode, payloadToken } = data || {};
  if (payloadToken && !otpCode) {
    try {
      const decoded = Buffer.from(payloadToken, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded);
      otpCode = parsed.code;
      recipientEmail = recipientEmail || parsed.email;
      userName = userName || parsed.name;
    } catch (e) {
      otpCode = payloadToken;
    }
  }

  if (!recipientEmail || !otpCode) {
    throw new functions.https.HttpsError("invalid-argument", "recipientEmail and otpCode are required.");
  }

  const name = userName || "Collector";
  const html = templates.otpVerificationEmailTemplate(name, otpCode);
  return await dispatchSendGridEmail({
    to: recipientEmail,
    subject: `Your Verification Code: ${otpCode}`,
    html
  });
});

/**
 * Callable Cloud Function: deleteUserAccount
 * Deletes a user account from BOTH Firebase Authentication and Firestore 'users' collection.
 * Users can delete their own account, or Admins can delete any specified target user account.
 */
export const deleteUserAccount = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required to delete a user account.");
  }

  const callerUid = context.auth.uid;
  const targetUid = data?.targetUid || callerUid;

  // Verify authorization: User can delete their own account, or caller must have administrative permissions
  if (targetUid !== callerUid) {
    const callerDoc = await admin.firestore().collection("users").doc(callerUid).get();
    const callerRole = (callerDoc.data()?.role || "").toString().toLowerCase();
    const allowedRoles = ["admin", "super_admin", "superadmin", "collaborator", "owner"];
    if (!allowedRoles.includes(callerRole) && context.auth.token?.admin !== true) {
      throw new functions.https.HttpsError("permission-denied", `Role '${callerRole}' is not authorized to delete other user accounts.`);
    }
  }

  try {
    // 1. Delete user document from Firestore 'users' collection
    await admin.firestore().collection("users").doc(targetUid).delete();

    // 2. Delete user account from Firebase Authentication using Admin SDK
    try {
      await admin.auth().deleteUser(targetUid);
    } catch (authError: any) {
      console.warn(`[deleteUserAccount] Auth user ${targetUid} deletion warning (might not exist in Auth):`, authError.message);
    }

    console.log(`[deleteUserAccount] User ${targetUid} successfully deleted by ${callerUid}.`);
    return { success: true, message: `User account ${targetUid} has been deleted successfully.` };
  } catch (error: any) {
    console.error(`[deleteUserAccount] Failed to delete user ${targetUid}:`, error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to delete user account.");
  }
});

/**
 * Callable Cloud Function: sendCustomPasswordResetEmail
 * Generates password reset action code and sends branded HTML email via SendGrid.
 */
export const sendCustomPasswordResetEmail = functions.https.onCall(async (data: any) => {
  const { email, continueUrl } = data || {};
  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required.");
  }

  try {
    const targetUrl = continueUrl || "http://localhost:5173/reset-password";
    const actionCodeSettings = {
      url: targetUrl,
      handleCodeInApp: true,
    };

    // 1. Generate reset link via Firebase Admin SDK
    const link = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    // Extract oobCode to construct direct frontend reset link
    const urlObj = new URL(link);
    const oobCode = urlObj.searchParams.get("oobCode");
    const directResetUrl = `${targetUrl}?oobCode=${oobCode}`;

    // 2. Fetch user's displayName if available
    let userName = "Collector";
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      if (userRecord.displayName) {
        userName = userRecord.displayName;
      } else {
        const userDoc = await admin.firestore().collection("users").doc(userRecord.uid).get();
        if (userDoc.exists && userDoc.data()?.name) {
          userName = userDoc.data()?.name;
        }
      }
    } catch (e) {
      console.log("Could not fetch user record details for name, using default name.");
    }

    // 3. Render HTML email template
    const html = templates.passwordResetEmailTemplate(userName, directResetUrl);

    // 4. Send email via SendGrid
    await dispatchSendGridEmail({
      to: email,
      subject: `Reset Your Bentley Mobile Car Wash Password 🔐`,
      html,
    });

    return { success: true, message: "Custom password reset email dispatched successfully." };
  } catch (error: any) {
    console.error("Error sending custom password reset email:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to send password reset email.");
  }
});

// ShipStation Services Import
import {
  getShipStationCarriers as fetchShipStationCarriers,
  getShipStationRates as fetchShipStationRates,
  createShipStationOrder as pushShipStationOrder
} from "./services/shipstation";

/**
 * Callable Cloud Function: getShipStationCarriers
 */
export const getShipStationCarriers = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  try {
    const carriers = await fetchShipStationCarriers(data?.sellerId);
    return { success: true, carriers };
  } catch (error: any) {
    console.error("Error fetching ShipStation carriers:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to fetch carriers.");
  }
});

/**
 * Callable Cloud Function: getShipStationRates
 */
export const getShipStationRates = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  try {
    const rates = await fetchShipStationRates(data);
    return { success: true, rates };
  } catch (error: any) {
    console.error("Error fetching ShipStation rates:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to fetch rates.");
  }
});

/**
 * Callable Cloud Function: createShipStationOrder
 */
export const createShipStationOrder = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  try {
    const orderResult = await pushShipStationOrder(data);
    return { success: true, order: orderResult };
  } catch (error: any) {
    console.error("Error creating ShipStation order:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to create order.");
  }
});





