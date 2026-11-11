import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import * as functions from "firebase-functions";

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
 * Get configured SMTP credentials from environment variables or Firebase config
 */
function getSmtpConfig() {
  let configSmtp: any = {};
  try {
    configSmtp = functions.config()?.smtp || {};
  } catch {
    // ignore
  }

  const host = process.env.SMTP_HOST || configSmtp.host || "";
  const port = parseInt(process.env.SMTP_PORT || configSmtp.port || "465", 10);
  const secure = process.env.SMTP_SECURE === "true" || configSmtp.secure === "true" || port === 465;
  const user = process.env.SMTP_USER || configSmtp.user || "";
  const pass = process.env.SMTP_PASS || configSmtp.pass || "";
  const service = process.env.SMTP_SERVICE || configSmtp.service || "";
  const from =
    process.env.SMTP_FROM ||
    configSmtp.from ||
    `"Bentley Mobile Car Wash" <${user || "concierge@bentleycarwash.com"}>`;

  return { host, port, secure, user, pass, service, from };
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): { transporter: Transporter | null; from: string } {
  const config = getSmtpConfig();

  if (
    !config.user ||
    !config.pass ||
    config.user === "your-email@gmail.com" ||
    config.pass === "your-16-char-app-password" ||
    config.pass.includes("app-password")
  ) {
    return { transporter: null, from: config.from };
  }

  if (cachedTransporter) {
    return { transporter: cachedTransporter, from: config.from };
  }

  if (config.service) {
    // E.g., 'gmail'
    cachedTransporter = nodemailer.createTransport({
      service: config.service,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  } else if (config.host) {
    // Standard custom SMTP
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return { transporter: cachedTransporter, from: config.from };
}

/**
 * Dispatches an email using Nodemailer (SMTP).
 * If SMTP is not yet configured, safely logs the email to console for debugging.
 */
export async function dispatchEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }> {
  const { transporter, from } = getTransporter();

  const fromAddress = payload.from || from;
  const toAddress = Array.isArray(payload.to) ? payload.to.join(", ") : payload.to;

  if (!transporter) {
    console.warn("[Nodemailer] SMTP credentials (SMTP_USER / SMTP_PASS) not configured. Email logged to console:", {
      to: toAddress,
      from: fromAddress,
      subject: payload.subject,
    });
    return {
      success: true,
      messageId: "mock_nodemailer_dev_" + Date.now(),
    };
  }

  const mailOptions: SendMailOptions = {
    from: fromAddress,
    to: toAddress,
    subject: payload.subject,
    text: payload.text || payload.html?.replace(/<[^>]*>?/gm, "") || "",
    html: payload.html,
    replyTo: payload.replyTo,
    bcc: payload.bcc,
    cc: payload.cc,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Nodemailer] Email dispatched successfully to ${toAddress}. Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error(`[Nodemailer] Failed to send email to ${toAddress}:`, error);
    throw new Error(`Nodemailer dispatch failed: ${error.message || "Unknown error"}`);
  }
}
