import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const employees = await db.user.findMany({
      orderBy: { employeeId: "asc" },
      include: {
        _count: {
          select: { bookings: true, bills: true },
        },
      },
    });

    // Compute total spending & unpaid bills for each employee
    const employeesWithStats = await Promise.all(
      employees.map(async (emp) => {
        const confirmedBookings = await db.lunchBooking.findMany({
          where: { userId: emp.id, status: "CONFIRMED" },
        });
        const totalSpent = confirmedBookings.reduce((sum, b) => sum + b.priceAtBooking, 0);

        const pendingBills = await db.bill.findMany({
          where: { userId: emp.id, status: "PENDING" },
        });
        const unpaidBillsAmount = pendingBills.reduce((sum, b) => sum + b.totalAmount, 0);

        const { passwordHash, ...safeUser } = emp;
        return {
          ...safeUser,
          totalLunches: confirmedBookings.length,
          totalSpent,
          unpaidBillsCount: pendingBills.length,
          unpaidBillsAmount,
        };
      })
    );

    return NextResponse.json({ employees: employeesWithStats });
  } catch (error) {
    console.error("GET employees error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { employeeId, name, email, phone, department, role, password } = await req.json();

    if (!employeeId || !name || !email || !password) {
      return NextResponse.json({ error: "Employee ID, Name, Email, and Password are required" }, { status: 400 });
    }

    const existingId = await db.user.findUnique({ where: { employeeId: employeeId.trim().toUpperCase() } });
    if (existingId) {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 400 });
    }

    const existingEmail = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newEmployee = await db.user.create({
      data: {
        employeeId: employeeId.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        department: department ? department.trim() : "General",
        role: role || "EMPLOYEE",
        passwordHash,
        status: "ACTIVE",
      },
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "CREATE_EMPLOYEE",
      entity: "USER",
      entityId: newEmployee.id,
      newValue: `${newEmployee.name} (${newEmployee.employeeId})`,
    });

    const { passwordHash: _, ...safeEmployee } = newEmployee;
    return NextResponse.json({ success: true, employee: safeEmployee });
  } catch (error) {
    console.error("POST employee error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { id, name, email, phone, department, role, status, newPassword } = await req.json();

    const emp = await db.user.findUnique({ where: { id } });
    if (!emp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (department) updateData.department = department.trim();
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (newPassword) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_EMPLOYEE",
      entity: "USER",
      entityId: id,
      oldValue: `${emp.name} (${emp.status})`,
      newValue: `${updated.name} (${updated.status})`,
    });

    const { passwordHash: _, ...safeEmployee } = updated;
    return NextResponse.json({ success: true, employee: safeEmployee });
  } catch (error) {
    console.error("PUT employee error:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}
