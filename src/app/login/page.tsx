"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, Shield, User, ArrowRight, CheckCircle2, Key, Sparkles, Clock, Lock } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch seeded users for quick demo login options
    fetchDemoUsers();
  }, []);

  const fetchDemoUsers = async () => {
    try {
      const res = await fetch("/api/admin/employees");
      if (res.ok) {
        const data = await res.json();
        setDemoUsers(data.employees || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter email and password", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Login failed", "error");
      } else {
        showToast(`Welcome back, ${data.user.name}!`, "success");
        if (data.user.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (e) {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (userId: string, userName: string, role: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoUserId: userId }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Signed in as ${userName} (${role})`, "success");
        if (role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } else {
        showToast("Demo login failed", "error");
      }
    } catch (e) {
      showToast("Demo login error", "error");
    } finally {
      setLoading(false);
    }
  };

  const adminUser = demoUsers.find((u) => u.role === "ADMIN");
  const employeeUsers = demoUsers.filter((u) => u.role === "EMPLOYEE").slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-emerald text-white shadow-xl shadow-emerald-500/20 mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Lunch Counter</h2>
        <p className="mt-2 text-sm text-slate-400">
          Internal Employee Lunch Booking & Billing System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address / Employee ID
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lunchcounter.com or rahul@company.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white gradient-emerald hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Quick Demo Login Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> 1-Click Quick Demo Login
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Preset Accounts</span>
            </div>

            <div className="space-y-2">
              {adminUser && (
                <button
                  type="button"
                  onClick={() => handleDemoLogin(adminUser.id, adminUser.name, "ADMIN")}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1">
                        {adminUser.name} <span className="text-[10px] px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded font-semibold">Admin</span>
                      </div>
                      <div className="text-[11px] text-amber-700">{adminUser.email}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-800 underline">Login</span>
                </button>
              )}

              {employeeUsers.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleDemoLogin(emp.id, emp.name, "EMPLOYEE")}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {emp.name} <span className="text-[10px] text-slate-500">({emp.department})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{emp.email}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Login</span>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              Password for all seeded accounts: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
