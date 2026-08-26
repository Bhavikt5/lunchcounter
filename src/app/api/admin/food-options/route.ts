import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const foodOptions = await db.foodOption.findMany({
    orderBy: { type: "asc" },
  });
  return NextResponse.json({ foodOptions });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { id, name, price, status } = await req.json();

    const existing = await db.foodOption.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Food option not found" }, { status: 404 });
    }

    const newPrice = parseFloat(price);
    if (isNaN(newPrice) || newPrice <= 0) {
      return NextResponse.json({ error: "Please enter a valid price" }, { status: 400 });
    }

    const updated = await db.foodOption.update({
      where: { id },
      data: {
        name: name ? name.trim() : existing.name,
        price: newPrice,
        status: status || existing.status,
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_FOOD_PRICING",
      entity: "FOOD_OPTION",
      entityId: id,
      oldValue: `₹${existing.price}`,
      newValue: `₹${newPrice}`,
    });

    return NextResponse.json({ success: true, foodOption: updated });
  } catch (error) {
    console.error("PUT food option pricing error:", error);
    return NextResponse.json({ error: "Failed to update food option pricing" }, { status: 500 });
  }
}
