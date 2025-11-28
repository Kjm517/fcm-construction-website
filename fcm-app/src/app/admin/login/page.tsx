"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInactiveToast, setShowInactiveToast] = useState(false);

  // Check for inactivity logout
  useEffect(() => {
    if (searchParams.get('inactive') === 'true') {
      setShowInactiveToast(true);
      // Remove the query parameter from URL
      router.replace('/admin/login', { scroll: false });
      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => {
        setShowInactiveToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Load remembered username on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rememberedUsername = localStorage.getItem('remembered-username');
      if (rememberedUsername) {
        setUsername(rememberedUsername);
        setRememberMe(true);
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      return setError("Please enter username and password");
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("admin-auth", "true");
          localStorage.setItem("admin-username", data.user.username);
          localStorage.setItem("admin-user-id", data.user.id);
          
          // Handle "Remember Me"
          if (rememberMe) {
            localStorage.setItem("remembered-username", username);
          } else {
            localStorage.removeItem("remembered-username");
          }
        }
        router.push("/admin");
        return;
      }

      setError(data.error || "Invalid username or password");
    } catch (err) {
      console.error('Login error:', err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
                FCM Trading & Services
              </h1>
              <p className="text-sm text-slate-600">Sign in to manage the site</p>
            </div>
          </div>

          {showInactiveToast && (
            <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>You have been logged out due to inactivity. Please sign in again.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="username"
              >
                Username *
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                htmlFor="password"
              >
                Password *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-gray-900 placeholder:text-gray-400"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Remember me</span>
              </label>
              <Link href="/admin/forgot-password" className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                className="min-w-[180px] px-8 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-8 md:p-10">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="text-sm text-slate-600">Loading...</p>
            </div>
          </div>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
