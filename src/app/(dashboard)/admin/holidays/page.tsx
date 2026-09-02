"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function AdminHolidaysPage() {
  const { showToast } = useToast();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/holidays");
      if (res.ok) {
        const data = await res.json();
        setHolidays(data.holidays || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) {
      showToast("Holiday name and date are required", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, description }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Holiday "${name}" added`, "success");
        setName("");
        setDate("");
        setDescription("");
        fetchHolidays();
      } else {
        showToast(data.error || "Failed to add holiday", "error");
      }
    } catch (e) {
      showToast("Error adding holiday", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string, hName: string) => {
    if (!confirm(`Delete holiday "${hName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/holidays?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Holiday removed", "info");
        fetchHolidays();
      }
    } catch (e) {
      showToast("Error deleting holiday", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-blue-600" /> Holiday Manager
        </h1>
        <p className="text-xs text-slate-500 mt-1">Configure company holidays to automatically block lunch bookings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Holiday Form */}
        <form onSubmit={handleAddHoliday} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Add Company Holiday</h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Independence Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. National Holiday"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl gradient-blue text-white text-xs font-bold shadow-md hover:opacity-95"
          >
            {submitting ? "Adding..." : "Add Holiday"}
          </button>
        </form>

        {/* Holidays List */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Configured Holidays</h3>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="py-6 text-center text-slate-400">Loading holidays...</div>
            ) : holidays.length === 0 ? (
              <div className="py-6 text-center text-slate-400">No holidays added yet.</div>
            ) : (
              holidays.map((h) => (
                <div key={h.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{h.name}</div>
                      <div className="text-xs text-slate-500">{h.date} {h.description && `• ${h.description}`}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(h.id, h.name)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
