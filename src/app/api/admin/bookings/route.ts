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
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const search = searchParams.get("search") || "";
  const foodType = searchParams.get("foodType") || "ALL"; // ALL, VEG, NON_VEG
  const status = searchParams.get("status") || "ALL"; // ALL, CONFIRMED, CANCELLED

  try {
    const whereClause: any = {
      bookingDate: date,
    };

    if (foodType !== "ALL") {
      if (foodType === "VEG" || foodType === "NON_VEG") {
        whereClause.foodOption = { type: foodType };
      } else {
        whereClause.foodOptionId = foodType;
      }
    }

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (search.trim()) {
      const query = search.trim();
      whereClause.user = {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { employeeId: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { department: { contains: query, mode: "insensitive" } },
        ],
      };
    }

    const bookings = await db.lunchBooking.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, employeeId: true, email: true, department: true },
        },
        foodOption: true,
        vendor: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute metrics for the date
    const allTodayBookings = await db.lunchBooking.findMany({
      where: { bookingDate: date },
      include: { foodOption: true },
    });

    let totalConfirmed = 0;
    let vegCount = 0;
    let nonVegCount = 0;
    let cancelledCount = 0;
    let totalRevenue = 0;

    allTodayBookings.forEach((b: any) => {
      if (b.status === "CONFIRMED") {
        totalConfirmed++;
        totalRevenue += b.priceAtBooking;
        if (b.foodOption.type === "VEG") vegCount++;
        if (b.foodOption.type === "NON_VEG") nonVegCount++;
      } else if (b.status === "CANCELLED") {
        cancelledCount++;
      }
    });

    return NextResponse.json({
      date,
      bookings,
      summary: {
        totalConfirmed,
        vegCount,
        nonVegCount,
        cancelledCount,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("GET admin bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

// Admin manual booking override
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { userId, foodOptionId, bookingDate } = await req.json();
    const dateStr = bookingDate || new Date().toISOString().split("T")[0];

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const foodOption = await db.foodOption.findUnique({ where: { id: foodOptionId } });
    if (!foodOption) {
      return NextResponse.json({ error: "Food option not found" }, { status: 404 });
    }

    const activeVendor = await db.vendor.findFirst({ where: { status: "ACTIVE" } });
    if (!activeVendor) {
      return NextResponse.json({ error: "No active vendor found" }, { status: 404 });
    }

    const existing = await db.lunchBooking.findUnique({
      where: {
        userId_bookingDate: {
          userId,
          bookingDate: dateStr,
        },
      },
    });

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    let booking;
    if (existing) {
      booking = await db.lunchBooking.update({
        where: { id: existing.id },
        data: {
          foodOptionId: foodOption.id,
          priceAtBooking: foodOption.price,
          status: "CONFIRMED",
          cancelledAt: null,
          createdByAdmin: true,
        },
      });
    } else {
      booking = await db.lunchBooking.create({
        data: {
          userId,
          vendorId: activeVendor.id,
          foodOptionId: foodOption.id,
          bookingDate: dateStr,
          priceAtBooking: foodOption.price,
          bookingTime: timeFormatted,
          status: "CONFIRMED",
          createdByAdmin: true,
        },
      });
    }

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "ADMIN_MANUAL_BOOKING",
      entity: "LUNCH_BOOKING",
      entityId: booking.id,
      newValue: `Manual booking created for ${targetUser.name} (${foodOption.type}) on ${dateStr}`,
    });

    await db.notification.create({
      data: {
        userId: targetUser.id,
        title: "Lunch Booked by Admin",
        message: `Admin added a ${foodOption.type === "VEG" ? "Veg" : "Non-Veg"} lunch booking for you on ${dateStr}.`,
        type: "INFO",
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("POST admin manual booking error:", error);
    return NextResponse.json({ error: "Failed to create manual booking" }, { status: 500 });
  }
}

// Admin override status (e.g. cancel or confirm booking)
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { bookingId, status, foodOptionId } = await req.json();

    const booking = await db.lunchBooking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "CANCELLED") {
        updateData.cancelledAt = new Date();
      }
    }

    if (foodOptionId) {
      const food = await db.foodOption.findUnique({ where: { id: foodOptionId } });
      if (food) {
        updateData.foodOptionId = food.id;
        updateData.priceAtBooking = food.price;
      }
    }

    const updated = await db.lunchBooking.update({
      where: { id: bookingId },
      data: updateData,
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "ADMIN_OVERRIDE_BOOKING",
      entity: "LUNCH_BOOKING",
      entityId: bookingId,
      oldValue: booking.status,
      newValue: status || "UPDATED",
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("PUT admin override booking error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
