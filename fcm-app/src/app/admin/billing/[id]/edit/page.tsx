'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { billingAPI } from "@/lib/api";
import { capitalizeSentence, formatAmountDisplay } from "@/lib/utils";
import { getCurrentUserDisplayName } from "@/lib/auth";

type BillingFormData = {
  date: string;
  salesInvoiceNumber: string;
  bsNumber: string;
  quoteNumber: string;
  description: string;
  address: string;
  amount: string;
  payment: string;
  checkInfo: string;
  checkNumber: string;
  paymentDate: string;
  status: string;
};

export default function EditBillingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [salesInvoiceError, setSalesInvoiceError] = useState<string>("");

  const [formData, setFormData] = useState<BillingFormData>({
    date: "",
    salesInvoiceNumber: "",
    bsNumber: "",
    quoteNumber: "",
    description: "",
    address: "",
    amount: "",
    payment: "",
    checkInfo: "",
    checkNumber: "",
    paymentDate: "",
    status: "Not Paid",
  });

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const data = await billingAPI.getById(id);
        if (data) {
          const amtNum = data.amount != null ? parseFloat(String(data.amount).replace(/[^0-9.]/g, '')) : NaN;
          const payNum = data.payment ? parseFloat(String(data.payment).replace(/[^0-9.]/g, '')) : NaN;
          setFormData({
            date: data.date || "",
            salesInvoiceNumber: data.salesInvoiceNumber || "",
            bsNumber: data.bsNumber || "",
            quoteNumber: data.quoteNumber || "",
            description: data.description || "",
            address: data.address || "",
            amount: !isNaN(amtNum) ? formatAmountDisplay(amtNum) : "",
            payment: !isNaN(payNum) ? formatAmountDisplay(payNum) : (data.payment || ""),
            checkInfo: data.checkInfo === 'Check' || data.checkInfo === 'Cash' ? data.checkInfo : "",
            checkNumber: data.checkNumber || "",
            paymentDate: data.paymentDate || "",
            status: data.status === 'Paid' || data.status === 'Not Paid' ? data.status : (data.payment && String(data.payment).trim() ? 'Paid' : 'Not Paid'),
          });
        }
      } catch (e) {
        console.error("Error loading billing:", e);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((p) => {
      const next = { ...p, [name]: value };
      if (name === 'status' && value === 'Not Paid') {
        next.payment = '';
        next.checkInfo = '';
        next.checkNumber = '';
        next.paymentDate = '';
      }
      if (name === 'checkInfo' && value !== 'Check') {
        next.checkNumber = '';
      }
      return next;
    });
  };

  const checkSalesInvoiceExists = async (value: string, excludeId?: string): Promise<boolean> => {
    if (!value?.trim()) return false;
    const entries = await billingAPI.getAll();
    const normalized = String(value).trim().toLowerCase();
    return (entries || []).some((e: any) => {
      if (excludeId && e.id === excludeId) return false;
      return String(e.salesInvoiceNumber || e.sales_invoice_number || '').trim().toLowerCase() === normalized;
    });
  };

  const handleSalesInvoiceBlur = async () => {
    const val = formData.salesInvoiceNumber?.trim();
    if (!val) {
      setSalesInvoiceError("");
      return;
    }
    const exists = await checkSalesInvoiceExists(val, id);
    setSalesInvoiceError(exists ? "Sales Invoice # already exists" : "");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'amount' && value) {
      const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) setFormData((p) => ({ ...p, amount: formatAmountDisplay(num) }));
      return;
    }
    if (name === 'payment' && value) {
      const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) setFormData((p) => ({ ...p, payment: formatAmountDisplay(num) }));
      else {
        const capitalized = capitalizeSentence(value);
        if (capitalized !== value) setFormData((p) => ({ ...p, payment: capitalized }));
      }
      return;
    }
    const fieldsToCapitalize = ['description', 'address'];
    if (fieldsToCapitalize.includes(name) && value) {
      const capitalized = capitalizeSentence(value);
      if (capitalized !== value) setFormData((p) => ({ ...p, [name]: capitalized }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.status === 'Paid' && formData.checkInfo === 'Check' && !formData.checkNumber?.trim()) {
      alert("Check # is required when Type of Payment is Check.");
      return;
    }
    if (formData.salesInvoiceNumber?.trim()) {
      const exists = await checkSalesInvoiceExists(formData.salesInvoiceNumber, id);
      if (exists) {
        alert("Sales Invoice # already exists. Please use a different number.");
        return;
      }
    }
    setLoading(true);
    try {
      const currentUser = await getCurrentUserDisplayName();
      const dataToSave = formData.status === 'Not Paid'
        ? { ...formData, payment: '', checkInfo: '', checkNumber: '', paymentDate: '', lastEditedBy: currentUser }
        : { ...formData, lastEditedBy: currentUser };
      await billingAPI.update(id, dataToSave);
      router.push("/admin/billing");
    } catch (error) {
      console.error("Error updating billing:", error);
      alert("Failed to update billing entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this billing entry? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await billingAPI.delete(id);
      router.push("/admin/billing");
    } catch (e) {
      console.error("Error deleting billing:", e);
      alert("Failed to delete billing entry. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600">Loading billing entry...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin/billing"
            className="rounded-md border-2 border-slate-400 p-2.5 text-slate-800 hover:border-slate-500 transition flex items-center justify-center bg-white shadow-sm"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Edit Billing Entry</h1>
            <p className="text-sm text-slate-600">Update billing record #{formData.salesInvoiceNumber}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900" />
              </div>
              <div>
                <label htmlFor="salesInvoiceNumber" className="block text-sm font-semibold text-gray-700 mb-2">Sales Invoice #</label>
                <input
                  type="text"
                  id="salesInvoiceNumber"
                  name="salesInvoiceNumber"
                  value={formData.salesInvoiceNumber}
                  onChange={(e) => { handleChange(e); setSalesInvoiceError(""); }}
                  onBlur={handleSalesInvoiceBlur}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 ${salesInvoiceError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'}`}
                />
                {salesInvoiceError && <p className="mt-1 text-sm text-red-600">{salesInvoiceError}</p>}
              </div>
              <div>
                <label htmlFor="bsNumber" className="block text-sm font-semibold text-gray-700 mb-2">Billing Statement #</label>
                <input type="text" id="bsNumber" name="bsNumber" value={formData.bsNumber} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900" />
              </div>
              <div>
                <label htmlFor="quoteNumber" className="block text-sm font-semibold text-gray-700 mb-2">Quotation # *</label>
                <input type="text" id="quoteNumber" name="quoteNumber" value={formData.quoteNumber} onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900" />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
              <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} onBlur={handleBlur} required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900" />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
              <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} onBlur={handleBlur} required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 bg-white">
                  <option value="Not Paid">Not Paid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                <input type="text" id="amount" name="amount" value={formData.amount} onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900" />
              </div>
            </div>

            {formData.status === 'Paid' && (
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-6 space-y-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Payment Details</h3>
                <div>
                  <label htmlFor="checkInfo" className="block text-sm font-semibold text-gray-700 mb-2">Type of Payment *</label>
                  <select id="checkInfo" name="checkInfo" value={formData.checkInfo} onChange={handleChange} required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 bg-white">
                    <option value="">Select...</option>
                    <option value="Check">Check</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                {formData.checkInfo === 'Check' && (
                  <div>
                    <label htmlFor="checkNumber" className="block text-sm font-semibold text-gray-700 mb-2">Check # *</label>
                    <input
                      type="text"
                      id="checkNumber"
                      name="checkNumber"
                      value={formData.checkNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g., 12345"
                      className="w-full px-4 py-3 border-2 border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 bg-white"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="payment" className="block text-sm font-semibold text-gray-700 mb-2">Payment *</label>
                  <input type="text" id="payment" name="payment" value={formData.payment} onChange={handleChange} onBlur={handleBlur} required
                    placeholder="e.g., 17,640.00 or pd cash"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900" />
                </div>
                <div>
                  <label htmlFor="paymentDate" className="block text-sm font-semibold text-gray-700 mb-2">Payment Date *</label>
                  <input type="date" id="paymentDate" name="paymentDate" value={formData.paymentDate} onChange={handleChange} required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900" />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || deleting}
                className="rounded-md border border-red-300 px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <div className="flex items-center gap-3">
                <Link href="/admin/billing" className="rounded-md border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
                  Cancel
                </Link>
                <button type="submit" disabled={loading || deleting}
                  className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
