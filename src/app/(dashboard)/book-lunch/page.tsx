"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CheckCircle2, Clock, Leaf, Drumstick, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";
import { getFormattedDateString } from "@/lib/cutoff";

export default function BookLunchPage() {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [foodOptionId, setFoodOptionId] = useState<string>("");

  useEffect(() => {
    fetchDateData(selectedDate);
  }, [selectedDate]);

  const fetchDateData = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?date=${dateStr}`);
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
        if (resData.booking && resData.booking.status === "CONFIRMED") {
          setFoodOptionId(resData.booking.foodOptionId);
        } else if (resData.foodOptions?.length > 0) {
          setFoodOptionId(resData.foodOptions[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!foodOptionId) {
      showToast("Please select a food option", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodOptionId, bookingDate: selectedDate }),
      });
      const resData = await res.json();
      if (res.ok) {
        showToast(`Lunch booked for ${selectedDate}`, "success");
        fetchDateData(selectedDate);
      } else {
        showToast(resData.error || "Booking failed", "error");
      }
    } catch (e) {
      showToast("Error processing booking", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(`Cancel lunch booking for ${selectedDate}?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}`, { method: "DELETE" });
      const resData = await res.json();
      if (res.ok) {
        showToast("Booking cancelled", "info");
        fetchDateData(selectedDate);
      } else {
        showToast(resData.error || "Failed to cancel", "error");
      }
    } catch (e) {
      showToast("Error cancelling booking", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDate = getFormattedDateString(selectedDate);
  const booking = data?.booking;
  const isBooked = booking && booking.status === "CONFIRMED";
  const cutoff = data?.cutoffStatus;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-blue-600 shrink-0" /> Book Lunch
        </h1>
        <p className="text-xs text-slate-500 mt-1">Select a date to view status or book upcoming lunch.</p>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-none sm:shadow-xl border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="text-left sm:text-right">
            <div className="text-sm font-bold text-slate-900">{formattedDate}</div>
            <div className="text-xs text-slate-500">Cutoff: {cutoff?.cutoffTime || "11:00"} AM</div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse">Loading booking information...</div>
        ) : (
          <div>
            {isBooked ? (
              <div className="space-y-4">
                <div className="p-4 sm:p-6 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">Lunch Booked for {selectedDate}</div>
                      <div className="text-xs text-slate-600">
                        Selection: <strong>{booking.foodOption?.name || "Thali"}</strong> (₹{booking.priceAtBooking})
                      </div>
                      {cutoff && !cutoff.isOpen && (
                        <div className="text-[11px] font-semibold text-amber-700 mt-1">
                          Booking cutoff closed for this date (changes/cancellation closed).
                        </div>
                      )}
                    </div>
                  </div>
                  {cutoff?.isOpen && (
                    <button
                      onClick={handleCancel}
                      disabled={submitting}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors flex justify-center items-center"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ) : cutoff && !cutoff.isOpen ? (
              <div className="p-4 sm:p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{cutoff.reason}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Select Food Option:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {data?.foodOptions?.map((opt: any) => (
                    <div
                      key={opt.id}
                      onClick={() => setFoodOptionId(opt.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        foodOptionId === opt.id ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="font-bold text-slate-900">{opt.name}</div>
                      <div className="text-xs text-slate-500">₹{opt.price}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleBook}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl gradient-blue text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? "Booking..." : "Confirm Lunch Booking"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
