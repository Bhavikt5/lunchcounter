"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Utensils,
  Leaf,
  Drumstick,
  DollarSign,
  ShoppingBag,
  Receipt,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus,
  Lock,
  Unlock,
  AlertCircle,
} from "lucide-react";
import { CutoffBanner } from "@/components/CutoffBanner";
import { useToast } from "@/components/Toast";

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [vendorOrderData, setVendorOrderData] = useState<any>(null);
  const [cutoffStatus, setCutoffStatus] = useState<any>(null);
  const [billsSummary, setBillsSummary] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const fetchAdminDashboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch Today's Bookings summary
      const bookingsRes = await fetch(`/api/admin/bookings?date=${todayStr}`);
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setSummaryData(data);
      }

      // 2. Fetch Vendor order status
      const orderRes = await fetch(`/api/admin/vendor-orders?date=${todayStr}`);
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setVendorOrderData(orderData);
      }

      // 3. Fetch Cutoff status
      const cutoffRes = await fetch(`/api/admin/cutoff?date=${todayStr}`);
      if (cutoffRes.ok) {
        const cutoffData = await cutoffRes.json();
        setCutoffStatus(cutoffData);
      }

      // 4. Fetch Bills summary
      const billsRes = await fetch("/api/admin/bills");
      if (billsRes.ok) {
        const bData = await billsRes.json();
        setBillsSummary(bData.summary);
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading admin dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-32" />
      </div>
    );
  }

  const summary = summaryData?.summary || { totalConfirmed: 0, vegCount: 0, nonVegCount: 0, cancelledCount: 0, totalRevenue: 0 };
  const orderSent = vendorOrderData?.vendorOrder?.status === "SENT";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-blue-600" /> Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">Live monitoring, cutoff controls, vendor orders, and billing overview.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/vendor-order"
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4 text-blue-400" /> Vendor Order (11 AM)
          </Link>
          <Link
            href="/admin/bills"
            className="px-4 py-2 gradient-blue text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" /> Generate Bills
          </Link>
        </div>
      </div>

      {/* Cutoff Control Banner */}
      <CutoffBanner cutoffStatus={cutoffStatus} isAdmin={true} onStatusChange={fetchAdminDashboard} />

      {/* KPI Stat Cards (Prompt #32 Business Dashboard KPI) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Today's Lunch</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-1">
            <Utensils className="w-5 h-5 text-blue-600" /> {summary.totalConfirmed}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase">Veg</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
            <Leaf className="w-5 h-5 text-emerald-600" /> {summary.vegCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-orange-200 bg-orange-50/30 shadow-2xs">
          <div className="text-[11px] font-bold text-orange-700 uppercase">Non-Veg</div>
          <div className="text-2xl font-extrabold text-orange-700 mt-1 flex items-center gap-1">
            <Drumstick className="w-5 h-5 text-orange-600" /> {summary.nonVegCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Expected Amount</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{summary.totalRevenue}</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Vendor Order</div>
          <div className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1">
            {orderSent ? (
              <span className="text-blue-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Sent ✓
              </span>
            ) : (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <Clock className="w-4 h-4" /> Pending
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/30 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase">Pending Bills</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            ₹{billsSummary?.totalPendingAmount || 0}
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Summary Table (Prompt #5) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <Utensils className="w-5 h-5 text-blue-600" /> Today's Lunch Summary
            </h2>
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Full Table <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">Total Lunches</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{summary.totalConfirmed}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-[11px] font-semibold text-emerald-700">Veg</div>
              <div className="text-xl font-extrabold text-emerald-800 mt-0.5">{summary.vegCount}</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
              <div className="text-[11px] font-semibold text-orange-700">Non-Veg</div>
              <div className="text-xl font-extrabold text-orange-800 mt-0.5">{summary.nonVegCount}</div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="text-[11px] font-semibold text-red-700">Cancelled</div>
              <div className="text-xl font-extrabold text-red-800 mt-0.5">{summary.cancelledCount}</div>
            </div>
          </div>

          {/* Quick Booking Preview */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Today Bookings</h3>
            <div className="space-y-2">
              {summaryData?.bookings?.slice(0, 5).map((b: any) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {b.user.name.charAt(0)}
                    </span>
                    {b.user.name} <span className="text-[10px] text-slate-400">({b.user.department})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${b.foodOption.type === "VEG" ? "text-emerald-700" : "text-orange-700"}`}>
                      {b.foodOption.type}
                    </span>
                    <span className="font-bold text-slate-900">₹{b.priceAtBooking}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
          <h2 className="font-extrabold text-slate-900 text-lg">Quick Admin Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/vendor-order"
              className="w-full p-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Generate 11 AM Vendor Order
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/bookings"
              className="w-full p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Manual Employee Booking
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/admin/bills"
              className="w-full p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" /> Weekly Billing Generator
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/admin/food-options"
              className="w-full p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" /> Food & Price Management
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
