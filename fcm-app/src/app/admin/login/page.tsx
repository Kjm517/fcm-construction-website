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
    <div className="bg-white shadow-lg rounded-2xl p-8">
      <div className="flex flex-col items-center gap-4 mb-6">
        <img
          src="/images/fcmlogo.png"
          alt="Logo"
          className="w-20 h-20 object-contain rounded-md"
        />
        <h1 className="text-2xl font-semibold">Admin Sign In</h1>
        <p className="text-sm text-slate-500">Sign in to manage the site</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="admin"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4" />
            <span>Remember me</span>
          </label>
          <a href="#" className="text-sky-600 hover:underline">
            Forgot?
          </a>
        </div>

        <div className="flex justify-center pt-2">
          <button
            type="submit"
            className="min-w-[160px] px-8 py-2 rounded-md bg-sky-600 text-white font-medium disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        <p>
          Demo: <strong>admin</strong> / <strong>password123</strong>
        </p>
      </div>
    </div>
  );
}
