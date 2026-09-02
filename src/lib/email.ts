import nodemailer from "nodemailer";
import { db } from "@/lib/db";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const settings = await db.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => (settingsMap[s.key] = s.value));

    const host = settingsMap["smtp_host"] || process.env.SMTP_HOST;
    const portStr = settingsMap["smtp_port"] || process.env.SMTP_PORT || "587";
    const user = settingsMap["smtp_user"] || process.env.SMTP_USER;
    const pass = settingsMap["smtp_pass"] || process.env.SMTP_PASS;
    const fromEmail = settingsMap["smtp_from"] || process.env.SMTP_FROM || settingsMap["notification_email"] || user || "no-reply@lunchcounter.com";

    const cleanUser = user ? user.trim() : "";
    const cleanPass = pass ? pass.replace(/\s+/g, "").trim() : "";

    if (!host || !cleanUser || !cleanPass) {
      console.warn("[Email Service] SMTP configuration missing (host, user, or pass). Email not dispatched via SMTP.");
      return {
        success: false,
        delivered: false,
        error: "SMTP credentials not configured. Please add SMTP_HOST, SMTP_USER, and SMTP_PASS in System Settings or .env file.",
      };
    }

    const port = parseInt(portStr, 10);
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host: host.trim(),
      port,
      secure,
      auth: { user: cleanUser, pass: cleanPass },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `Lunch Counter <${fromEmail}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ""),
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Email sent successfully to ${to}. Message ID: ${info.messageId}`);

    return {
      success: true,
      delivered: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("[Email Service] Failed to send email:", error);
    return {
      success: false,
      delivered: false,
      error: error.message || "Failed to send email via SMTP",
    };
  }
}
