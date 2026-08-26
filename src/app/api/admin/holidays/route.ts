import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const holidays = await db.holiday.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ holidays });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { name, date, description } = await req.json();

    if (!name || !date) {
      return NextResponse.json({ error: "Holiday Name and Date are required" }, { status: 400 });
    }

    const existing = await db.holiday.findUnique({ where: { date } });
    if (existing) {
      return NextResponse.json({ error: `Holiday already exists on date ${date}` }, { status: 400 });
    }

    const holiday = await db.holiday.create({
      data: {
        name: name.trim(),
        date: date.trim(),
        description: description ? description.trim() : null,
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "CREATE_HOLIDAY",
      entity: "HOLIDAY",
      entityId: holiday.id,
      newValue: `${holiday.name} on ${holiday.date}`,
    });

    return NextResponse.json({ success: true, holiday });
  } catch (error) {
    console.error("POST holiday error:", error);
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Holiday ID is required" }, { status: 400 });
  }

  try {
    const holiday = await db.holiday.findUnique({ where: { id } });
    if (!holiday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    await db.holiday.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "DELETE_HOLIDAY",
      entity: "HOLIDAY",
      entityId: id,
      oldValue: `${holiday.name} on ${holiday.date}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE holiday error:", error);
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 });
  }
}
