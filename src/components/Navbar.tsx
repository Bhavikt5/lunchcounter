"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Clock,
  CheckCircle2,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useToast } from "./Toast";

interface NavbarProps {
  user: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    role: "ADMIN" | "EMPLOYEE";
    department: string;
  } | null;
  onMobileMenuToggle?: () => void;
}

export function Navbar({ user, onMobileMenuToggle }: NavbarProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [cutoffStatus, setCutoffStatus] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchCutoffStatus();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCutoffStatus = async () => {
    try {
      const res = await fetch("/api/admin/cutoff");
      if (res.ok) {
        const data = await res.json();
        setCutoffStatus(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PUT", body: JSON.stringify({}) });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast("Notifications marked as read", "info");
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      showToast("Logged out successfully", "success");
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-4">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <Link href={user?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                Lunch Counter
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                  v1.0
                </span>
              </span>
              <p className="text-xs text-slate-500 hidden sm:block">Employee Lunch & Vendor Order System</p>
            </div>
          </Link>
        </div>

        {/* Center: Live Cutoff Status Badge */}
        {cutoffStatus && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-white/80 shadow-2xs">
            <Clock className={`w-3.5 h-3.5 ${cutoffStatus.isOpen ? "text-blue-600" : "text-red-500"}`} />
            <span className="text-slate-600">
              Cutoff: <strong className="text-slate-900">{cutoffStatus.cutoffTime} AM</strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                cutoffStatus.isOpen
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {cutoffStatus.isOpen ? "Open" : "Closed"}
            </span>
          </div>
        )}

        {/* Right: Notification Bell & User Dropdown */}
        {user && (
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" /> Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 text-xs transition-colors ${!n.read ? "bg-blue-50/50 font-medium" : "hover:bg-slate-50"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/80 bg-white"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-slate-900 leading-none">{user.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                    {user.role === "ADMIN" ? (
                      <span className="text-amber-600 font-bold flex items-center gap-0.5">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span>{user.department}</span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <p className="text-[10px] font-mono text-blue-600 mt-0.5">ID: {user.employeeId}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href={user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"}
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <UtensilsCrossed className="w-4 h-4 text-slate-400" /> Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" /> Profile & Account
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
