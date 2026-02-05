'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { billingAPI, quotationsAPI, transformQuotation } from "@/lib/api";

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
};

type QuotationForBilling = {
  id: string;
  quotationNumber: string;
  clientName: string;
  jobDescription: string;
  installationAddress: string;
  totalDue: string;
  status?: string;
};

type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'invoice-desc'
  | 'invoice-asc'
  | 'description-asc'
  | 'description-desc'
  | 'bs-asc'
  | 'bs-desc'
  | 'quote-asc'
  | 'quote-desc'
  | 'address-asc'
  | 'address-desc'
  | 'status-asc'
  | 'status-desc'
  | 'payment-type-asc'
  | 'payment-type-desc';

export default function AdminBillingPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<BillingEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<BillingEntry[]>([]);
  const [quotationsForBilling, setQuotationsForBilling] = useState<QuotationForBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('invoice-desc');

  const handleBack = () => {
    router.push("/admin");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (val: string | number) => {
    if (val === '' || val == null) return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return String(val);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseAmount = (val: string | number): number => {
    if (val === '' || val == null) return 0;
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const isPaid = (entry: BillingEntry) => entry.status === 'Paid' || (entry.payment || '').trim().length > 0;

  const getPaymentAmount = (entry: BillingEntry): number => {
    const payment = (entry.payment || '').trim();
    if (!payment) return 0;
    const num = parseFloat(payment.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) return num;
    return parseAmount(entry.amount);
  };

  const totalAmount = filteredEntries.reduce((sum, e) => sum + parseAmount(e.amount), 0);
  const totalPaid = filteredEntries.reduce((sum, e) => sum + (isPaid(e) ? getPaymentAmount(e) : 0), 0);
  const unpaidEntries = filteredEntries.filter((e) => !isPaid(e));
  const unpaidInvoice = unpaidEntries.reduce((sum, e) => sum + parseAmount(e.amount), 0);
  const unpaidInvoiceNet = unpaidInvoice * 0.98; // est. net after 2% tax when paid by check
  const paidEntries = filteredEntries.filter(isPaid);
  const balanceDue = paidEntries.reduce((sum, e) => sum + parseAmount(e.amount) - getPaymentAmount(e), 0);

  const handleSort = (option: SortOption) => {
    setSortOption(option);
  };

  const SortableTh = ({ label, sortAsc, sortDesc, align = 'left', className = '' }: { label: string; sortAsc: SortOption; sortDesc: SortOption; align?: 'left' | 'right'; className?: string }) => {
    const isActiveAsc = sortOption === sortAsc;
    const isActiveDesc = sortOption === sortDesc;
    const isActive = isActiveAsc || isActiveDesc;
    return (
      <th
        className={`px-3 py-2.5 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100/50 transition select-none ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
        onClick={() => handleSort(isActiveDesc ? sortAsc : sortDesc)}
        title={`Sort by ${label}`}
      >
        <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
          {label}
          <span className={`text-slate-400 ${isActive ? 'text-emerald-600' : ''}`}>
            {isActiveAsc ? '↑' : isActiveDesc ? '↓' : '↕'}
          </span>
        </span>
      </th>
    );
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [billingData, quotationsData] = await Promise.all([
          billingAPI.getAll(),
          quotationsAPI.getAll(),
        ]);
        setEntries(billingData || []);
        setFilteredEntries(billingData || []);
        const billedQuoteNumbers = new Set(
          (billingData || []).map((e: any) => String(e.quoteNumber || e.quote_number || '').trim().toLowerCase())
        );
        const normalized = (quotationsData || []).map((q: any) =>
          q.quotationNumber !== undefined ? q : transformQuotation(q)
        );
        const forBilling = normalized.filter(
          (q: any) =>
            (q.status || '').trim() === 'For Billing' &&
            !billedQuoteNumbers.has(String(q.quotationNumber || q.quotation_number || '').trim().toLowerCase())
        );
        setQuotationsForBilling(forBilling);
      } catch (e) {
        console.error("Error loading billing:", e);
        setEntries([]);
        setFilteredEntries([]);
        setQuotationsForBilling([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    let filtered = [...entries];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((e) => {
        const invoice = (e.salesInvoiceNumber || '').toLowerCase();
        const quote = (e.quoteNumber || '').toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const addr = (e.address || '').toLowerCase();
        const dateStr = formatDate(e.date).toLowerCase();
        return (
          invoice.includes(q) ||
          quote.includes(q) ||
          desc.includes(q) ||
          addr.includes(q) ||
          dateStr.includes(q)
        );
      });
    }
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return parseAmount(b.amount) - parseAmount(a.amount);
        case 'amount-asc':
          return parseAmount(a.amount) - parseAmount(b.amount);
        case 'invoice-desc':
          return (parseInt(String(b.salesInvoiceNumber).replace(/\D/g, ''), 10) || 0) - (parseInt(String(a.salesInvoiceNumber).replace(/\D/g, ''), 10) || 0);
        case 'invoice-asc':
          return (parseInt(String(a.salesInvoiceNumber).replace(/\D/g, ''), 10) || 0) - (parseInt(String(b.salesInvoiceNumber).replace(/\D/g, ''), 10) || 0);
        case 'description-asc':
          return (a.description || '').localeCompare(b.description || '', undefined, { sensitivity: 'base' });
        case 'description-desc':
          return (b.description || '').localeCompare(a.description || '', undefined, { sensitivity: 'base' });
        case 'bs-asc':
          return (a.bsNumber || '').localeCompare(b.bsNumber || '', undefined, { sensitivity: 'base' });
        case 'bs-desc':
          return (b.bsNumber || '').localeCompare(a.bsNumber || '', undefined, { sensitivity: 'base' });
        case 'quote-asc':
          return (a.quoteNumber || '').localeCompare(b.quoteNumber || '', undefined, { sensitivity: 'base' });
        case 'quote-desc':
          return (b.quoteNumber || '').localeCompare(a.quoteNumber || '', undefined, { sensitivity: 'base' });
        case 'address-asc':
          return (a.address || '').localeCompare(b.address || '', undefined, { sensitivity: 'base' });
        case 'address-desc':
          return (b.address || '').localeCompare(a.address || '', undefined, { sensitivity: 'base' });
        case 'status-asc':
          return (isPaid(a) ? 1 : 0) - (isPaid(b) ? 1 : 0);
        case 'status-desc':
          return (isPaid(b) ? 1 : 0) - (isPaid(a) ? 1 : 0);
        case 'payment-type-asc':
          return (a.checkInfo || '').localeCompare(b.checkInfo || '', undefined, { sensitivity: 'base' });
        case 'payment-type-desc':
          return (b.checkInfo || '').localeCompare(a.checkInfo || '', undefined, { sensitivity: 'base' });
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
    setFilteredEntries(filtered);
  }, [entries, searchQuery, sortOption]);

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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Billing</h1>
              <p className="text-sm text-slate-600">Manage invoices and payments</p>
            </div>
          </div>
          <Link
            href="/admin/billing/create"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
          >
            Add Billing Entry
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600">Loading billing...</p>
          </div>
        ) : (
          <>
            {quotationsForBilling.length > 0 && (
              <div className="mb-6 rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-orange-50 border-b border-slate-200">
                  <h2 className="text-sm font-semibold text-slate-800">Quotations Pending Billing</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Quotations with status &quot;For Billing&quot; that do not yet have billing. Create billing from the list below.
                  </p>
                </div>
                <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
                  {quotationsForBilling.map((q) => (
                    <div key={q.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900">#{q.quotationNumber}</span>
                          <span className="text-slate-600">—</span>
                          <span className="text-slate-700 truncate">{q.clientName}</span>
                          <span className="text-slate-500 text-sm truncate">{q.jobDescription}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {q.installationAddress}
                          <span className="mx-2">•</span>
                          <span className="font-medium text-slate-600">{formatAmount(q.totalDue)}</span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/billing/create?quotationId=${encodeURIComponent(q.id)}`}
                        className="shrink-0 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition"
                      >
                        Create Billing
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {entries.length === 0 ? (
              <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 md:p-16 text-center">
                <svg className="mx-auto h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5 5l6-6M3 12a9 9 0 1118 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No billing entries</h3>
                <p className="text-slate-600 mb-6">Add your first billing entry to track invoices and payments.</p>
                <Link
                  href="/admin/billing/create"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition"
                >
                  Add Billing Entry
                </Link>
              </div>
            ) : (
              <>
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by invoice #, quote #, description, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Click column headers to sort</span>
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
                <p className="text-slate-600">No matching entries found.</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-end gap-6 text-sm">
                  <div className="font-medium text-slate-700">
                    Total Amount: <span className="text-slate-900">{formatAmount(totalAmount)}</span>
                  </div>
                  <div className="font-medium text-green-700">
                    Total Paid: <span>{formatAmount(totalPaid)}</span>
                  </div>
                  <div className="font-medium text-amber-700">
                    Unpaid Invoice: <span>{formatAmount(unpaidInvoice)}</span>
                  </div>
                  <div className="font-semibold text-slate-900">
                    Balance Due: <span className={unpaidInvoiceNet > 0 ? 'text-amber-600' : 'text-green-600'}>₱{formatAmount(unpaidInvoiceNet)}</span>
                    {unpaidInvoiceNet > 0 && (
                      <span className="ml-1 font-normal text-slate-600">(or est. net if paid by check)</span>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-emerald-50 border-b border-slate-200">
                      <tr>
                        <SortableTh label="Date" sortAsc="date-asc" sortDesc="date-desc" />
                        <SortableTh label="Sales Invoice #" sortAsc="invoice-asc" sortDesc="invoice-desc" />
                        <SortableTh label="Billing Statement #" sortAsc="bs-asc" sortDesc="bs-desc" className="whitespace-nowrap min-w-[120px]" />
                        <SortableTh label="Quotation #" sortAsc="quote-asc" sortDesc="quote-desc" />
                        <SortableTh label="Description" sortAsc="description-asc" sortDesc="description-desc" className="min-w-[180px]" />
                        <SortableTh label="Address" sortAsc="address-asc" sortDesc="address-desc" />
                        <SortableTh label="Amount" sortAsc="amount-asc" sortDesc="amount-desc" align="right" />
                        <SortableTh label="Status" sortAsc="status-asc" sortDesc="status-desc" />
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Payment</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Check #</th>
                        <SortableTh label="Type of Payment" sortAsc="payment-type-asc" sortDesc="payment-type-desc" />
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Payment Date</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition">
                          <td className="px-3 py-3 text-sm text-slate-700 whitespace-nowrap">{formatDate(entry.date)}</td>
                          <td className="px-3 py-3 text-sm font-medium text-slate-900">{entry.salesInvoiceNumber}</td>
                          <td className="px-3 py-3 text-sm text-slate-600">{entry.bsNumber || '-'}</td>
                          <td className="px-3 py-3 text-sm text-slate-600">{entry.quoteNumber || '-'}</td>
                          <td className="px-3 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={entry.description}>{entry.description || '-'}</td>
                          <td className="px-3 py-3 text-sm text-slate-600 max-w-[120px] truncate" title={entry.address}>{entry.address || '-'}</td>
                          <td className="px-3 py-3 text-sm text-right font-medium text-slate-900">{formatAmount(entry.amount)}</td>
                          <td className="px-3 py-3 text-sm">
                            {isPaid(entry) ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Not Paid
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-slate-600">{isPaid(entry) ? ((() => { const p = entry.payment || ''; const n = parseFloat(String(p).replace(/[^0-9.]/g, '')); return p && !isNaN(n) ? formatAmount(n) : (p || '-'); })()) : '-'}</td>
                          <td className="px-3 py-3 text-sm text-slate-600">{isPaid(entry) && entry.checkInfo === 'Check' ? (entry.checkNumber || '-') : '-'}</td>
                          <td className="px-3 py-3 text-sm text-slate-600">{isPaid(entry) ? (entry.checkInfo === 'Check' || entry.checkInfo === 'Cash' ? entry.checkInfo : (entry.checkInfo || '-')) : '-'}</td>
                          <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{isPaid(entry) ? (formatDate(entry.paymentDate) || '-') : '-'}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-3">
                              <Link href={`/admin/billing/${entry.id}`} className="text-emerald-600 hover:text-emerald-700 font-medium">
                                View
                              </Link>
                              <Link href={`/admin/billing/${entry.id}/edit`} className="text-slate-600 hover:text-slate-900 font-medium">
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
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
