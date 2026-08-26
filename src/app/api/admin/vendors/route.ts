import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const vendors = await db.vendor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { bookings: true, orders: true },
      },
    },
  });
  return NextResponse.json({ vendors });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { name, contactPerson, phone, email, address, status } = await req.json();

    if (!name || !contactPerson || !phone || !email || !address) {
      return NextResponse.json({ error: "All vendor fields are required" }, { status: 400 });
    }

    const vendor = await db.vendor.create({
      data: {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        status: status || "ACTIVE",
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "CREATE_VENDOR",
      entity: "VENDOR",
      entityId: vendor.id,
      newValue: vendor.name,
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error("POST vendor error:", error);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { id, name, contactPerson, phone, email, address, status } = await req.json();

    const existing = await db.vendor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const vendor = await db.vendor.update({
      where: { id },
      data: {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        status,
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_VENDOR",
      entity: "VENDOR",
      entityId: vendor.id,
      oldValue: existing.name,
      newValue: vendor.name,
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error("PUT vendor error:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}
