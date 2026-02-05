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
  status?: string;
  createdAt: number;
};

type SortOption = 
  | 'date-desc' 
  | 'date-asc' 
  | 'client-asc' 
  | 'client-desc' 
  | 'quotation-asc' 
  | 'quotation-desc' 
  | 'total-desc' 
  | 'total-asc';

export default function AdminQuotationsPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const pageOptions = [15, 20, 25, 30, 50] as const;
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedQuotations = filteredQuotations.slice(startIdx, startIdx + itemsPerPage);

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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string = 'Draft') => {
    const statusColors: { [key: string]: string } = {
      'Draft': 'bg-slate-100 text-slate-700',
      'For Review': 'bg-yellow-100 text-yellow-700',
      'Email Sent': 'bg-blue-100 text-blue-700',
      'Approved': 'bg-green-100 text-green-700',
      'Rejected': 'bg-red-100 text-red-700',
      'Work In Progress': 'bg-cyan-100 text-cyan-700',
      'Completed': 'bg-purple-100 text-purple-700',
      'For Billing': 'bg-orange-100 text-orange-700',
    };
    
    const colorClass = statusColors[status] || statusColors['Draft'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  useEffect(() => {
    async function loadQuotations() {
      setLoading(true);
      try {
        const data = await quotationsAPI.getAll();
        setQuotations(data);
        setFilteredQuotations(data);
      } catch (e) {
        console.error("Error loading quotations:", e);
        setQuotations([]);
        setFilteredQuotations([]);
      } finally {
        setLoading(false);
      }
    }
    loadQuotations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    let filtered = [...quotations];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((quotation) => {
        const quotationNum = quotation.quotationNumber?.toLowerCase() || '';
        const clientName = quotation.clientName?.toLowerCase() || '';
        const dateStr = formatDate(quotation.date).toLowerCase();
        
        return (
          quotationNum.includes(query) ||
          clientName.includes(query) ||
          dateStr.includes(query)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return b.createdAt - a.createdAt;
        case 'date-asc':
          return a.createdAt - b.createdAt;
        case 'client-asc':
          return (a.clientName || '').localeCompare(b.clientName || '');
        case 'client-desc':
          return (b.clientName || '').localeCompare(a.clientName || '');
        case 'quotation-asc':
          return (a.quotationNumber || '').localeCompare(b.quotationNumber || '');
        case 'quotation-desc':
          return (b.quotationNumber || '').localeCompare(a.quotationNumber || '');
        case 'total-desc': {
          const aTotal = parseFloat(a.totalDue?.replace(/[^0-9.]/g, '') || '0');
          const bTotal = parseFloat(b.totalDue?.replace(/[^0-9.]/g, '') || '0');
          return bTotal - aTotal;
        }
        case 'total-asc': {
          const aTotal = parseFloat(a.totalDue?.replace(/[^0-9.]/g, '') || '0');
          const bTotal = parseFloat(b.totalDue?.replace(/[^0-9.]/g, '') || '0');
          return aTotal - bTotal;
        }
        default:
          return b.createdAt - a.createdAt;
      }
    });

    setFilteredQuotations(filtered);
  }, [quotations, searchQuery, sortOption]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-[95%] xl:max-w-[98%] mx-auto px-4 py-6 lg:py-10">
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
          <>
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by quotation #, client name, or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="sort" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                  Sort by:
                </label>
                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPage" className="text-sm font-medium text-slate-600 whitespace-nowrap">Show</label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="block px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  >
                    {pageOptions.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <span className="text-sm text-slate-600">per page</span>
                </div>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="block px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="client-asc">Client Name (A-Z)</option>
                  <option value="client-desc">Client Name (Z-A)</option>
                  <option value="quotation-asc">Quotation # (Ascending)</option>
                  <option value="quotation-desc">Quotation # (Descending)</option>
                  <option value="total-desc">Total Due (Highest First)</option>
                  <option value="total-asc">Total Due (Lowest First)</option>
                </select>
              </div>
            </div>

            {filteredQuotations.length === 0 ? (
              <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-slate-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No quotations found
                </h3>
                <p className="text-slate-600">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Quotation #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Client Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                      Job Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Total Due
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {paginatedQuotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {quotation.quotationNumber}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-900">
                        <div className="max-w-[200px] truncate" title={quotation.clientName}>
                          {quotation.clientName}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        <div className="max-w-[300px] truncate" title={quotation.jobDescription}>
                          {quotation.jobDescription}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(quotation.date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(quotation.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {quotation.totalDue}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
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
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">
                      Showing {startIdx + 1}–{Math.min(startIdx + itemsPerPage, filteredQuotations.length)} of {filteredQuotations.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="rounded px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[2rem] rounded px-2 py-1.5 text-sm font-medium border ${
                            currentPage === p
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="rounded px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
          </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

