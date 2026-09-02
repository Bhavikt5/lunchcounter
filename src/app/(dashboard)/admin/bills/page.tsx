"use client";

import React, { useState, useEffect } from "react";
import { Receipt, CheckCircle2, Clock, Calendar, Search, Filter, Play, Eye, X, ShieldCheck, AlertTriangle, FileText, Check, XCircle } from "lucide-react";
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
  const [reviewModalBill, setReviewModalBill] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifying, setVerifying] = useState(false);

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

  const handleVerifyPayment = async (billId: string, action: "APPROVE" | "REJECT") => {
    setVerifying(true);
    try {
      const res = await fetch("/api/admin/bills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId,
          action,
          rejectionReason: action === "REJECT" ? rejectionReason || "Payment proof verification failed." : null,
        }),
      });

      if (res.ok) {
        showToast(
          action === "APPROVE" ? "Payment verified & marked as PAID!" : "Payment proof rejected and employee notified.",
          action === "APPROVE" ? "success" : "info"
        );
        setReviewModalBill(null);
        setRejectionReason("");
        fetchBills();
      } else {
        showToast("Failed to verify payment status", "error");
      }
    } catch (e) {
      showToast("Error verifying payment", "error");
    } finally {
      setVerifying(false);
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
            <Receipt className="w-6 h-6 text-blue-600" /> Weekly Billing & Payment Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">Batch generate weekly employee bills, review payment screenshots, and mark bills as paid.</p>
        </div>
      </div>

      {/* Bill Generation Control Box */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-none sm:shadow-xl border border-slate-200 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
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
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl gradient-blue text-white text-xs font-extrabold shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> {generating ? "Calculating..." : "Generate Weekly Bills"}
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-none sm:shadow-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="VERIFICATION_PENDING">Verification Pending Only</option>
            <option value="PENDING">Pending Only</option>
            <option value="PAID">Paid Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
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
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div>{b.user.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {b.user.employeeId} ({b.user.department})</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {b.weekStart} to {b.weekEnd}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{b.totalLunches} Days</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">₹{b.totalAmount}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {b.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                        </span>
                      ) : b.status === "VERIFICATION_PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Proof Submitted
                        </span>
                      ) : b.status === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          <AlertTriangle className="w-3.5 h-3.5" /> REJECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          <Clock className="w-3.5 h-3.5" /> PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      {b.status === "VERIFICATION_PENDING" && (
                        <button
                          onClick={() => {
                            setReviewModalBill(b);
                            setRejectionReason("");
                          }}
                          className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Review Proof
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedBill(b)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                      >
                        Breakdown
                      </button>

                      {b.status === "PENDING" && (
                        <button
                          onClick={() => handleVerifyPayment(b.id, "APPROVE")}
                          className="px-3 py-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold"
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

      {/* Payment Proof Review Modal */}
      {reviewModalBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" /> Review Payment Proof
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted by {reviewModalBill.user.name} ({reviewModalBill.user.employeeId})
                </p>
              </div>
              <button onClick={() => setReviewModalBill(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount & UTR details */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Bill Amount:</span>
                <div className="font-extrabold text-slate-900 text-base mt-0.5">₹{reviewModalBill.totalAmount}</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Transaction UTR / Ref:</span>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{reviewModalBill.txnReference || "Not specified"}</div>
              </div>
            </div>

            {/* Screenshot Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Uploaded Payment Screenshot</label>
              {reviewModalBill.proofUrl ? (
                <div className="w-full max-h-72 rounded-2xl border border-slate-300 bg-black/5 p-2 overflow-hidden flex items-center justify-center">
                  <img
                    src={reviewModalBill.proofUrl}
                    alt="Uploaded Payment Receipt"
                    className="max-h-64 w-auto object-contain rounded-xl shadow-md"
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  No screenshot uploaded.
                </div>
              )}
            </div>

            {/* Optional Rejection Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Note (Required if rejecting proof)</label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. UTR number mismatch or blurry receipt"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={verifying}
                onClick={() => handleVerifyPayment(reviewModalBill.id, "REJECT")}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject Proof
              </button>

              <button
                type="button"
                disabled={verifying}
                onClick={() => handleVerifyPayment(reviewModalBill.id, "APPROVE")}
                className="px-5 py-2.5 rounded-xl gradient-blue text-white text-xs font-extrabold shadow-md hover:opacity-95 transition-opacity flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Approve & Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}

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

            {selectedBill.rejectionReason && (
              <div className="p-3 rounded-xl bg-red-50 text-xs text-red-900 border border-red-200">
                <strong>Rejection Reason:</strong> {selectedBill.rejectionReason}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between font-bold text-sm">
              <span>Total Amount:</span>
              <span className="text-blue-700 text-base">₹{selectedBill.totalAmount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
