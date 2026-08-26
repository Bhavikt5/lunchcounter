# 🍱 Lunch Counter - Employee Lunch & Vendor Order System

A modern, responsive internal web application built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **SQLite**. It completely automates employee lunch bookings, 11:00 AM vendor order calculations, daily Veg/Non-Veg counts, weekly employee billing, and administrative governance.

---

## 🚀 Key Features

### 👤 Employee Portal
- **Dashboard**: View today's date, live cutoff status (11:00 AM default), and select Veg (₹80) or Non-Veg (₹100) meals.
- **Booking & Cutoff Enforcement**: Book or cancel lunch before 11:00 AM. Automatically freezes bookings after cutoff.
- **Food Type Switching**: Switch Veg ↔ Non-Veg before cutoff. Prevents duplicate bookings on the same day.
- **My Bookings History**: Searchable and filterable table of past and upcoming lunch bookings.
- **My Bills & Itemized Breakdown**: View weekly/monthly bills, payment status (`Paid` / `Pending`), and itemized daily breakdown drawer.
- **1-Click Demo Login Switcher**: Instantly log in as any seeded employee or admin.

### 🛡️ Admin Portal
- **Executive KPI Dashboard**: Live metrics for Today's Total Lunches (42), Veg (28), Non-Veg (14), Expected Revenue (₹3,640), Vendor Order status, and Pending Bills total.
- **Cutoff Controls**: Instantly Close Booking Now, Reopen Booking, or adjust daily cutoff time.
- **Employee Booking Table**: Search employees, filter Veg/Non-Veg, filter status, sort, paginate, and add manual admin bookings post-cutoff.
- **Vendor Order Generator**:
  - Automatically calculates: `28 Veg Lunches`, `14 Non-Veg Lunches`, `Total: 42 Lunches`.
  - Actions: **Copy Order Summary**, **Download CSV**, **Download PDF / Print**, and **Mark Order as Sent** (with timestamp).
  - Outdated Order Warning: Warns admin if bookings change after an order has been marked as sent.
- **Weekly Billing Generator**: Select week date range and click **Generate Weekly Bills** to calculate totals, store bills in database, and prevent duplicate weekly bill creation.
- **Payment Status Manager**: Filter bills by status and click **Mark as Paid** with timestamp recording.
- **Employee Directory Management**: Add, edit, disable employees, reset passwords, and view total spending & unpaid bill alerts per employee.
- **Vendor Management**: CRUD vendor contact info, address, and active status.
- **Food & Pricing Management**: Configure Veg and Non-Veg prices. Enforces **Price Freeze Policy** (price changes apply to future bookings only; past bookings retain historical price at booking time).
- **Reports & Analytics**: Daily, Weekly, and Monthly reports with CSV exports.
- **Holiday Manager**: Manage company holidays to automatically disable lunch bookings.
- **System Settings & Audit Trail**: Configurable company name, currency symbol, working days, and full administrative audit logging.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js API Routes (Route Handlers), JWT Session Authentication (`lunch_session` HTTP-only cookie).
- **Database & ORM**: Prisma ORM with SQLite database file (`prisma/dev.db`). Zero external database installation required!

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js v18+ (Node v24 tested)
- npm or yarn

### 2. Installation
```bash
# Install dependencies
npm install
```

### 3. Database Initialization & Seeding
```bash
# Push database schema to dev.db
npm run db:push

# Seed realistic demo data (10 employees, 1 admin, 1 vendor, Veg/Non-Veg pricing, historical bookings, and bills)
npm run db:seed
```

### 4. Running Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Seed Credentials

| Role | Name | Email / Login | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Admin User | `admin@lunchcounter.com` | `password123` |
| **Employee** | Rahul Sharma | `rahul@company.com` | `password123` |
| **Employee** | Amit Patel | `amit@company.com` | `password123` |
| **Employee** | Priya Verma | `priya@company.com` | `password123` |
| **Employee** | Sneha Reddy | `sneha@company.com` | `password123` |

*(You can also use the 1-Click Quick Demo Login buttons on `/login` to sign in instantly!)*

---

## 📄 License
Internal Company Tool - All Rights Reserved.
