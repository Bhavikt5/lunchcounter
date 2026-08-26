"use client";

import React, { useState, useEffect } from "react";
import { User as UserIcon, Mail, Phone, Building, Shield, Key } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user));
  }, []);

  if (!user) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-emerald-600" /> Employee Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">View your official profile details.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{user.name}</h2>
            <p className="text-xs font-mono text-emerald-600 font-semibold mt-0.5">Employee ID: {user.employeeId}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Role: {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Email Address</div>
              <div className="text-sm font-semibold text-slate-900">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <Building className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Department</div>
              <div className="text-sm font-semibold text-slate-900">{user.department}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <Shield className="w-5 h-5 text-slate-400" />
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">Account Status</div>
              <div className="text-sm font-semibold text-emerald-600">Active Employee</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
