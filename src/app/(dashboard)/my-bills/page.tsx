"use client";

import React, { useState, useEffect } from "react";
import { Receipt, CheckCircle2, Clock, Eye, Calendar, DollarSign, X, QrCode, Upload, Copy, AlertTriangle, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function MyBillsPage() {
  const { showToast } = useToast();
  const [bills, setBills] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<any>({ upiId: "lunchcounter@upi", qrCode: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [payModalBill, setPayModalBill] = useState<any>(null);
  const [txnReference, setTxnReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");

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
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleProofImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Payment screenshot size must be less than 5MB", "warning");
        return;
      }
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Data, folder: "payment_proofs" }),
          });
          const data = await res.json();
          if (res.ok && data.url) {
            setProofUrl(data.url);
            showToast(data.isCloudinary ? "Payment receipt uploaded to Cloudinary!" : "Payment receipt attached", "success");
          } else {
            setProofUrl(base64Data);
          }
        } catch (err) {
          setProofUrl(base64Data);
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(paymentSettings.upiId);
    showToast("UPI ID copied to clipboard!", "success");
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalBill) return;
    if (!proofUrl) {
      showToast("Please upload your payment receipt / screenshot", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bills/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: payModalBill.id,
          proofUrl,
          txnReference,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Payment proof submitted successfully!", "success");
        setPayModalBill(null);
        setProofUrl("");
        setTxnReference("");
        fetchMyBills();
      } else {
        showToast(data.error || "Failed to submit payment proof", "error");
      }
    } catch (e) {
      showToast("Error submitting payment proof", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-blue-600 shrink-0" /> My Bills
        </h1>
        <p className="text-xs text-slate-500 mt-1">View your weekly lunch billing history and pay via UPI QR code.</p>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-none sm:shadow-xl border border-slate-200">
        <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
          <table className="w-full text-left border-collapse min-w-[650px]">
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
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{bill.weekStart} to {bill.weekEnd}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">{bill.totalLunches} Lunches</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">₹{bill.totalAmount}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {bill.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                        </span>
                      ) : bill.status === "VERIFICATION_PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Verification Pending
                        </span>
                      ) : bill.status === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                          <AlertTriangle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5" /> PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      {(bill.status === "PENDING" || bill.status === "REJECTED") && (
                        <button
                          onClick={() => {
                            setPayModalBill(bill);
                            setProofUrl(bill.proofUrl || "");
                            setTxnReference(bill.txnReference || "");
                          }}
                          className="px-3 py-1.5 rounded-xl gradient-blue text-white text-xs font-bold transition-opacity hover:opacity-95 inline-flex items-center gap-1 shadow-xs"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Pay via UPI QR
                        </button>
                      )}

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

      {/* Pay via UPI QR Modal */}
      {payModalBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" /> Pay Bill via UPI QR
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Week: {payModalBill.weekStart} – {payModalBill.weekEnd}
                </p>
              </div>
              <button
                onClick={() => setPayModalBill(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-semibold">Total Amount Payable</div>
                <div className="text-2xl font-extrabold text-white mt-0.5">₹{payModalBill.totalAmount}</div>
              </div>
              <div className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full">
                {payModalBill.totalLunches} Lunches
              </div>
            </div>

            {/* UPI QR Display */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Scan QR Code to Pay</div>
              
              {paymentSettings.qrCode ? (
                <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl border border-slate-300 shadow-md">
                  <img src={paymentSettings.qrCode} alt="UPI Payment QR Code" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-44 h-44 mx-auto bg-slate-100 rounded-2xl border border-slate-300 flex items-center justify-center text-xs text-slate-400 p-4">
                  QR Code not uploaded by Admin. Please use UPI ID below.
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-300 font-mono">
                  {paymentSettings.upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="Copy UPI ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmitPaymentProof} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Upload Payment Screenshot / Receipt *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofImageUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>

              {proofUrl && (
                <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border border-emerald-300 overflow-hidden bg-white shrink-0">
                    <img src={proofUrl} alt="Payment Proof Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs text-emerald-800">
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Screenshot Attached
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-0.5">Ready to submit for admin verification</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Transaction Reference / UTR Number (Optional)
                </label>
                <input
                  type="text"
                  value={txnReference}
                  onChange={(e) => setTxnReference(e.target.value)}
                  placeholder="e.g. 123456789012"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="w-full py-3.5 rounded-2xl gradient-blue text-white text-sm font-extrabold shadow-lg hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> {uploadingImage ? "Uploading to Cloudinary CDN..." : submitting ? "Submitting Proof..." : "Submit Payment Proof"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Breakdown Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" /> Bill Breakdown
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

            {selectedBill.rejectionReason && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900">
                <strong>Rejection Reason:</strong> {selectedBill.rejectionReason}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Total Lunches: {selectedBill.totalLunches}</div>
                <div className="text-lg font-extrabold text-slate-900">Total Amount: ₹{selectedBill.totalAmount}</div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedBill.status === "PAID"
                    ? "bg-blue-100 text-blue-800"
                    : selectedBill.status === "VERIFICATION_PENDING"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-amber-100 text-amber-800"
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
