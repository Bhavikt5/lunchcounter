"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, CheckCircle2, XCircle, Utensils, Calendar, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { getTodayDateString } from "@/lib/cutoff";

export default function AdminBookingsPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState<string>(getTodayDateString());
  const [search, setSearch] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bookings, setBookings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Manual booking modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [foodOptions, setFoodOptions] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    fetchFoodOptions();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [date, search, foodTypeFilter, statusFilter]);

  const fetchFoodOptions = async () => {
    try {
      const foodRes = await fetch("/api/admin/food-options");
      if (foodRes.ok) {
        const foodData = await foodRes.json();
        setFoodOptions(foodData.foodOptions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/bookings?date=${date}&search=${encodeURIComponent(
        search
      )}&foodType=${foodTypeFilter}&status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setSummary(data.summary || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openManualModal = async () => {
    try {
      const empRes = await fetch("/api/admin/employees");
      const empData = await empRes.json();
      setEmployees(empData.employees || []);

      const foodRes = await fetch("/api/admin/food-options");
      const foodData = await foodRes.json();
      setFoodOptions(foodData.foodOptions || []);

      if (empData.employees?.length > 0) setSelectedUserId(empData.employees[0].id);
      if (foodData.foodOptions?.length > 0) setSelectedFoodId(foodData.foodOptions[0].id);

      setShowManualModal(true);
    } catch (e) {
      showToast("Error opening manual booking modal", "error");
    }
  };

  const handleCreateManualBooking = async () => {
    if (!selectedUserId || !selectedFoodId) {
      showToast("Please select employee and food option", "warning");
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, foodOptionId: selectedFoodId, bookingDate: date }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Manual booking added successfully!", "success");
        setShowManualModal(false);
        fetchBookings();
      } else {
        showToast(data.error || "Failed to add manual booking", "error");
      }
    } catch (e) {
      showToast("Error creating booking", "error");
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleToggleStatus = async (bookingId: string, currentStatus: string) => {
    const newStatus = currentStatus === "CONFIRMED" ? "CANCELLED" : "CONFIRMED";
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      if (res.ok) {
        showToast(`Booking status changed to ${newStatus}`, "info");
        fetchBookings();
      } else {
        showToast("Failed to update status", "error");
      }
    } catch (e) {
      showToast("Error updating status", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-blue-600" /> Employee Bookings Table
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage and inspect daily employee lunch bookings.</p>
        </div>

        <button
          onClick={openManualModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Manual Booking
        </button>
      </div>

      {/* Date Picker & Controls Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600 uppercase">Select Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>

            <select
              value={foodTypeFilter}
              onChange={(e) => setFoodTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 max-w-[200px]"
            >
              <option value="ALL">All Food Options</option>
              <option value="VEG">Veg Only</option>
              <option value="NON_VEG">Non-Veg Only</option>
              {foodOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Food Type</th>
                <th className="py-3 px-4">Booking Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading bookings...</td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No employee bookings found for this date.</td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{b.user.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {b.user.employeeId} ({b.user.department})</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={b.foodOption.type === "VEG" ? "text-emerald-700" : "text-orange-700"}>
                        {b.foodOption.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{b.bookingTime}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.status === "CONFIRMED" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{b.priceAtBooking}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(b.id, b.status)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-100 text-slate-700"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Admin Booking Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Admin Manual Lunch Booking
              </h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-900"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId} - {emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Food Option</label>
              <select
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-900"
              >
                {foodOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} (₹{opt.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualBooking}
                disabled={submittingManual}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                {submittingManual ? "Adding..." : "Add Manual Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
