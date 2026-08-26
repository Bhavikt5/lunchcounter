"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, Calendar, BarChart3, PieChart, Users, Leaf, Drumstick } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [reportType, date]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?type=${reportType}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    let csvContent = "data:text/csv;charset=utf-8,";

    if (reportType === "daily") {
      csvContent += "Booking Date,Employee ID,Employee Name,Department,Food Option,Price,Status\n";
      reportData.records?.forEach((r: any) => {
        csvContent += `${r.bookingDate},${r.user.employeeId},"${r.user.name}",${r.user.department},${r.foodOption.type},${r.priceAtBooking},${r.status}\n`;
      });
    } else if (reportType === "weekly") {
      csvContent += "Employee ID,Employee Name,Department,Total Lunches,Veg Count,Non-Veg Count,Total Amount\n";
      reportData.records?.forEach((r: any) => {
        csvContent += `${r.employee.employeeId},"${r.employee.name}",${r.employee.department},${r.totalLunches},${r.vegCount},${r.nonVegCount},${r.totalAmount}\n`;
      });
    } else {
      csvContent += "Metric,Value\n";
      csvContent += `Total Lunches,${reportData.metrics?.totalLunches}\n`;
      csvContent += `Veg Count,${reportData.metrics?.vegCount}\n`;
      csvContent += `Non-Veg Count,${reportData.metrics?.nonVegCount}\n`;
      csvContent += `Total Revenue,${reportData.metrics?.totalRevenue}\n`;
      csvContent += `Employees Using Lunch,${reportData.metrics?.totalEmployeesUsingLunch}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lunch_report_${reportType}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Report CSV downloaded successfully", "info");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" /> Lunch Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">Exportable daily, weekly, and monthly aggregate reports.</p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setReportType("daily")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                reportType === "daily" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setReportType("weekly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                reportType === "weekly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Weekly Report
            </button>
            <button
              onClick={() => setReportType("monthly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                reportType === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Report
            </button>
          </div>

          {reportType === "daily" && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          )}
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="py-12 text-center text-slate-400">Generating report data...</div>
        ) : (
          <div className="space-y-6">
            {reportType === "daily" && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-slate-500">Total Lunches</div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{reportData.metrics?.totalLunches}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="text-xs font-bold text-emerald-700">Veg Lunches</div>
                    <div className="text-2xl font-extrabold text-emerald-800 mt-1">{reportData.metrics?.vegCount}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
                    <div className="text-xs font-bold text-orange-700">Non-Veg Lunches</div>
                    <div className="text-2xl font-extrabold text-orange-800 mt-1">{reportData.metrics?.nonVegCount}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900 text-white">
                    <div className="text-xs font-bold text-slate-400">Total Amount</div>
                    <div className="text-2xl font-extrabold text-white mt-1">₹{reportData.metrics?.totalAmount}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                        <th className="py-2.5 px-4">Employee</th>
                        <th className="py-2.5 px-4">Department</th>
                        <th className="py-2.5 px-4">Food Choice</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {reportData.records?.map((r: any) => (
                        <tr key={r.id}>
                          <td className="py-3 px-4 font-semibold text-slate-900">{r.user.name} ({r.user.employeeId})</td>
                          <td className="py-3 px-4 text-slate-600">{r.user.department}</td>
                          <td className="py-3 px-4 font-bold">{r.foodOption.type}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">₹{r.priceAtBooking}</td>
                          <td className="py-3 px-4 text-right font-bold">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === "weekly" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Total Lunches</th>
                      <th className="py-3 px-4">Veg</th>
                      <th className="py-3 px-4">Non-Veg</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {reportData.records?.map((rec: any) => (
                      <tr key={rec.employee.id}>
                        <td className="py-3 px-4 font-semibold text-slate-900">{rec.employee.name} ({rec.employee.employeeId})</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{rec.employee.department}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{rec.totalLunches} Days</td>
                        <td className="py-3 px-4 text-emerald-700 font-bold">{rec.vegCount}</td>
                        <td className="py-3 px-4 text-orange-700 font-bold">{rec.nonVegCount}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">₹{rec.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === "monthly" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase">Monthly Revenue</div>
                  <div className="text-3xl font-extrabold text-emerald-400 mt-2">₹{reportData.metrics?.totalRevenue}</div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase">Total Orders Prepared</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">{reportData.metrics?.totalLunches} Lunches</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {reportData.metrics?.vegCount} Veg • {reportData.metrics?.nonVegCount} Non-Veg
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase">Active Employees</div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">{reportData.metrics?.totalEmployeesUsingLunch} Users</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
