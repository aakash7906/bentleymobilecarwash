const functions = require("firebase-functions")
const admin = require("firebase-admin")
admin.initializeApp()

// Initialize Stripe with the secret key from environment variables, config, or placeholder
const stripeKey = process.env.STRIPE_SECRET_KEY || 
                  process.env.STRIPE_SECRET || 
                  (functions.config().stripe ? functions.config().stripe.secret : null) || 
                  "sk_test_placeholder"
const stripe = require("stripe")(stripeKey)

/**
 * Callable Cloud Function: createStripePaymentIntent
 * Secures payment parameters on the server and generates a Stripe Client Secret.
 * 
 * Request Parameters (data):
 * - amount: number (USD amount to charge, e.g. 1500)
 * - bidId: string (the associated offer/bid document ID)
 * - name: string (the name of the listing product)
 * 
 * Returns:
 * - clientSecret: string (client secret to pass to Stripe Elements)
 * - id: string (payment intent ID)
 */
exports.createStripePaymentIntent = functions.https.onCall(async (data, context) => {
  // 1. Ensure the user calling the function is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called by an authenticated user."
    )
  }

  const { amount, bidId, name } = data

  // 2. Validate essential request inputs
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A valid 'amount' number greater than 0 is required."
    )
  }
  if (!bidId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A valid 'bidId' string is required to track this transaction."
    )
  }

  try {
    // 3. Create the payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
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
    })

    // 4. Return the client secret to initialize Stripe Elements on the client side
    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    }
  } catch (err) {
    console.error("Stripe payment intent creation failed:", err)
    throw new functions.https.HttpsError(
      "internal",
      err.message || "Unable to initialize Stripe payment intent."
    )
  }
})

/**
 * Callable Cloud Function: createStripeConnectAccount
 * Creates a Stripe Connect Express account and returns onboarding Link URL.
 */
exports.createStripeConnectAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.")
  }

  const isMockMode = stripeKey === "sk_test_placeholder" || !stripeKey || stripeKey.includes("placeholder")

  if (isMockMode) {
    const accountId = "acct_mock_" + Math.random().toString(36).substring(2, 14)
    await admin.firestore().collection("users").doc(context.auth.uid).set({
      stripeConnectAccountId: accountId,
      stripeConnectStatus: "pending",
      stripeConnectConnected: false,
      stripeConnectEmail: context.auth.token.email || ""
    }, { merge: true })

    const callbackUrl = data.returnUrl || "http://localhost:5173/dashboard/payments"
    const onboardingUrl = `${callbackUrl}?stripe_callback=success&accountId=${accountId}`
    
    return {
      url: onboardingUrl,
      accountId: accountId,
      mock: true
    }
  }

  try {
    // Check if account already exists
    const userDoc = await admin.firestore().collection("users").doc(context.auth.uid).get()
    let accountId = userDoc.exists ? userDoc.data().stripeConnectAccountId : null

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: context.auth.token.email || "",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      })
      accountId = account.id
      await admin.firestore().collection("users").doc(context.auth.uid).set({
        stripeConnectAccountId: accountId,
        stripeConnectStatus: "pending",
        stripeConnectConnected: false,
        stripeConnectEmail: context.auth.token.email || ""
      }, { merge: true })
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: data.refreshUrl || "http://localhost:5173/dashboard/payments?stripe_callback=refresh",
      return_url: data.returnUrl || "http://localhost:5173/dashboard/payments?stripe_callback=success",
      type: "account_onboarding"
    })

    return {
      url: accountLink.url,
      accountId: accountId,
      mock: false
    }
  } catch (err) {
    console.error("Stripe Connect Account creation failed:", err)
    throw new functions.https.HttpsError("internal", err.message || "Failed to create Connect Account.")
  }
})

/**
 * Callable Cloud Function: checkStripeConnectStatus
 * Checks onboarding status and saves to database.
 */
