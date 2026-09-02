import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { targetEmail } = await req.json();

    const notifSetting = await db.setting.findUnique({ where: { key: "notification_email" } });
    const recipient = targetEmail?.trim() || notifSetting?.value || user.email;

    if (!recipient) {
      return NextResponse.json({ error: "Recipient email address is required" }, { status: 400 });
    }

    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 16px;">
        <h2 style="color: #2563eb;">Lunch Counter Email Test</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>This is a test notification email from your <strong>Lunch Counter</strong> management app.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 14px; color: #334155;">
          <strong>Status:</strong> Email delivery service is configured and operational!
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Sent on ${new Date().toLocaleString()}</p>
      </div>
    `;

    const result = await sendEmail({
      to: recipient,
      subject: "Test Email - Lunch Counter Notification",
      html: testHtml,
    });

    if (result.success && result.delivered) {
      return NextResponse.json({
        success: true,
        delivered: true,
        message: `Test email sent successfully to ${recipient}!`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          delivered: false,
          error: result.error || "Failed to deliver email.",
          instructions: "Please configure your SMTP Server details (Host, Port, User, Password) in System Settings or .env file.",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("POST send test email error:", error);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}
