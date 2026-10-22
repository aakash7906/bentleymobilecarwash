import sgMail from "@sendgrid/mail";
import * as functions from "firebase-functions";

// Retrieve API key from environment variables or Firebase config
function getSendGridApiKey(): string | null {
  let configKey: string | null = null;
  try {
    configKey = functions.config()?.sendgrid?.api_key || null;
  } catch (e) {
    // ignore
  }
  return (
    process.env.SENDGRID_API_KEY ||
    configKey ||
    null
  );
}

// Retrieve verified Sender Email from environment variables or default fallback
function getFromEmail(): string {
  let configFrom: string | null = null;
  try {
    configFrom = functions.config()?.sendgrid?.from_email || null;
  } catch (e) {
    // ignore
  }
  const email = (
    process.env.SENDGRID_FROM_EMAIL ||
    configFrom ||
    "concierge@bentleycarwash.com"
  );
  return email.includes("mymaxpod.com") ? "concierge@bentleycarwash.com" : email;
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  bcc?: string | string[];
  cc?: string | string[];
}

/**
 * Sends an email using SendGrid API.
 * Automatically formats HTML content if not provided.
 */
export async function dispatchSendGridEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }> {
  const apiKey = getSendGridApiKey();

  if (!apiKey || apiKey === "SG.placeholder" || apiKey.trim() === "") {
    console.warn("[SendGrid] API Key is missing or invalid. Logged email payload instead:", {
      to: payload.to,
      subject: payload.subject,
      from: payload.from || getFromEmail(),
      bcc: payload.bcc
    });
    // Return mock success in local/dev environment when API key is not configured yet
    return { success: true, messageId: "mock_sendgrid_msg_id_" + Date.now() };
  }

  sgMail.setApiKey(apiKey);

  const fromAddress = payload.from || getFromEmail();
  const htmlContent = payload.html || generateDefaultEmailHtml(payload.subject, payload.text || "");

  const msg: any = {
    to: payload.to,
    from: fromAddress,
    replyTo: payload.replyTo,
    subject: payload.subject,
    text: payload.text || payload.html?.replace(/<[^>]*>?/gm, "") || "",
    html: htmlContent,
  };

  if (payload.bcc) {
    msg.bcc = payload.bcc;
  }
  if (payload.cc) {
    msg.cc = payload.cc;
  }

  try {
    const [response] = await sgMail.send(msg);
    console.log(`[SendGrid] Email sent successfully to ${payload.to}. Status: ${response.statusCode}`);
    return {
      success: response.statusCode >= 200 && response.statusCode < 300,
      messageId: response.headers["x-message-id"] as string
    };
  } catch (error: any) {
    console.error("[SendGrid] Error sending email via SendGrid:", error.response?.body || error.message || error);
    throw new Error(`SendGrid Email Dispatch Failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * Standard branded HTML email template generator for Cards & Curio
 */
export function generateDefaultEmailHtml(title: string, bodyText: string): string {
  const year = new Date().getFullYear();
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; tracking-style: tight; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
          .content { padding: 32px 24px; line-height: 1.6; font-size: 15px; }
          .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .footer a { color: #2563eb; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bentley Mobile Car Wash</h1>
            <p>Luxury Detailing & Mobile Concierge Care</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">${title}</h2>
            <div style="white-space: pre-wrap; color: #334155;">${bodyText}</div>
          </div>
          <div class="footer">
            <p>© ${year} Bentley Mobile Car Wash & Detailing. All rights reserved.</p>
            <p>Need help? Contact support at <a href="mailto:concierge@bentleycarwash.com">concierge@bentleycarwash.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}