exports.checkStripeConnectStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.")
  }

  const userDocRef = admin.firestore().collection("users").doc(context.auth.uid)
  const userDoc = await userDocRef.get()
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User profile not found.")
  }

  const accountId = userDoc.data().stripeConnectAccountId
  if (!accountId) {
    throw new functions.https.HttpsError("failed-precondition", "Stripe Connect account not initialized.")
  }

  const isMockMode = stripeKey === "sk_test_placeholder" || !stripeKey || stripeKey.includes("placeholder") || accountId.startsWith("acct_mock_")

  if (isMockMode) {
    await userDocRef.set({
      stripeConnectConnected: true,
      stripeConnectStatus: "connected"
    }, { merge: true })
    return {
      connected: true,
      status: "connected",
      details: {
        id: accountId,
        email: context.auth.token.email || "mock@stripeconnect.com",
        charges_enabled: true,
        payouts_enabled: true
      }
    }
  }

  try {
    const account = await stripe.accounts.retrieve(accountId)
    const connected = account.charges_enabled && account.payouts_enabled
    if (connected) {
      await userDocRef.set({
        stripeConnectConnected: true,
        stripeConnectStatus: "connected",
        stripeConnectEmail: account.email || context.auth.token.email || ""
      }, { merge: true })
    }
    return {
      connected,
      status: connected ? "connected" : "pending",
      details: account
    }
  } catch (err) {
    console.error("Stripe retrieve account failed:", err)
    throw new functions.https.HttpsError("internal", err.message || "Failed to check Stripe Connect status.")
  }
})

/**
 * Callable Cloud Function: getStripeConnectBalance
 * Retrieves the available and pending Stripe balances.
 */
exports.getStripeConnectBalance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.")
  }

  const userDocRef = admin.firestore().collection("users").doc(context.auth.uid)
  const userDoc = await userDocRef.get()

  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User profile not found.")
  }

  const accountId = userDoc.data().stripeConnectAccountId
  if (!accountId) {
    return { available: 0, pending: 0, connected: false }
  }

  const isMockMode = stripeKey === "sk_test_placeholder" || !stripeKey || stripeKey.includes("placeholder") || accountId.startsWith("acct_mock_")

  if (isMockMode) {
    let mockBalance = userDoc.data().stripeMockBalance
    if (!mockBalance) {
      mockBalance = { available: 250.00, pending: 120.00 }
      await userDocRef.set({ stripeMockBalance: mockBalance }, { merge: true })
    }
    return {
      available: mockBalance.available,
      pending: mockBalance.pending,
      connected: true,
      mock: true
    }
  }

  try {
    const stripeBalance = await stripe.balance.retrieve({ stripeAccount: accountId })
    const available = stripeBalance.available.reduce((acc, curr) => acc + (curr.amount || 0), 0) / 100
    const pending = stripeBalance.pending.reduce((acc, curr) => acc + (curr.amount || 0), 0) / 100

    return {
      available,
      pending,
      connected: true,
      mock: false
    }
  } catch (err) {
    console.error("Failed to retrieve Stripe balance:", err)
    throw new functions.https.HttpsError("internal", err.message || "Failed to retrieve Stripe balance.")
  }
})

/**
 * Callable Cloud Function: createStripeConnectPayout
 * Executes a payout (withdrawal) from the user's Stripe Connect balance to their bank account.
 */
exports.createStripeConnectPayout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.")
  }

  const { amount } = data
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "A valid 'amount' number greater than 0 is required.")
  }

  const userDocRef = admin.firestore().collection("users").doc(context.auth.uid)
  const userDoc = await userDocRef.get()

  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User profile not found.")
  }

  const accountId = userDoc.data().stripeConnectAccountId
  if (!accountId) {
    throw new functions.https.HttpsError("failed-precondition", "Stripe Connect account not setup.")
  }

  const isMockMode = stripeKey === "sk_test_placeholder" || !stripeKey || stripeKey.includes("placeholder") || accountId.startsWith("acct_mock_")

  if (isMockMode) {
    let mockBalance = userDoc.data().stripeMockBalance || { available: 250.00, pending: 120.00 }
    if (mockBalance.available < amount) {
      throw new functions.https.HttpsError("failed-precondition", "Insufficient available balance for this withdrawal.")
    }

    mockBalance.available = parseFloat((mockBalance.available - amount).toFixed(2))
    await userDocRef.set({ stripeMockBalance: mockBalance }, { merge: true })

    const payoutId = "po_mock_" + Math.random().toString(36).substring(2, 14)
    
    // Log in payouts subcollection
    await userDocRef.collection("payouts").add({
      payoutId: payoutId,
      amount: amount,
      currency: "usd",
      status: "succeeded",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return {
      success: true,
      payoutId: payoutId,
      amount: amount,
      mock: true
    }
  }

  try {
    const amountInCents = Math.round(amount * 100)
    const payout = await stripe.payouts.create({
      amount: amountInCents,
      currency: "usd",
    }, {
      stripeAccount: accountId
    })

    await userDocRef.collection("payouts").add({
      payoutId: payout.id,
      amount: amount,
      currency: "usd",
      status: payout.status || "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return {
      success: true,
      payoutId: payout.id,
      amount: amount,
      mock: false
    }
  } catch (err) {
    console.error("Stripe payout creation failed:", err)
    throw new functions.https.HttpsError("internal", err.message || "Stripe payout failed.")
  }
})

