"use client";

import React, { useState, useEffect } from "react";
import { Receipt, CheckCircle2, Clock, Eye, Calendar, DollarSign, X } from "lucide-react";

export default function MyBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  useEffect(() => {
    fetchMyBills();
  }, []);

  const fetchMyBills = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bills");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-emerald-600" /> My Bills
        </h1>
        <p className="text-xs text-slate-500 mt-1">View your weekly lunch billing history and payment status.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                <th className="py-3 px-4">Week Period</th>
                <th className="py-3 px-4">Total Lunches</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading bills...</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No bills generated yet.</td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" /> {bill.weekStart} to {bill.weekEnd}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{bill.totalLunches} Lunches</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{bill.totalAmount}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          bill.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {bill.status === "PAID" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Breakdown
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Breakdown Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" /> Bill Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Week: {selectedBill.weekStart} – {selectedBill.weekEnd}
                </p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                <span>Date</span>
                <span>Food Type</span>
                <span>Amount</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {selectedBill.items?.map((item: any) => (
                  <div key={item.id} className="py-2.5 px-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{item.bookingDate}</span>
                    <span className="text-slate-600 font-medium">{item.foodType}</span>
                    <span className="font-bold text-slate-900">₹{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Total Lunches: {selectedBill.totalLunches}</div>
                <div className="text-lg font-extrabold text-slate-900">Total Amount: ₹{selectedBill.totalAmount}</div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedBill.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                Status: {selectedBill.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
