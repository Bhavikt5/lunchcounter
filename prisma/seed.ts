import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Lunch Counter database seed...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.vendorOrder.deleteMany();
  await prisma.lunchBooking.deleteMany();
  await prisma.foodOption.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.holiday.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      employeeId: "EMP001",
      name: "Admin User",
      email: "admin@lunchcounter.com",
      phone: "+91 98000 00001",
      department: "Administration",
      role: "ADMIN",
      passwordHash,
      status: "ACTIVE",
    },
  });

  // 2. Create 10 Employees
  const employeesData = [
    { employeeId: "EMP002", name: "Rahul Sharma", email: "rahul@company.com", phone: "+91 98000 00002", department: "Engineering" },
    { employeeId: "EMP003", name: "Amit Patel", email: "amit@company.com", phone: "+91 98000 00003", department: "Sales" },
    { employeeId: "EMP004", name: "Priya Verma", email: "priya@company.com", phone: "+91 98000 00004", department: "HR" },
    { employeeId: "EMP005", name: "Sneha Reddy", email: "sneha@company.com", phone: "+91 98000 00005", department: "Marketing" },
    { employeeId: "EMP006", name: "Vikram Malhotra", email: "vikram@company.com", phone: "+91 98000 00006", department: "Engineering" },
    { employeeId: "EMP007", name: "Ananya Joshi", email: "ananya@company.com", phone: "+91 98000 00007", department: "Finance" },
    { employeeId: "EMP008", name: "Rajesh Kumar", email: "rajesh@company.com", phone: "+91 98000 00008", department: "Operations" },
    { employeeId: "EMP009", name: "Neha Gupta", email: "neha@company.com", phone: "+91 98000 00009", department: "Product" },
    { employeeId: "EMP010", name: "Siddharth Mehta", email: "siddharth@company.com", phone: "+91 98000 00010", department: "Design" },
    { employeeId: "EMP011", name: "Pooja Nair", email: "pooja@company.com", phone: "+91 98000 00011", department: "Operations" },
  ];

  const employees = [];
  for (const emp of employeesData) {
    const user = await prisma.user.create({
      data: {
        ...emp,
        role: "EMPLOYEE",
        passwordHash,
        status: "ACTIVE",
      },
    });
    employees.push(user);
  }

  // 3. Create Vendor
  const vendor = await prisma.vendor.create({
    data: {
      name: "Green Leaf Caterers",
      contactPerson: "Suresh Kumar",
      phone: "+91 98765 43210",
      email: "orders@greenleafcaterers.com",
      address: "123 Industrial Park, Block B, Tech Hub",
      status: "ACTIVE",
    },
  });

  // 4. Create Food Options
  const vegOption = await prisma.foodOption.create({
    data: {
      name: "Standard Veg Thali",
      type: "VEG",
      price: 80.0,
      status: "ACTIVE",
    },
  });

  const nonVegOption = await prisma.foodOption.create({
    data: {
      name: "Special Non-Veg Thali",
      type: "NON_VEG",
      price: 100.0,
      status: "ACTIVE",
    },
  });

  // 5. System Settings
  await prisma.setting.createMany({
    data: [
      { key: "cutoff_time", value: "11:00" },
      { key: "manual_cutoff_closed", value: "false" },
      { key: "company_name", value: "Lunch Counter" },
      { key: "currency", value: "₹" },
      { key: "working_days", value: "Mon,Tue,Wed,Thu,Fri" },
      { key: "default_vendor_id", value: vendor.id },
    ],
  });

  // 6. Holidays
  await prisma.holiday.createMany({
    data: [
      { name: "Independence Day", date: "2026-08-15", description: "National Holiday" },
      { name: "Gandhi Jayanti", date: "2026-10-02", description: "National Holiday" },
      { name: "Christmas Day", date: "2026-12-25", description: "Public Holiday" },
    ],
  });

  // 7. Seed Previous Week Bookings (Aug 17 - Aug 21, 2026) & Bill
  const prevWeekDays = [
    "2026-08-17",
    "2026-08-18",
    "2026-08-19",
    "2026-08-20",
    "2026-08-21",
  ];

  for (const emp of employees.slice(0, 7)) {
    let empTotalAmount = 0;
    let empLunchesCount = 0;
    const createdBookingIds = [];

    for (let i = 0; i < prevWeekDays.length; i++) {
      const dateStr = prevWeekDays[i];
      // Randomly pick veg or non-veg, occasionally skip
      if ((emp.employeeId === "EMP002" && i === 4) || (emp.employeeId === "EMP003" && i === 2)) {
        // skipped
        continue;
      }

      const isNonVeg = (i + emp.name.length) % 2 === 0;
      const option = isNonVeg ? nonVegOption : vegOption;

      const booking = await prisma.lunchBooking.create({
        data: {
          userId: emp.id,
          vendorId: vendor.id,
          foodOptionId: option.id,
          bookingDate: dateStr,
          priceAtBooking: option.price,
          bookingTime: `09:${15 + i * 5} AM`,
          status: "CONFIRMED",
        },
      });

      empTotalAmount += option.price;
      empLunchesCount += 1;
      createdBookingIds.push({ booking, option });
    }

    // Create bill for previous week
    if (empLunchesCount > 0) {
      const billStatus = emp.employeeId === "EMP002" || emp.employeeId === "EMP004" ? "PAID" : "PENDING";
      const bill = await prisma.bill.create({
        data: {
          userId: emp.id,
          weekStart: "2026-08-17",
          weekEnd: "2026-08-21",
          totalLunches: empLunchesCount,
          totalAmount: empTotalAmount,
          status: billStatus,
          paidAt: billStatus === "PAID" ? new Date("2026-08-21T17:00:00Z") : null,
        },
      });

      for (const item of createdBookingIds) {
        await prisma.billItem.create({
          data: {
            billId: bill.id,
            bookingId: item.booking.id,
            bookingDate: item.booking.bookingDate,
            foodType: item.option.type,
            amount: item.option.price,
          },
        });
      }
    }
  }

  // 8. Seed Current Week Bookings (Aug 24 Mon, Aug 25 Tue, Aug 26 Wed - Today)
  const currentWeekDays = [
    { date: "2026-08-24", time: "09:30 AM" },
    { date: "2026-08-25", time: "09:45 AM" },
    { date: "2026-08-26", time: "10:15 AM" },
  ];

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];

    for (const day of currentWeekDays) {
      // 80% employees book
      if ((i + day.date.length) % 5 === 0) continue;

      const isNonVeg = (i + day.date.charCodeAt(9)) % 2 === 0;
      const option = isNonVeg ? nonVegOption : vegOption;

      // Make 1 cancelled booking for testing
      const isCancelled = day.date === "2026-08-26" && emp.employeeId === "EMP008";

      await prisma.lunchBooking.create({
        data: {
          userId: emp.id,
          vendorId: vendor.id,
          foodOptionId: option.id,
          bookingDate: day.date,
          priceAtBooking: option.price,
          bookingTime: day.time,
          status: isCancelled ? "CANCELLED" : "CONFIRMED",
          cancelledAt: isCancelled ? new Date() : null,
        },
      });
    }
  }

  // 9. Initial Audit Log & Notification
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      action: "SYSTEM_INIT",
      entity: "SYSTEM",
      newValue: "Lunch Counter system initialized with seed data",
    },
  });

  await prisma.notification.create({
    data: {
      userId: employees[0].id,
      title: "Welcome to Lunch Counter",
      message: "You can now book your daily lunch before 11:00 AM every weekday.",
      type: "INFO",
    },
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
