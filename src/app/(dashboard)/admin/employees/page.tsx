"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Edit, Shield, Search, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function AdminEmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEmp(null);
    setEmployeeId(`EMP${Math.floor(100 + Math.random() * 900)}`);
    setName("");
    setEmail("");
    setPhone("");
    setDepartment("Engineering");
    setRole("EMPLOYEE");
    setPassword("password123");
    setShowModal(true);
  };

  const openEditModal = (emp: any) => {
    setEditingEmp(emp);
    setEmployeeId(emp.employeeId);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone || "");
    setDepartment(emp.department);
    setRole(emp.role);
    setPassword("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = "/api/admin/employees";
      const method = editingEmp ? "PUT" : "POST";
      const body: any = {
        employeeId,
        name,
        email,
        phone,
        department,
        role,
      };

      if (editingEmp) {
        body.id = editingEmp.id;
        if (password) body.newPassword = password;
      } else {
        body.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Employee ${editingEmp ? "updated" : "created"} successfully`, "success");
        setShowModal(false);
        fetchEmployees();
      } else {
        showToast(data.error || "Operation failed", "error");
      }
    } catch (e) {
      showToast("Error saving employee", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (emp: any) => {
    const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.id, status: newStatus }),
      });
      if (res.ok) {
        showToast(`Employee ${emp.name} set to ${newStatus}`, "info");
        fetchEmployees();
      }
    } catch (e) {
      showToast("Error updating status", "error");
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> Employee Directory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Add, edit, disable employees and view spending totals.</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add New Employee
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Name & Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Unpaid Bills</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading directory...</td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{emp.employeeId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{emp.name}</div>
                      <div className="text-xs text-slate-500">{emp.email} • {emp.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.role === "ADMIN" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{emp.totalSpent}</td>
                    <td className="py-3.5 px-4">
                      {emp.unpaidBillsAmount > 0 ? (
                        <span className="text-amber-600 font-bold text-xs">₹{emp.unpaidBillsAmount} ({emp.unpaidBillsCount})</span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-xs">Paid</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${emp.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button onClick={() => openEditModal(emp)} className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleStatus(emp)} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-100">
                        {emp.status === "ACTIVE" ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingEmp ? "Edit Employee Details" : "Add New Employee"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                <input type="text" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-bold">
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password {editingEmp && "(Leave blank to keep current)"}</label>
              <input type="password" required={!editingEmp} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 border rounded-xl text-xs" />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
                {submitting ? "Saving..." : "Save Employee"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
