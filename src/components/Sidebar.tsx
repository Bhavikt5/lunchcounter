"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  Calendar,
  Receipt,
  User,
  ShoppingBag,
  Users,
  Store,
  Sliders,
  FileText,
  CalendarDays,
  Settings,
  History,
  X,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  userRole: "ADMIN" | "EMPLOYEE";
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ userRole, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  interface NavLinkItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const employeeLinks: NavLinkItem[] = [
    { name: "Today's Lunch", href: "/dashboard", icon: Utensils },
    { name: "Book Lunch", href: "/book-lunch", icon: Calendar },
    { name: "My Bookings", href: "/my-bookings", icon: History },
    { name: "My Bills", href: "/my-bills", icon: Receipt },
    { name: "My Profile", href: "/profile", icon: User },
  ];

  const adminLinks: NavLinkItem[] = [
    { name: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Today's Bookings", href: "/admin/bookings", icon: Utensils },
    { name: "Vendor Order", href: "/admin/vendor-order", icon: ShoppingBag, badge: "11 AM" },
    { name: "Weekly Billing", href: "/admin/bills", icon: Receipt },
    { name: "Employee Directory", href: "/admin/employees", icon: Users },
    { name: "Vendor Management", href: "/admin/vendors", icon: Store },
    { name: "Food & Pricing", href: "/admin/food-options", icon: Sliders },
    { name: "Reports & Analytics", href: "/admin/reports", icon: FileText },
    { name: "Holiday Manager", href: "/admin/holidays", icon: CalendarDays },
    { name: "System Settings", href: "/admin/settings", icon: Settings },
    { name: "Audit Trail", href: "/admin/audit-logs", icon: History },
  ];

  const navLinks = userRole === "ADMIN" ? adminLinks : employeeLinks;

  const content = (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-xl">
      <div>
        {/* Mobile Header Close */}
        <div className="flex items-center justify-between md:hidden mb-6 pb-4 border-b border-slate-800">
          <span className="font-bold text-white text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" /> Navigation
          </span>
          <button onClick={onCloseMobile} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Label */}
        <div className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {userRole === "ADMIN" ? "Admin Portal" : "Employee Portal"}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "hover:bg-slate-800 hover:text-white text-slate-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-blue-700 text-white" : "bg-slate-800 text-blue-400 border border-slate-700"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Card */}
      <div className="mt-8 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
          <span>Role</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${userRole === "ADMIN" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"}`}>
            {userRole}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          {userRole === "ADMIN"
            ? "You have admin privileges to edit pricing, generate orders, and mark bills."
            : "Default cutoff is 11:00 AM. Select Veg or Non-Veg."}
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">{content}</div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10">{content}</div>
        </div>
      )}
    </>
  );
}
