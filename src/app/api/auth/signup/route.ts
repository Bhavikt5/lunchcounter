import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, setSessionCookie } from "@/lib/auth";

async function generateEmployeeId(): Promise<string> {
  const lastUser = await db.user.findFirst({
    orderBy: { employeeId: "desc" },
  });

  let nextNumber = 1;
  if (lastUser) {
    const match = lastUser.employeeId.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  const employeeId = `EMP${String(nextNumber).padStart(3, "0")}`;

  // Guard against a collision (e.g. non-sequential existing IDs) by probing forward.
  const exists = await db.user.findUnique({ where: { employeeId } });
  if (exists) {
    let n = nextNumber + 1;
    while (await db.user.findUnique({ where: { employeeId: `EMP${String(n).padStart(3, "0")}` } })) {
      n += 1;
    }
    return `EMP${String(n).padStart(3, "0")}`;
  }

  return employeeId;
}

export async function POST(req: Request) {
  try {
    const { name, email, phone, department, password } = await req.json();

    if (!name || !email || !password || !department) {
      return NextResponse.json(
        { error: "Name, email, department, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingEmail = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const employeeId = await generateEmployeeId();
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        employeeId,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        department: department.trim(),
        role: "EMPLOYEE",
        passwordHash,
        status: "ACTIVE",
      },
    });

    const sessionUser = {
      id: newUser.id,
      employeeId: newUser.employeeId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as "ADMIN" | "EMPLOYEE",
      department: newUser.department,
    };

    const token = signToken(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
