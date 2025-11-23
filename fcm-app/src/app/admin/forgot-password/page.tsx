'use client';

import React from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-8 md:p-10">
          <div className="flex flex-col items-center gap-4 mb-8">
            <img
              src="/images/fcmlogo.png"
              alt="FCM Logo"
              className="h-16 w-auto object-contain mb-2"
            />
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Forgot Password
              </h1>
              <p className="text-sm text-slate-600">Need help with your password?</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-blue-600 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Contact Administrator
              </h2>
              <p className="text-sm text-slate-700 mb-4">
                To reset your password, please contact your system administrator. They will be able to assist you with resetting your account password.
              </p>
              <p className="text-xs text-slate-600">
                For security reasons, password resets must be handled by an administrator.
              </p>
            </div>

            <div className="text-center pt-4">
              <Link
                href="/admin/login"
                className="inline-block text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

