"use client";

import React, { useState, useEffect } from "react";
import {
  Utensils,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  Receipt,
  XCircle,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Leaf,
  Drumstick,
} from "lucide-react";
import { CutoffBanner } from "@/components/CutoffBanner";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { getFormattedDateString } from "@/lib/cutoff";

export default function EmployeeDashboard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [foodOptions, setFoodOptions] = useState<any[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [userStats, setUserStats] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const formattedToday = getFormattedDateString(todayStr);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch today's booking status & food options
      const res = await fetch(`/api/bookings?date=${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        setBookingData(data);
        setFoodOptions(data.foodOptions || []);
        if (data.booking && data.booking.status === "CONFIRMED") {
          setSelectedFoodId(data.booking.foodOptionId);
        } else if (data.foodOptions?.length > 0) {
          setSelectedFoodId(data.foodOptions[0].id);
        }
      }

      // 2. Fetch user's bills & stats
      const billsRes = await fetch("/api/admin/bills");
      if (billsRes.ok) {
        const billsData = await billsRes.json();
        setUserStats(billsData);
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBookLunch = async () => {
    if (!selectedFoodId) {
      showToast("Please select a food option (Veg or Non-Veg)", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodOptionId: selectedFoodId, bookingDate: todayStr }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "✓ Lunch booked successfully!", "success");
        fetchDashboardData();
      } else {
        showToast(data.error || "Booking failed", "error");
      }
    } catch (e) {
      showToast("Error processing booking", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLunch = async () => {
    if (!confirm("Are you sure you want to cancel today's lunch booking?")) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings?date=${todayStr}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Lunch booking cancelled successfully", "info");
        fetchDashboardData();
      } else {
        showToast(data.error || "Failed to cancel booking", "error");
      }
    } catch (e) {
      showToast("Error cancelling booking", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const currentBooking = bookingData?.booking;
  const isBooked = currentBooking && currentBooking.status === "CONFIRMED";
  const cutoffStatus = bookingData?.cutoffStatus;
  const vegOption = foodOptions.find((f) => f.type === "VEG");
  const nonVegOption = foodOptions.find((f) => f.type === "NON_VEG");

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Today's Lunch <Sparkles className="w-6 h-6 text-amber-500" />
          </h1>
          <p className="text-sm font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" /> {formattedToday}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/my-bookings"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            My History
          </Link>
          <Link
            href="/my-bills"
            className="px-4 py-2 gradient-emerald text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-500/20 hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" /> My Bills
          </Link>
        </div>
      </div>

      {/* 2. Cutoff Banner Widget */}
      <CutoffBanner cutoffStatus={cutoffStatus} />

      {/* 3. Main Today's Lunch Booking Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 relative overflow-hidden">
        {/* Background Subtle Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Daily Booking Widget
              </span>
              {isBooked && (
                <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Booked
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
              {isBooked ? "You have booked lunch for today!" : "Select Food Option for Today"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isBooked
                ? `You can change Veg / Non-Veg options or cancel until ${cutoffStatus?.cutoffTime || "11:00"} AM.`
                : `Cutoff time is ${cutoffStatus?.cutoffTime || "11:00"} AM. Please make your choice before cutoff.`}
            </p>
          </div>
        </div>

        {/* Booking Details / Active Selection */}
        {isBooked ? (
          <div className="mt-6 space-y-6">
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/30">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Booking Confirmed
                  </div>
                  <div className="text-lg font-extrabold text-emerald-950 flex items-center gap-2 mt-0.5">
                    {currentBooking.foodOption.type === "VEG" ? (
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <Leaf className="w-5 h-5 text-emerald-600" /> Veg Thali
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-orange-700">
                        <Drumstick className="w-5 h-5 text-orange-600" /> Non-Veg Thali
                      </span>
                    )}
                    <span className="text-sm font-bold bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">
                      ₹{currentBooking.priceAtBooking}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-800 mt-1 flex items-center gap-3">
                    <span>Booking time: {currentBooking.bookingTime}</span>
                    <span>•</span>
                    <span>Cancellation available until {cutoffStatus?.cutoffTime || "11:00"} AM</span>
                  </div>
                </div>
              </div>

              {cutoffStatus?.isOpen && (
                <button
                  onClick={handleCancelLunch}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Cancel Lunch
                </button>
              )}
            </div>

            {/* Option to Switch Veg / Non-Veg before cutoff */}
            {cutoffStatus?.isOpen && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Change Food Selection (Before Cutoff)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {foodOptions.map((option) => {
                    const isSelected = selectedFoodId === option.id;
                    const isVeg = option.type === "VEG";
                    return (
                      <div
                        key={option.id}
                        onClick={() => setSelectedFoodId(option.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? isVeg
                              ? "border-emerald-500 bg-emerald-50/50 shadow-md"
                              : "border-orange-500 bg-orange-50/50 shadow-md"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {isVeg ? (
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Leaf className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                                <Drumstick className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{option.name}</div>
                              <div className="text-xs text-slate-500">₹{option.price} per lunch</div>
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="foodOption"
                            checked={isSelected}
                            onChange={() => setSelectedFoodId(option.id)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedFoodId !== currentBooking.foodOptionId && (
                  <div className="mt-4">
                    <button
                      onClick={handleBookLunch}
                      disabled={submitting}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl gradient-emerald text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
                    >
                      {submitting ? "Updating Selection..." : "Update Food Option"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* When not booked yet */
          <div className="mt-6 space-y-6">
            {!cutoffStatus?.isOpen ? (
              <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 text-center">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-base">Lunch booking closed for today.</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You can view your history or book lunch for upcoming workdays.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Select Your Meal Choice:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {foodOptions.map((option) => {
                    const isSelected = selectedFoodId === option.id;
                    const isVeg = option.type === "VEG";
                    return (
                      <div
                        key={option.id}
                        onClick={() => setSelectedFoodId(option.id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? isVeg
                              ? "border-emerald-500 bg-emerald-50/60 shadow-lg scale-[1.01]"
                              : "border-orange-500 bg-orange-50/60 shadow-lg scale-[1.01]"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isVeg ? (
                              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                                <Leaf className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-sm">
                                <Drumstick className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-slate-900 text-base">{option.name}</div>
                              <div className="text-xs font-semibold text-slate-500">₹{option.price}</div>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                            }`}
                          >
                            {isSelected && <span className="text-xs font-bold">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Primary CTA Button */}
                <div className="mt-6">
                  <button
                    onClick={handleBookLunch}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl gradient-emerald text-white font-extrabold text-base shadow-xl shadow-emerald-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 group"
                  >
                    {submitting ? "Booking..." : "Book Lunch Now"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Weekly Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">This Month's Lunches</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {userStats?.bills?.reduce((acc: number, b: any) => acc + b.totalLunches, 0) || 5} Days
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Paid Amount</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              ₹{userStats?.summary?.totalPaidAmount || 0}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Pending Bills</div>
            <div className="text-xl font-extrabold text-amber-600 mt-0.5">
              ₹{userStats?.summary?.totalPendingAmount || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
