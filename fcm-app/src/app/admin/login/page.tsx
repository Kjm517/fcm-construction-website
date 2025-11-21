"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      return setError("Please enter username and password");
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    if (username === "admin" && password === "123") {
      if (typeof window !== "undefined") {
        localStorage.setItem("admin-auth", "true");
      }
      router.push("/admin");
      return;
    }

    setError("Invalid username or password");
    setLoading(false);
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
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium">
                Forgot password?
              </a>
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

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-200 pt-6">
            <p>
              Demo credentials: <strong className="text-slate-700">admin</strong> / <strong className="text-slate-700">123</strong>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
