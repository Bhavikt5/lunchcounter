"use client";

import React, { useState } from "react";
import { Clock, AlertTriangle, CheckCircle2, RefreshCw, Lock, Unlock, Calendar, Settings } from "lucide-react";
import { useToast } from "./Toast";

interface CutoffBannerProps {
  cutoffStatus: {
    isOpen: boolean;
    reason?: string;
    cutoffTime: string;
    isManualOverride?: boolean;
    isHoliday?: boolean;
    holidayName?: string;
    isWeekend?: boolean;
  } | null;
  isAdmin?: boolean;
  onStatusChange?: () => void;
}

export function CutoffBanner({ cutoffStatus, isAdmin, onStatusChange }: CutoffBannerProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [newCutoffTime, setNewCutoffTime] = useState(cutoffStatus?.cutoffTime || "11:00");

  if (!cutoffStatus) return null;

  const toggleManualOverride = async (close: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cutoff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualClosed: close }),
      });
      if (res.ok) {
        showToast(`Lunch booking manually ${close ? "closed" : "reopened"}`, close ? "warning" : "success");
        if (onStatusChange) onStatusChange();
      } else {
        showToast("Failed to update cutoff override", "error");
      }
    } catch (e) {
      showToast("Error updating cutoff state", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCutoffTime = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cutoff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cutoffTime: newCutoffTime }),
      });
      if (res.ok) {
        showToast(`Cutoff time updated to ${newCutoffTime}`, "success");
        setShowTimeModal(false);
        if (onStatusChange) onStatusChange();
      } else {
        showToast("Failed to update cutoff time", "error");
      }
    } catch (e) {
      showToast("Error saving cutoff time", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all duration-300 ${
        cutoffStatus.isOpen
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
          : "bg-red-500/10 border-red-500/30 text-red-950"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              cutoffStatus.isOpen ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {cutoffStatus.isOpen ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base tracking-tight">
                {cutoffStatus.isOpen ? "Lunch Booking Open" : "Lunch Booking Closed"}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200">
                Cutoff: {cutoffStatus.cutoffTime} AM
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {cutoffStatus.reason ||
                (cutoffStatus.isOpen
                  ? `Select your preferred food option (Veg/Non-Veg) before ${cutoffStatus.cutoffTime} AM.`
                  : `Booking has closed for today. Cutoff time was ${cutoffStatus.cutoffTime} AM.`)}
            </p>
          </div>
        </div>

        {/* Admin Overrides */}
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
            {cutoffStatus.isOpen ? (
              <button
                onClick={() => toggleManualOverride(true)}
                disabled={loading}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" /> Close Booking Now
              </button>
            ) : (
              <button
                onClick={() => toggleManualOverride(false)}
                disabled={loading}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Unlock className="w-3.5 h-3.5" /> Reopen Booking
              </button>
            )}

            <button
              onClick={() => setShowTimeModal(true)}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              title="Configure Cutoff Time"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Edit Cutoff Time Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" /> Set Daily Cutoff Time
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Employees will not be able to book or cancel lunch after this time.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cutoff Time (24h format)</label>
              <input
                type="time"
                value={newCutoffTime}
                onChange={(e) => setNewCutoffTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowTimeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCutoffTime}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                {loading ? "Saving..." : "Save Cutoff Time"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
