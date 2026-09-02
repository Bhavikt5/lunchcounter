"use client";

import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Clock, Building, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [orderStartTime, setOrderStartTime] = useState("08:00");
  const [cutoffTime, setCutoffTime] = useState("11:00");
  const [companyName, setCompanyName] = useState("Lunch Counter");
  const [notificationEmail, setNotificationEmail] = useState("admin@lunchcounter.com");
  const [paymentUpiId, setPaymentUpiId] = useState("lunchcounter@upi");
  const [paymentQrCode, setPaymentQrCode] = useState("");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState("");
  const [currency, setCurrency] = useState("₹");
  const [workingDays, setWorkingDays] = useState("Mon,Tue,Wed,Thu,Fri");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

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
        if (s.order_start_time) setOrderStartTime(s.order_start_time);
        if (s.cutoff_time) setCutoffTime(s.cutoff_time);
        if (s.company_name) setCompanyName(s.company_name);
        if (s.notification_email) setNotificationEmail(s.notification_email);
        if (s.payment_upi_id) setPaymentUpiId(s.payment_upi_id);
        if (s.payment_qr_code) setPaymentQrCode(s.payment_qr_code);
        if (s.cloudinary_cloud_name) setCloudinaryCloudName(s.cloudinary_cloud_name);
        if (s.cloudinary_upload_preset) setCloudinaryUploadPreset(s.cloudinary_upload_preset);
        if (s.currency) setCurrency(s.currency);
        if (s.working_days) setWorkingDays(s.working_days);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("QR Code image size should be less than 5MB", "warning");
        return;
      }
      setUploadingQr(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Data, folder: "qr_codes" }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            setPaymentQrCode(data.url);
            showToast(data.isCloudinary ? "QR Code uploaded to Cloudinary CDN!" : "QR Code image attached", "success");
          } else {
            setPaymentQrCode(base64Data);
          }
        } catch (e) {
          setPaymentQrCode(base64Data);
        } finally {
          setUploadingQr(false);
        }
      };
      reader.readAsDataURL(file);
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
          order_start_time: orderStartTime,
          cutoff_time: cutoffTime,
          company_name: companyName,
          notification_email: notificationEmail,
          payment_upi_id: paymentUpiId,
          payment_qr_code: paymentQrCode,
          cloudinary_cloud_name: cloudinaryCloudName,
          cloudinary_upload_preset: cloudinaryUploadPreset,
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
          <SettingsIcon className="w-6 h-6 text-blue-600" /> System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">Configure global application parameters, payment UPI details, and business logic.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-5 sm:p-8 shadow-none sm:shadow-xl border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Company / App Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Admin Notification Email
            </label>
            <input
              type="email"
              required
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="admin@lunchcounter.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>



        {/* UPI Payment Configuration Section */}
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
            UPI QR Payment Configuration (Employee Bill Payments)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company UPI ID / VPA</label>
              <input
                type="text"
                required
                value={paymentUpiId}
                onChange={(e) => setPaymentUpiId(e.target.value)}
                placeholder="lunchcounter@upi"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Upload Payment QR Code Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleQrUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
          </div>

          {paymentQrCode && (
            <div className="flex items-center gap-4 pt-2">
              <div className="w-24 h-24 rounded-xl border border-slate-300 bg-white p-1.5 overflow-hidden shadow-sm shrink-0">
                <img src={paymentQrCode} alt="Payment QR Code Preview" className="w-full h-full object-contain" />
              </div>
              <div className="text-xs text-slate-600">
                <div className="font-bold text-slate-800">QR Code Active Preview</div>
                <div>Employees will scan this QR Code on their <strong>My Bills</strong> screen to complete payment.</div>
                <button
                  type="button"
                  onClick={() => setPaymentQrCode("")}
                  className="text-xs text-red-600 font-semibold hover:underline mt-1"
                >
                  Remove QR Image
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Daily Order Start Time
            </label>
            <input
              type="time"
              required
              value={orderStartTime}
              onChange={(e) => setOrderStartTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Default Daily Cutoff Time
            </label>
            <input
              type="time"
              required
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl gradient-blue text-white text-sm font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving Settings..." : "Save System Settings"}
        </button>
      </form>
    </div>
  );
}
