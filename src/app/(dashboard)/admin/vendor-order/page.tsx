"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Copy, Download, CheckCircle2, Clock, Printer, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/Toast";
import { getFormattedDateString } from "@/lib/cutoff";

export default function AdminVendorOrderPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    fetchVendorOrder();
  }, [date]);

  const fetchVendorOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vendor-orders?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setOrderData(data);
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading vendor order", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSnapshot = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/vendor-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Vendor order snapshot generated & frozen!", "success");
        fetchVendorOrder();
      } else {
        showToast(data.error || "Failed to generate vendor order", "error");
      }
    } catch (e) {
      showToast("Error generating vendor order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkSent = async () => {
    if (!orderData?.vendorOrder) {
      showToast("Please generate the vendor order first", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/vendor-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.vendorOrder.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Order marked as SENT to vendor!", "success");
        fetchVendorOrder();
      } else {
        showToast(data.error || "Failed to mark order sent", "error");
      }
    } catch (e) {
      showToast("Error updating order status", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const currentCounts = orderData?.currentCounts || { vegCount: 0, nonVegCount: 0, totalCount: 0, totalAmount: 0, bookings: [] };
  const vendor = orderData?.vendor;
  const vendorOrder = orderData?.vendorOrder;
  const formattedDate = getFormattedDateString(date);

  const summaryText = `Lunch Order
Date: ${formattedDate}
Vendor: ${vendor?.name || "Green Leaf Caterers"}

Please prepare:
- ${currentCounts.vegCount} Veg Lunches
- ${currentCounts.nonVegCount} Non-Veg Lunches

Total: ${currentCounts.totalCount} Lunches
Total Estimated Amount: ₹${currentCounts.totalAmount}`;

  const copySummaryText = () => {
    navigator.clipboard.writeText(summaryText);
    showToast("Vendor order summary copied to clipboard!", "success");
  };

  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Name,Department,Food Option,Price,Booking Time\n";
    currentCounts.bookings.forEach((b: any) => {
      csvContent += `${b.user.employeeId},"${b.user.name}",${b.user.department},${b.foodOption.type},${b.priceAtBooking},${b.bookingTime}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vendor_order_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV downloaded successfully", "info");
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" /> Today's Vendor Order
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Calculate, freeze, and dispatch daily lunch counts to vendor at 11:00 AM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
          />
          <button
            onClick={handleGenerateSnapshot}
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Freeze / Generate Order
          </button>
        </div>
      </div>

      {/* Outdated Warning Banner */}
      {orderData?.isOutdated && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Warning:</strong> Bookings have changed after the vendor order was sent! Current real-time count is{" "}
            {currentCounts.totalCount} (Sent snapshot was {vendorOrder.totalCount}).
          </span>
        </div>
      )}

      {/* Main Vendor Order Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Vendor Order Summary
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">
              {vendor?.name || "Green Leaf Caterers"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Contact: {vendor?.contactPerson} • Phone: {vendor?.phone} • Email: {vendor?.email}
            </p>
          </div>

          <div className="text-right">
            {vendorOrder?.status === "SENT" ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Order Sent to Vendor
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                <Clock className="w-4 h-4 text-amber-600" /> Draft / Pending Dispatch
              </div>
            )}
            {vendorOrder?.sentAt && (
              <div className="text-[11px] text-slate-500 mt-1">
                Sent at: {new Date(vendorOrder.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        </div>

        {/* Count Breakdown Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Veg Lunches</div>
            <div className="text-3xl font-extrabold text-emerald-900 mt-1">{currentCounts.vegCount}</div>
          </div>

          <div className="p-5 rounded-2xl bg-orange-50/80 border border-orange-200 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-orange-700">Non-Veg Lunches</div>
            <div className="text-3xl font-extrabold text-orange-900 mt-1">{currentCounts.nonVegCount}</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 text-white text-center shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Count</div>
            <div className="text-3xl font-extrabold text-white mt-1">{currentCounts.totalCount}</div>
          </div>
        </div>

        {/* Formatted Order Text Box (Prompt #7) */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-sm space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">
            Vendor Order Message Box
          </div>
          <div className="text-slate-800 space-y-1">
            <p className="font-bold">Please prepare:</p>
            <p className="text-emerald-700 font-bold">• {currentCounts.vegCount} Veg Lunches</p>
            <p className="text-orange-700 font-bold">• {currentCounts.nonVegCount} Non-Veg Lunches</p>
            <p className="font-extrabold text-slate-900 pt-2">Total: {currentCounts.totalCount} Lunches</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copySummaryText}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4 text-emerald-600" /> Copy Order Summary
            </button>

            <button
              onClick={downloadCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Download CSV
            </button>

            <button
              onClick={triggerPrint}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-purple-600" /> Download PDF / Print
            </button>
          </div>

          <button
            onClick={handleMarkSent}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl gradient-emerald text-white text-xs font-extrabold shadow-md hover:opacity-95 transition-opacity flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark Order as Sent
          </button>
        </div>
      </div>
    </div>
  );
}
