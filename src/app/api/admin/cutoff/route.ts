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
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const cutoffStatus = await getBookingCutoffStatus(date);
  return NextResponse.json(cutoffStatus);
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { orderStartTime, cutoffTime, manualClosed } = await req.json();

    if (orderStartTime !== undefined) {
      await db.setting.upsert({
        where: { key: "order_start_time" },
        update: { value: orderStartTime },
        create: { key: "order_start_time", value: orderStartTime },
      });
    }

    if (cutoffTime !== undefined) {
      await db.setting.upsert({
        where: { key: "cutoff_time" },
        update: { value: cutoffTime },
        create: { key: "cutoff_time", value: cutoffTime },
      });
    }

    if (manualClosed !== undefined) {
      await db.setting.upsert({
        where: { key: "manual_cutoff_closed" },
        update: { value: String(manualClosed) },
        create: { key: "manual_cutoff_closed", value: String(manualClosed) },
      });
    }

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_CUTOFF_SETTINGS",
      entity: "SETTING",
      newValue: `Start: ${orderStartTime ?? "unchanged"}, Cutoff: ${cutoffTime ?? "unchanged"}, Manual Closed: ${manualClosed ?? "unchanged"}`,
    });

    const updatedCutoffStatus = await getBookingCutoffStatus();
    return NextResponse.json({ success: true, cutoffStatus: updatedCutoffStatus });
  } catch (error) {
    console.error("PUT cutoff error:", error);
    return NextResponse.json({ error: "Failed to update cutoff setting" }, { status: 500 });
  }
}
