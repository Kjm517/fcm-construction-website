'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type QuoteRequest = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  project_type: string;
  project_location: string;
  estimated_budget: string | null;
  project_details: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type Reviewer = {
  id: string;
  full_name?: string;
  username: string;
};

export default function AdminInboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');

  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  useEffect(() => {
    if (requestId) {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        setSelectedRequest(request);
        if (request.reviewed_by) {
          loadReviewer(request.reviewed_by);
        }
      }
    }
  }, [requestId, requests]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/api/quote-requests' 
        : `/api/quote-requests?status=${statusFilter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
        
        // If there's a requestId in URL, select that request
        if (requestId) {
          const request = data.find((r: QuoteRequest) => r.id === requestId);
          if (request) {
            setSelectedRequest(request);
            if (request.reviewed_by) {
              loadReviewer(request.reviewed_by);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewer = async (userId: string) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setReviewer({
          id: data.id,
          full_name: data.full_name,
          username: data.username,
        });
      }
    } catch (error) {
      console.error('Error loading reviewer:', error);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      setUpdating(true);
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('admin-user-id') 
        : null;

      const response = await fetch(`/api/quote-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await loadRequests();
        if (selectedRequest?.id === requestId) {
          const updated = await fetch(`/api/quote-requests/${requestId}`).then(r => r.json());
          setSelectedRequest(updated);
          if (updated.reviewed_by) {
            loadReviewer(updated.reviewed_by);
          }
        }
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleBack = () => {
    router.push("/admin");
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this quote request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/quote-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadRequests();
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(null);
          router.push('/admin/inbox');
        }
      } else {
        alert('Failed to delete request');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  };

  const formatBudget = (budget: string | null): string => {
    if (!budget) return 'Not specified';
    
    switch (budget) {
      case '<500k':
        return 'Less than ₱500,000';
      case '500k-1m':
        return '₱500,000 - ₱1,000,000';
      case '1m-3m':
        return '₱1,000,000 - ₱3,000,000';
      case '3m-5m':
        return '₱3,000,000 - ₱5,000,000';
      case '>5m':
        return 'More than ₱5,000,000';
      default:
        return budget;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'reviewed':
        return 'Reviewed';
      case 'converted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Quote Requests Inbox
              </h1>
              <p className="text-slate-600 mt-1">
                Manage and review quote requests from clients
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Requests</h2>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="converted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-sm text-slate-500 mt-2">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">No requests found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => {
                        setSelectedRequest(request);
                        router.push(`/admin/inbox?requestId=${request.id}`);
                        if (request.reviewed_by) {
                          loadReviewer(request.reviewed_by);
                        }
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        selectedRequest?.id === request.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {request.full_name}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {request.project_type}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatTimeAgo(request.created_at)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Quote Request Details
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Submitted {formatTimeAgo(selectedRequest.created_at)}
                    </p>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusLabel(selectedRequest.status)}
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Full Name
                      </label>
                      <p className="text-sm text-slate-900 mt-1">{selectedRequest.full_name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Email Address
                      </label>
                      <p className="text-sm text-slate-900 mt-1">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Phone Number
                      </label>
                      <p className="text-sm text-slate-900 mt-1">{selectedRequest.phone_number}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Project Type
                      </label>
                      <p className="text-sm text-slate-900 mt-1">{selectedRequest.project_type}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Project Location
                      </label>
                      <p className="text-sm text-slate-900 mt-1">{selectedRequest.project_location}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Estimated Budget
                      </label>
                      <p className="text-sm text-slate-900 mt-1">
                        {formatBudget(selectedRequest.estimated_budget)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Project Details
                    </label>
                    <p className="text-sm text-slate-900 mt-2 whitespace-pre-wrap">
                      {selectedRequest.project_details}
                    </p>
                  </div>

                  {selectedRequest.reviewed_by && reviewer && (
                    <div className="pt-4 border-t border-slate-200">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Reviewed By
                      </label>
                      <p className="text-sm text-slate-900 mt-1">
                        {reviewer.full_name || reviewer.username}
                      </p>
                      {selectedRequest.reviewed_at && (
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(selectedRequest.reviewed_at)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => handleStatusChange(selectedRequest.id, 'reviewed')}
                      disabled={updating || selectedRequest.status === 'reviewed'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedRequest.id, 'converted')}
                      disabled={updating || selectedRequest.status === 'converted'}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedRequest.id, 'rejected')}
                      disabled={updating || selectedRequest.status === 'rejected'}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDelete(selectedRequest.id)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
                <svg
                  className="mx-auto h-16 w-16 text-slate-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Request Selected
                </h3>
                <p className="text-slate-600">
                  Select a quote request from the list to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

