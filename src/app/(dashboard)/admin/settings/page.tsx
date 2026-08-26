"use client";

import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Clock, Building, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [cutoffTime, setCutoffTime] = useState("11:00");
  const [companyName, setCompanyName] = useState("Lunch Counter");
  const [currency, setCurrency] = useState("₹");
  const [workingDays, setWorkingDays] = useState("Mon,Tue,Wed,Thu,Fri");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const s = data.settings || {};
        if (s.cutoff_time) setCutoffTime(s.cutoff_time);
        if (s.company_name) setCompanyName(s.company_name);
        if (s.currency) setCurrency(s.currency);
        if (s.working_days) setWorkingDays(s.working_days);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cutoff_time: cutoffTime,
          company_name: companyName,
          currency,
          working_days: workingDays,
        }),
      });

      if (res.ok) {
        showToast("System settings saved successfully!", "success");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch (e) {
      showToast("Error saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-600" /> System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">Configure global application parameters and business logic.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Company / App Name</label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Default Daily Cutoff Time
            </label>
            <input
              type="time"
              required
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Working Days (Comma Separated)</label>
          <input
            type="text"
            required
            value={workingDays}
            onChange={(e) => setWorkingDays(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl gradient-emerald text-white text-sm font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving Settings..." : "Save System Settings"}
        </button>
      </form>
    </div>
  );
}
