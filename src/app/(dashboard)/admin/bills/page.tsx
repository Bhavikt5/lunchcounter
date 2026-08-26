"use client";

import React, { useState, useEffect } from "react";
import { Receipt, CheckCircle2, Clock, Calendar, Search, Filter, Play, Eye, X } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function AdminBillsPage() {
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState("2026-08-24");
  const [weekEnd, setWeekEnd] = useState("2026-08-28");
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBill, setSelectedBill] = useState<any>(null);

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bills?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBills = async () => {
    if (!weekStart || !weekEnd) {
      showToast("Please select week start and week end dates", "warning");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/admin/bills/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, weekEnd }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          `Generated ${data.generatedCount} bills successfully! (${data.skippedCount} duplicates skipped)`,
          "success"
        );
        fetchBills();
      } else {
        showToast(data.error || "Failed to generate bills", "error");
      }
    } catch (e) {
      showToast("Error generating weekly bills", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (billId: string) => {
    try {
      const res = await fetch("/api/admin/bills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, status: "PAID" }),
      });

      if (res.ok) {
        showToast("Bill marked as PAID!", "success");
        fetchBills();
      } else {
        showToast("Failed to update status", "error");
      }
    } catch (e) {
      showToast("Error marking bill paid", "error");
    }
  };

  const filteredBills = bills.filter((b) => {
    if (
      search &&
      !b.user.name.toLowerCase().includes(search.toLowerCase()) &&
      !b.user.employeeId.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" /> Weekly Billing Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">Batch generate Friday employee bills and track payment status.</p>
        </div>
      </div>

      {/* Bill Generation Control Box (Prompt #12) */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-slate-500">
          Weekly Bill Generator Controls
        </h3>
        <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Week Start Date</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Week End Date</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateBills}
            disabled={generating}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl gradient-emerald text-white text-xs font-extrabold shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> {generating ? "Calculating..." : "Generate Weekly Bills"}
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="PAID">Paid Only</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Week Range</th>
                <th className="py-3 px-4">Lunches</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading bills...</td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No generated bills found.</td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{b.user.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {b.user.employeeId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {b.weekStart} to {b.weekEnd}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{b.totalLunches} Days</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{b.totalAmount}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedBill(b)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                      >
                        Breakdown
                      </button>
                      {b.status === "PENDING" && (
                        <button
                          onClick={() => handleMarkPaid(b.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Items Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{selectedBill.user.name}'s Weekly Bill</h3>
                <p className="text-xs text-slate-500">Week: {selectedBill.weekStart} to {selectedBill.weekEnd}</p>
              </div>
              <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {selectedBill.items?.map((item: any) => (
                <div key={item.id} className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{item.bookingDate}</span>
                  <span className="text-slate-600">{item.foodType}</span>
                  <span className="font-bold text-slate-900">₹{item.amount}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between font-bold text-sm">
              <span>Total Amount:</span>
              <span className="text-emerald-700 text-base">₹{selectedBill.totalAmount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
