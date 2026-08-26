import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { weekStart, weekEnd } = await req.json();

    if (!weekStart || !weekEnd) {
      return NextResponse.json({ error: "Week start and week end dates are required" }, { status: 400 });
    }

    // Find all confirmed bookings in the date range
    const bookings = await db.lunchBooking.findMany({
      where: {
        bookingDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: "CONFIRMED",
      },
      include: {
        foodOption: true,
        user: true,
      },
      orderBy: { bookingDate: "asc" },
    });

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: "No confirmed lunch bookings found for the selected date range." },
        { status: 400 }
      );
    }

    // Group bookings by user
    const userBookingsMap: Record<string, typeof bookings> = {};
    bookings.forEach((b: any) => {
      if (!userBookingsMap[b.userId]) {
        userBookingsMap[b.userId] = [];
      }
      userBookingsMap[b.userId].push(b);
    });

    const generatedBills = [];
    const skippedUsers = [];

    for (const [userId, userBookings] of Object.entries(userBookingsMap)) {
      // Check if bill already exists for this user and weekStart
      const existingBill = await db.bill.findUnique({
        where: {
          userId_weekStart: {
            userId,
            weekStart,
          },
        },
      });

      if (existingBill) {
        skippedUsers.push(userBookings[0].user.name);
        continue;
      }

      let totalAmount = 0;
      userBookings.forEach((b: any) => (totalAmount += b.priceAtBooking));
      const totalLunches = userBookings.length;

      const bill = await db.bill.create({
        data: {
          userId,
          weekStart,
          weekEnd,
          totalLunches,
          totalAmount,
          status: "PENDING",
          items: {
            create: userBookings.map((b: any) => ({
              bookingId: b.id,
              bookingDate: b.bookingDate,
              foodType: b.foodOption.type,
              amount: b.priceAtBooking,
            })),
          },
        },
        include: { user: true, items: true },
      });

      generatedBills.push(bill);

      // Create notification for employee
      await db.notification.create({
        data: {
          userId,
          title: "Weekly Lunch Bill Generated",
          message: `Your lunch bill for ${weekStart} to ${weekEnd} is ₹${totalAmount} (${totalLunches} lunches).`,
          type: "INFO",
        },
      });
    }

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "GENERATE_WEEKLY_BILLS",
      entity: "BILL",
      newValue: `Generated ${generatedBills.length} bills for week ${weekStart} to ${weekEnd}. Skipped ${skippedUsers.length} duplicates.`,
    });

    return NextResponse.json({
      success: true,
      generatedCount: generatedBills.length,
      skippedCount: skippedUsers.length,
      skippedUsers,
      bills: generatedBills,
      message: `Successfully generated ${generatedBills.length} weekly bill(s).`,
    });
  } catch (error) {
    console.error("POST generate weekly bills error:", error);
    return NextResponse.json({ error: "Failed to generate weekly bills" }, { status: 500 });
  }
}
