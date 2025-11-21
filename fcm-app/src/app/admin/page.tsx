'use client';

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Project = {
  id: number;
  name: string;
  client: string;
  address: string;
  deadline: string;
  progress: number;
};

type Reminder = {
  id: number;
  title: string;
  date: string;
  description: string;
};

type Request = {
  id: number;
  client: string;
  type: string;
  submitted: string;
};

const projects: Project[] = [
  {
    id: 1,
    name: "Sample Commercial Building",
    client: "Juan Dela Cruz",
    address: "Cebu City, Philippines",
    deadline: "December 31, 2025",
    progress: 65,
  },
  {
    id: 2,
    name: "Residential Renovation",
    client: "Maria Santos",
    address: "Mandaue City, Cebu",
    deadline: "September 15, 2025",
    progress: 40,
  },
  {
    id: 3,
    name: "Office Fit-out",
    client: "ABC Corporation",
    address: "IT Park, Cebu City",
    deadline: "August 1, 2025",
    progress: 80,
  },
];

const reminders: Reminder[] = [
  {
    id: 1,
    title: "Site inspection – Project #1",
    date: "Today, 10:00 AM",
    description: "Meet client on-site to review progress and punchlist.",
  },
  {
    id: 2,
    title: "Materials delivery follow-up",
    date: "Today, 2:00 PM",
    description: "Confirm steel delivery schedule with supplier.",
  },
];

const requests: Request[] = [
  {
    id: 101,
    client: "John Doe",
    type: "Residential Construction",
    submitted: "2 days ago",
  },
  {
    id: 102,
    client: "Cebu Retail Corp.",
    type: "Commercial Renovation",
    submitted: "5 days ago",
  },
];

type SortKey = "deadline" | "progress" | "client";

export default function AdminHomePage() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortKey>("deadline");

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin-auth");
    }
    router.push("/admin/login");
  };

  const sortedProjects = useMemo(() => {
    const p = [...projects];
    if (sortBy === "progress") {
      return p.sort((a, b) => b.progress - a.progress);
    }
    if (sortBy === "client") {
      return p.sort((a, b) => a.client.localeCompare(b.client));
    }
    return p.sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  }, [sortBy]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <header className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              You are signed in as <span className="font-semibold">admin</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Logout
            </button>
            <Link
              href="/"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              Back to Website
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-2">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 flex flex-col gap-3 sticky top-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-lg font-bold">
                  F
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    FCM Dashboard
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    Admin Panel
                  </p>
                </div>
              </div>
              <nav className="flex flex-col gap-1 text-sm">
                <span className="rounded-lg px-3 py-2 bg-emerald-50 text-emerald-700 font-medium">
                  Dashboard
                </span>
                <Link
                  href="/admin/projects"
                  className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Projects
                </Link>
              </nav>
            </div>
          </aside>

          <section className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200">
              <img
                src="/images/fcmbanner.png"
                alt="FCM banner"
                className="w-full h-48 md:h-56 object-cover"
              />
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-slate-900 flex-1">
                  Ongoing Projects
                </h2>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="border border-emerald-600 bg-emerald-600 text-white text-xs md:text-sm rounded-lg px-3 py-2 pr-7 appearance-none cursor-pointer"
                  >
                    <option value="deadline">Sort by: Deadline</option>
                    <option value="progress">Sort by: Progress Rate</option>
                    <option value="client">Sort by: Client Name</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white text-lg">
                    ▾
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {sortedProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/admin/projects/${project.id}`}
                    className="block rounded-xl border border-slate-200 p-4 hover:border-emerald-400 hover:shadow-md transition bg-slate-50"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-slate-900">
                          {project.name}
                        </h3>
                        <p className="text-xs md:text-sm text-slate-600 mt-1">
                          {project.client} · {project.address}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Deadline:{" "}
                          <span className="font-medium">
                            {project.deadline}
                          </span>
                        </p>
                      </div>
                      <div className="text-right min-w-[88px]">
                        <p className="text-xs text-slate-600">Progress</p>
                        <p className="text-sm font-semibold text-emerald-600">
                          {project.progress}%
                        </p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6">
              <h2 className="text-lg font-semibold text-slate-900 text-center">
                Today&apos;s Task Reminders
              </h2>
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-lg border border-slate-200 p-3 bg-slate-50"
                  >
                    <p className="text-xs text-emerald-700 font-semibold">
                      {reminder.date}
                    </p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {reminder.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {reminder.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6">
              <h2 className="text-xl font-semibold text-slate-900 text-center">
                Project Requests
              </h2>
              <p className="text-xs text-slate-500 text-center mt-1 mb-4">
                Check and validate within 7 days
              </p>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-lg border border-slate-200 p-3 bg-slate-50"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {request.client}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {request.type}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted {request.submitted}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

