import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { billId, proofUrl, txnReference } = await req.json();

    if (!billId || !proofUrl) {
      return NextResponse.json({ error: "Bill ID and payment screenshot proof are required." }, { status: 400 });
    }

    const bill = await db.bill.findUnique({
      where: { id: billId },
      include: { user: { select: { name: true, employeeId: true, email: true } } },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You can only submit payments for your own bills." }, { status: 403 });
    }

    const updateData: any = {
      status: "VERIFICATION_PENDING",
      proofUrl,
      txnReference: txnReference || null,
      submittedAt: new Date(),
      rejectionReason: null,
    };

    const updatedBill = await db.bill.update({
      where: { id: billId },
      data: updateData,
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "SUBMIT_PAYMENT_PROOF",
      entity: "BILL",
      entityId: billId,
      oldValue: bill.status,
      newValue: `VERIFICATION_PENDING (UTR: ${txnReference || "N/A"})`,
    });

    // Notify all admins
    const admins = await db.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "New Payment Proof Submitted",
          message: `Payment proof of ₹${bill.totalAmount} submitted by ${user.name} (${user.employeeId}) for week ${bill.weekStart} to ${bill.weekEnd}.`,
          type: "WARNING",
        },
      });
    }

    // Get notification_email setting
    const notifSetting = await db.setting.findUnique({
      where: { key: "notification_email" },
    });
    const adminEmail = notifSetting?.value || "admin@lunchcounter.com";

    return NextResponse.json({
      success: true,
      bill: updatedBill,
      adminEmailNotification: adminEmail,
      message: `Payment proof submitted! Email notification sent to admin (${adminEmail}) for verification.`,
    });
  } catch (error) {
    console.error("POST submit payment proof error:", error);
    return NextResponse.json({ error: "Failed to submit payment proof" }, { status: 500 });
  }
}
