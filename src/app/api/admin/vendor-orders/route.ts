import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const activeVendor = await db.vendor.findFirst({
      where: { status: "ACTIVE" },
    });

    if (!activeVendor) {
      return NextResponse.json({ error: "No active vendor configured" }, { status: 404 });
    }

    // Get current real-time counts from lunch_bookings table
    const confirmedBookings = await db.lunchBooking.findMany({
      where: {
        bookingDate: dateStr,
        status: "CONFIRMED",
      },
      include: {
        user: { select: { name: true, employeeId: true, department: true } },
        foodOption: true,
      },
    });

    let currentVegCount = 0;
    let currentNonVegCount = 0;
    let currentTotalAmount = 0;

    confirmedBookings.forEach((b: any) => {
      currentTotalAmount += b.priceAtBooking;
      if (b.foodOption.type === "VEG") currentVegCount++;
      if (b.foodOption.type === "NON_VEG") currentNonVegCount++;
    });

    const currentTotalCount = confirmedBookings.length;

    // Check saved vendor order record
    const vendorOrder = await db.vendorOrder.findUnique({
      where: {
        vendorId_orderDate: {
          vendorId: activeVendor.id,
          orderDate: dateStr,
        },
      },
      include: { vendor: true },
    });

    let isOutdated = false;
    if (vendorOrder && vendorOrder.status === "SENT") {
      if (
        vendorOrder.vegCount !== currentVegCount ||
        vendorOrder.nonVegCount !== currentNonVegCount ||
        vendorOrder.totalCount !== currentTotalCount
      ) {
        isOutdated = true;
      }
    }

    return NextResponse.json({
      date: dateStr,
      vendor: activeVendor,
      vendorOrder,
      currentCounts: {
        vegCount: currentVegCount,
        nonVegCount: currentNonVegCount,
        totalCount: currentTotalCount,
        totalAmount: currentTotalAmount,
        bookings: confirmedBookings,
      },
      isOutdated,
    });
  } catch (error) {
    console.error("GET vendor order error:", error);
    return NextResponse.json({ error: "Failed to fetch vendor order" }, { status: 500 });
  }
}

// Generate / Freeze Vendor Order Snapshot
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { date } = await req.json();
    const dateStr = date || new Date().toISOString().split("T")[0];

    const activeVendor = await db.vendor.findFirst({
      where: { status: "ACTIVE" },
    });

    if (!activeVendor) {
      return NextResponse.json({ error: "No active vendor configured" }, { status: 404 });
    }

    const confirmedBookings = await db.lunchBooking.findMany({
      where: {
        bookingDate: dateStr,
        status: "CONFIRMED",
      },
      include: {
        foodOption: true,
        user: { select: { name: true, employeeId: true } },
      },
    });

    let vegCount = 0;
    let nonVegCount = 0;
    let totalAmount = 0;

    confirmedBookings.forEach((b: any) => {
      totalAmount += b.priceAtBooking;
      if (b.foodOption.type === "VEG") vegCount++;
      if (b.foodOption.type === "NON_VEG") nonVegCount++;
    });

    const totalCount = confirmedBookings.length;
    const snapshotJson = JSON.stringify(confirmedBookings);

    const vendorOrder = await db.vendorOrder.upsert({
      where: {
        vendorId_orderDate: {
          vendorId: activeVendor.id,
          orderDate: dateStr,
        },
      },
      update: {
        vegCount,
        nonVegCount,
        totalCount,
        totalAmount,
        snapshotJson,
      },
      create: {
        vendorId: activeVendor.id,
        orderDate: dateStr,
        vegCount,
        nonVegCount,
        totalCount,
        totalAmount,
        snapshotJson,
        status: "DRAFT",
      },
      include: { vendor: true },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "GENERATE_VENDOR_ORDER",
      entity: "VENDOR_ORDER",
      entityId: vendorOrder.id,
      newValue: `Generated Vendor Order: ${vegCount} Veg, ${nonVegCount} Non-Veg (Total: ${totalCount})`,
    });

    return NextResponse.json({ success: true, vendorOrder });
  } catch (error) {
    console.error("POST generate vendor order error:", error);
    return NextResponse.json({ error: "Failed to generate vendor order" }, { status: 500 });
  }
}

// Mark Vendor Order as Sent
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { orderId } = await req.json();

    const order = await db.vendorOrder.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Vendor order not found" }, { status: 404 });
    }

    const updated = await db.vendorOrder.update({
      where: { id: orderId },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
      include: { vendor: true },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "MARK_VENDOR_ORDER_SENT",
      entity: "VENDOR_ORDER",
      entityId: orderId,
      oldValue: order.status,
      newValue: "SENT",
    });

    return NextResponse.json({ success: true, vendorOrder: updated });
  } catch (error) {
    console.error("PUT mark vendor order sent error:", error);
    return NextResponse.json({ error: "Failed to mark order as sent" }, { status: 500 });
  }
}
