'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { quotationsAPI } from "@/lib/api";

type Quotation = {
  id: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  clientName: string;
  jobDescription: string;
  clientContact?: string;
  installationAddress: string;
  attention: string;
  totalDue: string;
  terms?: string[];
  createdAt: number;
};

export default function AdminQuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      // Check if we came from a quotation detail/edit page (to avoid loops)
      if (referrer && referrer.includes("/admin/quotations/")) {
        // If we came from a detail page, go to admin dashboard to avoid loop
        router.push("/admin");
      } else if (referrer && referrer.includes("/admin") && window.history.length > 1) {
        // If we came from another admin page (not a detail page), go back
        router.back();
      } else {
        // If not from admin page or no history, go to admin dashboard
        router.push("/admin");
      }
    } else {
      router.push("/admin");
    }
  };

  useEffect(() => {
    async function loadQuotations() {
      setLoading(true);
      try {
        const data = await quotationsAPI.getAll();
        // Sort by most recent first
        const sorted = data.sort((a: Quotation, b: Quotation) => b.createdAt - a.createdAt);
        setQuotations(sorted);
      } catch (e) {
        console.error("Error loading quotations:", e);
        setQuotations([]);
      } finally {
        setLoading(false);
      }
    }
    loadQuotations();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-md border-2 border-slate-400 p-2.5 text-slate-800 hover:border-slate-500 transition flex items-center justify-center bg-white shadow-sm"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Quotations</h1>
              <p className="text-sm text-slate-600">View and manage all quotations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/quotations/create"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              Create Quotation
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600">Loading quotations...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 md:p-16 text-center">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-16 w-16 text-slate-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No quotations found
              </h3>
              <p className="text-slate-600 mb-6">
                Get started by creating your first quotation. You can add client details, job descriptions, and pricing information.
              </p>
              <Link
                href="/admin/quotations/create"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition shadow-sm hover:shadow-md"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Your First Quotation
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Quotation #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Client Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Job Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Total Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {quotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {quotation.quotationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {quotation.clientName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {quotation.jobDescription}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(quotation.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {quotation.totalDue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/quotations/${quotation.id}`}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/quotations/${quotation.id}/edit`}
                            className="text-slate-600 hover:text-slate-900 font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

