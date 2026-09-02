import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBookingCutoffStatus } from "@/lib/cutoff";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isHistory = searchParams.get("history") === "true";

  try {
    if (isHistory) {
      const userBookings = await db.lunchBooking.findMany({
        where: { userId: user.id },
        include: { foodOption: true, vendor: true },
        orderBy: { bookingDate: "desc" },
      });
      return NextResponse.json({ bookings: userBookings });
    }

    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    // Get user's booking for specific date
    const booking = await db.lunchBooking.findUnique({
      where: {
        userId_bookingDate: {
          userId: user.id,
          bookingDate: date,
        },
      },
      include: {
        foodOption: true,
        vendor: true,
      },
    });

    // Get cutoff status for date
    const cutoffStatus = await getBookingCutoffStatus(date);

    // Get food options
    const foodOptions = await db.foodOption.findMany({
      where: { status: "ACTIVE" },
    });

    // Get count of confirmed bookings for the current month
    const currentMonthPrefix = date.substring(0, 7); // e.g. "2026-09"
    const monthBookingCount = await db.lunchBooking.count({
      where: {
        userId: user.id,
        bookingDate: { startsWith: currentMonthPrefix },
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({
      booking,
      cutoffStatus,
      foodOptions,
      monthBookingCount,
      date,
    });
  } catch (error) {
    console.error("GET booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { foodOptionId, bookingDate } = await req.json();
    const dateStr = bookingDate || new Date().toISOString().split("T")[0];

    // Check cutoff rules
    const cutoff = await getBookingCutoffStatus(dateStr);
    if (!cutoff.isOpen) {
      return NextResponse.json({ error: cutoff.reason || "Lunch booking is closed for today." }, { status: 400 });
    }

    // Get active food option
    const foodOption = await db.foodOption.findUnique({
      where: { id: foodOptionId },
    });

    if (!foodOption || foodOption.status !== "ACTIVE") {
      return NextResponse.json({ error: "Selected food option is not available" }, { status: 400 });
    }

    // Get active vendor
    const activeVendor = await db.vendor.findFirst({
      where: { status: "ACTIVE" },
    });

    if (!activeVendor) {
      return NextResponse.json({ error: "No active vendor configured" }, { status: 400 });
    }

    // Check if user already booked
    const existingBooking = await db.lunchBooking.findUnique({
      where: {
        userId_bookingDate: {
          userId: user.id,
          bookingDate: dateStr,
        },
      },
    });

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let booking;

    if (existingBooking) {
      // Allow switching food type before cutoff
      booking = await db.lunchBooking.update({
        where: { id: existingBooking.id },
        data: {
          foodOptionId: foodOption.id,
          priceAtBooking: foodOption.price,
          status: "CONFIRMED",
          cancelledAt: null,
        },
        include: { foodOption: true },
      });

      await createAuditLog({
        userId: user.id,
        userName: user.name,
        action: "UPDATE_BOOKING",
        entity: "LUNCH_BOOKING",
        entityId: booking.id,
        oldValue: existingBooking.foodOptionId,
        newValue: foodOption.id,
      });
    } else {
      // Create new booking
      booking = await db.lunchBooking.create({
        data: {
          userId: user.id,
          vendorId: activeVendor.id,
          foodOptionId: foodOption.id,
          bookingDate: dateStr,
          priceAtBooking: foodOption.price,
          bookingTime: timeFormatted,
          status: "CONFIRMED",
        },
        include: { foodOption: true },
      });

      await createAuditLog({
        userId: user.id,
        userName: user.name,
        action: "CREATE_BOOKING",
        entity: "LUNCH_BOOKING",
        entityId: booking.id,
        newValue: `${foodOption.type} - ₹${foodOption.price}`,
      });
    }

    // Create user notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Lunch Booked Successfully",
        message: `Your ${foodOption.type === "VEG" ? "Veg" : "Non-Veg"} lunch for ${dateStr} has been booked.`,
        type: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      booking,
      message: "Lunch booked successfully",
    });
  } catch (error) {
    console.error("POST booking error:", error);
    return NextResponse.json({ error: "Failed to process lunch booking" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("id");
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    // Check cutoff rules
    const cutoff = await getBookingCutoffStatus(dateStr);
    if (!cutoff.isOpen) {
      return NextResponse.json({ error: "Cannot cancel lunch booking after cutoff time." }, { status: 400 });
    }

    let booking;
    if (bookingId) {
      booking = await db.lunchBooking.findUnique({ where: { id: bookingId } });
    } else {
      booking = await db.lunchBooking.findUnique({
        where: {
          userId_bookingDate: {
            userId: user.id,
            bookingDate: dateStr,
          },
        },
      });
    }

    if (!booking || booking.userId !== user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 });
    }

    const updatedBooking = await db.lunchBooking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "CANCEL_BOOKING",
      entity: "LUNCH_BOOKING",
      entityId: booking.id,
      oldValue: "CONFIRMED",
      newValue: "CANCELLED",
    });

    await db.notification.create({
      data: {
        userId: user.id,
        title: "Lunch Booking Cancelled",
        message: `Your lunch booking for ${booking.bookingDate} was cancelled.`,
        type: "INFO",
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Lunch booking cancelled successfully",
    });
  } catch (error) {
    console.error("DELETE booking error:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
