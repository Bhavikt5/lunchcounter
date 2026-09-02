import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ALL"; // ALL, PENDING, PAID
  const search = searchParams.get("search") || "";
  const weekStart = searchParams.get("weekStart") || "";

  try {
    const whereClause: any = {};

    // Employees only see their own bills
    if (user.role !== "ADMIN") {
      whereClause.userId = user.id;
    } else if (search.trim()) {
      const query = search.trim();
      whereClause.user = {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { employeeId: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      };
    }

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (weekStart) {
      whereClause.weekStart = weekStart;
    }

    const bills = await db.bill.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, employeeId: true, email: true, department: true } },
        items: true,
      },
      orderBy: { weekStart: "desc" },
    });

    let totalPendingAmount = 0;
    let totalPaidAmount = 0;
    let totalVerificationPendingAmount = 0;
    bills.forEach((b: any) => {
      if (b.status === "PENDING") totalPendingAmount += b.totalAmount;
      if (b.status === "VERIFICATION_PENDING") totalVerificationPendingAmount += b.totalAmount;
      if (b.status === "PAID") totalPaidAmount += b.totalAmount;
    });

    const settings = await db.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => (settingsMap[s.key] = s.value));

    return NextResponse.json({
      bills,
      paymentSettings: {
        upiId: settingsMap["payment_upi_id"] || "lunchcounter@upi",
        qrCode: settingsMap["payment_qr_code"] || "",
      },
      summary: {
        totalPendingAmount,
        totalVerificationPendingAmount,
        totalPaidAmount,
        count: bills.length,
      },
    });
  } catch (error) {
    console.error("GET bills error:", error);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}

// Mark bill as paid or verify/reject payment proof
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { billId, status, action, rejectionReason } = await req.json();

    const bill = await db.bill.findUnique({ where: { id: billId }, include: { user: true } });
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    let newStatus = status || "PAID";
    if (action === "APPROVE") newStatus = "PAID";
    if (action === "REJECT") newStatus = "REJECTED";

    const updateData: any = {
      status: newStatus,
      paidAt: newStatus === "PAID" ? new Date() : null,
      rejectionReason: newStatus === "REJECTED" ? rejectionReason || "Payment proof verification failed." : null,
    };

    const updated = await db.bill.update({
      where: { id: billId },
      data: updateData,
      include: { user: true, items: true },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "VERIFY_BILL_PAYMENT",
      entity: "BILL",
      entityId: billId,
      oldValue: bill.status,
      newValue: newStatus,
    });

    if (newStatus === "PAID") {
      await db.notification.create({
        data: {
          userId: bill.userId,
          title: "Payment Approved & Bill Paid",
          message: `Your payment of ₹${bill.totalAmount} for week ${bill.weekStart} to ${bill.weekEnd} has been verified and marked as PAID.`,
          type: "SUCCESS",
        },
      });
    } else if (newStatus === "REJECTED") {
      await db.notification.create({
        data: {
          userId: bill.userId,
          title: "Payment Proof Rejected",
          message: `Your payment proof for week ${bill.weekStart} to ${bill.weekEnd} was rejected. Reason: ${rejectionReason || "Verification failed"}. Please re-submit proof.`,
          type: "WARNING",
        },
      });
    }

    return NextResponse.json({ success: true, bill: updated });
  } catch (error) {
    console.error("PUT mark bill paid error:", error);
    return NextResponse.json({ error: "Failed to update bill status" }, { status: 500 });
  }
}
