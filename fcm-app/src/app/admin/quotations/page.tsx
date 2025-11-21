'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const dummyQuotation: Quotation = {
  id: "dummy-1",
  quotationNumber: "300.42",
  date: "2025-11-17",
  validUntil: "2025-12-17",
  clientName: "Jollibee Car car branch",
  jobDescription: "Repairing back wall using hardiflex, wall angle and repainting",
  installationAddress: "Jollibee Car car",
  attention: "Sir Athan",
  totalDue: "Php 26,000.00",
  createdAt: Date.now() - 86400000,
  clientContact: "",
  terms: [
    "Customers will be billed after 30 days upon completion and turnover of work with 7 days warranty.",
    "Please email the signed price quote to the address above.",
    "Any additional work shall be created with a new quotation.",
    "If there is any request for a contract bond or any expenses that are out of the price quotation, FCM trading and services will not be included in this quotation.",
  ],
};

export default function AdminQuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      // Check if we came from an admin page and have history
      if (referrer && referrer.includes("/admin") && window.history.length > 1) {
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
    if (typeof window === "undefined") return;
    
    const stored = localStorage.getItem("quotations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = parsed.sort((a: Quotation, b: Quotation) => b.createdAt - a.createdAt);
          setQuotations(sorted);
        } else {
          localStorage.setItem("quotations", JSON.stringify([dummyQuotation]));
          setQuotations([dummyQuotation]);
        }
      } catch (e) {
        console.error("Error loading quotations:", e);
        localStorage.setItem("quotations", JSON.stringify([dummyQuotation]));
        setQuotations([dummyQuotation]);
      }
    } else {
      localStorage.setItem("quotations", JSON.stringify([dummyQuotation]));
      setQuotations([dummyQuotation]);
    }
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

        {quotations.length === 0 ? (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 mb-4">No quotations created yet.</p>
            <Link
              href="/admin/quotations/create"
              className="inline-block rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              Create Your First Quotation
            </Link>
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

