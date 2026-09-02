import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "daily"; // daily, weekly, monthly
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    if (type === "daily") {
      const bookings = await db.lunchBooking.findMany({
        where: { bookingDate: dateStr },
        include: { user: true, foodOption: true },
      });

      let vegCount = 0;
      let nonVegCount = 0;
      let cancelledCount = 0;
      let totalAmount = 0;

      bookings.forEach((b: any) => {
        if (b.status === "CONFIRMED") {
          totalAmount += b.priceAtBooking;
          if (b.foodOption.type === "VEG") vegCount++;
          if (b.foodOption.type === "NON_VEG") nonVegCount++;
        } else if (b.status === "CANCELLED") {
          cancelledCount++;
        }
      });

      return NextResponse.json({
        type: "daily",
        date: dateStr,
        metrics: {
          totalLunches: vegCount + nonVegCount,
          vegCount,
          nonVegCount,
          cancelledCount,
          totalAmount,
        },
        records: bookings,
      });
    }

    if (type === "weekly") {
      // Fetch bookings for last 30 days grouped by week
      const bookings = await db.lunchBooking.findMany({
        where: { status: "CONFIRMED" },
        include: { user: true, foodOption: true },
        orderBy: { bookingDate: "desc" },
      });

      const employeeStatsMap: Record<string, { employee: any; totalLunches: number; vegCount: number; nonVegCount: number; totalAmount: number }> = {};

      bookings.forEach((b: any) => {
        if (!b.user) return;
        if (!employeeStatsMap[b.userId]) {
          employeeStatsMap[b.userId] = {
            employee: b.user,
            totalLunches: 0,
            vegCount: 0,
            nonVegCount: 0,
            totalAmount: 0,
          };
        }
        const stat = employeeStatsMap[b.userId];
        stat.totalLunches++;
        stat.totalAmount += b.priceAtBooking;
        if (b.foodOption?.type === "VEG") stat.vegCount++;
        if (b.foodOption?.type === "NON_VEG") stat.nonVegCount++;
      });

      return NextResponse.json({
        type: "weekly",
        records: Object.values(employeeStatsMap),
      });
    }

    if (type === "monthly") {
      const bookings = await db.lunchBooking.findMany({
        where: { status: "CONFIRMED" },
        include: { foodOption: true, user: true },
      });

      let vegCount = 0;
      let nonVegCount = 0;
      let totalRevenue = 0;
      const uniqueEmployees = new Set<string>();

      bookings.forEach((b: any) => {
        totalRevenue += b.priceAtBooking;
        uniqueEmployees.add(b.userId);
        if (b.foodOption.type === "VEG") vegCount++;
        if (b.foodOption.type === "NON_VEG") nonVegCount++;
      });

      return NextResponse.json({
        type: "monthly",
        metrics: {
          totalLunches: bookings.length,
          vegCount,
          nonVegCount,
          totalRevenue,
          totalEmployeesUsingLunch: uniqueEmployees.size,
        },
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
