'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { billingAPI } from "@/lib/api";

type BillingEntry = {
  id: string;
  date: string;
  salesInvoiceNumber: string;
  bsNumber: string;
  quoteNumber: string;
  description: string;
  address: string;
  amount: string | number;
  payment: string;
  checkInfo: string;
  checkNumber: string;
  paymentDate: string;
  status?: string;
  updatedAt?: string | number;
  lastEditedBy?: string;
};

export default function ViewBillingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const [entry, setEntry] = useState<BillingEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString: string | number) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return String(dateString);
    }
  };

  const formatDateTime = (dateString: string | number) => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return String(dateString);
    }
  };

  const formatAmount = (val: string | number) => {
    if (val === '' || val == null) return '-';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return String(val);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isPaid = (e: BillingEntry) => e.status === 'Paid' || (e.payment || '').trim().length > 0;

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

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    async function load() {
      setLoading(true);
      try {
        const data = await billingAPI.getById(id);
        setEntry(data);
      } catch (e) {
        console.error("Error loading billing:", e);
        setEntry(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
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

  if (!entry) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Billing Entry Not Found</h3>
            <p className="text-slate-600 mb-6">The billing entry you're looking for doesn't exist or may have been deleted.</p>
            <Link href="/admin/billing" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition">
              Back to Billing
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Billing #{entry.salesInvoiceNumber}</h1>
              <p className="text-sm text-slate-600">View billing entry details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/billing/${entry.id}/edit`}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-emerald-50 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Billing Overview</h2>
                <p className="text-sm text-slate-600">Invoice #{entry.salesInvoiceNumber}</p>
              </div>
              {(entry.updatedAt || entry.lastEditedBy) && (
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Last edited: {entry.updatedAt ? formatDateTime(entry.updatedAt) : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500">
                    by {entry.lastEditedBy || 'Admin'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                <p className="text-slate-900 font-medium">{formatDate(entry.date)}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sales Invoice #</label>
                <p className="text-slate-900 font-medium">{entry.salesInvoiceNumber}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Billing Statement #</label>
                <p className="text-slate-900">{entry.bsNumber || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Quotation #</label>
                <p className="text-slate-900">{entry.quoteNumber || '-'}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
              <p className="text-slate-900">{entry.description || '-'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Address</label>
              <p className="text-slate-900">{entry.address || '-'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount</label>
              <p className="text-slate-900 font-semibold">{formatAmount(entry.amount)}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              {isPaid(entry) ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Not Paid</span>
              )}
            </div>

            {isPaid(entry) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment</label>
                  <p className="text-slate-900">{(() => { const p = entry.payment || ''; const n = parseFloat(String(p).replace(/[^0-9.]/g, '')); return p && !isNaN(n) ? formatAmount(n) : (p || '-'); })()}</p>
                </div>
                {entry.checkInfo === 'Check' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Check #</label>
                    <p className="text-slate-900">{entry.checkNumber || '-'}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Type of Payment</label>
                  <p className="text-slate-900">{entry.checkInfo === 'Check' || entry.checkInfo === 'Cash' ? entry.checkInfo : (entry.checkInfo || '-')}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Date</label>
                  <p className="text-slate-900">{formatDate(entry.paymentDate) || '-'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
