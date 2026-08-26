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
    } else if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search } },
          { employeeId: { contains: search } },
          { email: { contains: search } },
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
    bills.forEach((b: any) => {
      if (b.status === "PENDING") totalPendingAmount += b.totalAmount;
      if (b.status === "PAID") totalPaidAmount += b.totalAmount;
    });

    return NextResponse.json({
      bills,
      summary: {
        totalPendingAmount,
        totalPaidAmount,
        count: bills.length,
      },
    });
  } catch (error) {
    console.error("GET bills error:", error);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}

// Mark bill as paid
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { billId, status } = await req.json();

    const bill = await db.bill.findUnique({ where: { id: billId }, include: { user: true } });
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const newStatus = status || "PAID";
    const updated = await db.bill.update({
      where: { id: billId },
      data: {
        status: newStatus,
        paidAt: newStatus === "PAID" ? new Date() : null,
      },
      include: { user: true, items: true },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_BILL_STATUS",
      entity: "BILL",
      entityId: billId,
      oldValue: bill.status,
      newValue: newStatus,
    });

    if (newStatus === "PAID") {
      await db.notification.create({
        data: {
          userId: bill.userId,
          title: "Bill Marked as Paid",
          message: `Your lunch bill for week ${bill.weekStart} to ${bill.weekEnd} (₹${bill.totalAmount}) has been marked as paid.`,
          type: "SUCCESS",
        },
      });
    }

    return NextResponse.json({ success: true, bill: updated });
  } catch (error) {
    console.error("PUT mark bill paid error:", error);
    return NextResponse.json({ error: "Failed to update bill status" }, { status: 500 });
  }
}
