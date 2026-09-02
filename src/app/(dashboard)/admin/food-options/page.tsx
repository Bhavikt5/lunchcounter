"use client";

import React, { useState, useEffect } from "react";
import { Sliders, DollarSign, Leaf, Drumstick, Save, Info } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function AdminFoodOptionsPage() {
  const { showToast } = useToast();
  const [foodOptions, setFoodOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFoodOptions();
  }, []);

  const fetchFoodOptions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/food-options");
      if (res.ok) {
        const data = await res.json();
        setFoodOptions(data.foodOptions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async (option: any) => {
    setSavingId(option.id);
    try {
      const res = await fetch("/api/admin/food-options", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: option.id, name: option.name, price: option.price }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Updated price for ${option.name} to ₹${option.price}`, "success");
        fetchFoodOptions();
      } else {
        showToast(data.error || "Failed to update price", "error");
      }
    } catch (e) {
      showToast("Error saving price", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-blue-600" /> Food & Pricing Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">Configure daily lunch food options and unit pricing.</p>
      </div>

      {/* Important Business Rule Note */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Price Freeze Policy:</strong> Changing prices here updates future bookings only. Past lunch bookings retain the actual unit price at the time of booking so billing audit history remains accurate.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {foodOptions.map((option) => {
          const isVeg = option.type === "VEG";
          return (
            <div key={option.id} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {isVeg ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Leaf className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                      <Drumstick className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{option.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Type: {option.type}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₹)</label>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 text-base">₹</span>
                  <input
                    type="number"
                    step="5"
                    value={option.price}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFoodOptions((prev) =>
                        prev.map((o) => (o.id === option.id ? { ...o, price: isNaN(val) ? 0 : val } : o))
                      );
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-lg font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={() => handleUpdatePrice(option)}
                disabled={savingId === option.id}
                className="w-full py-2.5 rounded-xl gradient-blue text-white text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {savingId === option.id ? "Saving..." : "Save Price"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
