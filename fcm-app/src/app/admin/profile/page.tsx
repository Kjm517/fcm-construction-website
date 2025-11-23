'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  username: string;
  full_name?: string;
  position?: string;
  contact_number?: string;
  email?: string;
  bio?: string;
  address?: string;
  employee_id?: string;
  department?: string;
  hire_date?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    email: '',
    address: '',
    oldPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('admin-user-id') 
        : null;

      if (!userId) {
        console.error('No user ID found');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/profile?userId=${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Failed to load profile';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setProfile(data);
      
      // Populate form with existing data
      setFormData({
        fullName: data.full_name || '',
        contactNumber: data.contact_number || '',
        email: data.email || '',
        address: data.address || '',
        oldPassword: '',
        newPassword: '',
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      const errorMessage = error?.message || 'Failed to load profile. Please try again.';
      alert(errorMessage);
      
      // If user not found or unauthorized, redirect to login
      if (errorMessage.includes('not found') || errorMessage.includes('unauthorized')) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const userId = typeof window !== 'undefined' 
        ? localStorage.getItem('admin-user-id') 
        : null;

      if (!userId) {
        throw new Error('No user ID found');
      }

      const updateData: any = {
        fullName: formData.fullName,
        contactNumber: formData.contactNumber,
        email: formData.email,
        address: formData.address,
      };
      
      // Only include password if both old and new passwords are provided
      if (formData.oldPassword.trim() && formData.newPassword.trim()) {
        updateData.oldPassword = formData.oldPassword;
        updateData.newPassword = formData.newPassword;
      } else if (formData.oldPassword.trim() || formData.newPassword.trim()) {
        // If only one is provided, show error
        alert('Please provide both old password and new password to change your password.');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updateData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to update profile');
      }

      const updatedData = await response.json();
      setProfile(updatedData);
      // Clear password fields after successful update
      setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '' }));
      alert('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || 'Failed to update profile. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="text-slate-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
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
            Back to Dashboard
          </Link>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              My Profile
            </h1>
            <p className="text-sm text-slate-600">
              Manage your profile information and account details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={profile?.username || ''}
                  disabled
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
              </div>

              {/* Employee ID (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={profile?.employee_id || ''}
                  disabled
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Employee ID cannot be changed</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Position (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={profile?.position || ''}
                  disabled
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Position cannot be changed</p>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-900 placeholder:text-slate-400"
                  placeholder="e.g., 09123456789"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-900 placeholder:text-slate-400"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Old Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter current password to change"
                />
                <p className="text-xs text-slate-500 mt-1">Required if changing password</p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter new password"
                />
                <p className="text-xs text-slate-500 mt-1">Leave both password fields blank to keep current password</p>
              </div>

            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none text-slate-900 placeholder:text-slate-400"
                placeholder="Enter your address"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link
                href="/admin"
                className="px-6 py-2.5 rounded-lg border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

