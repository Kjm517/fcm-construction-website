'use client';

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProjectSummary = {
  id: number;
  name: string;
  client: string;
  location: string;
  progress: number;
  deadline: string;
};

const projects: ProjectSummary[] = [
  {
    id: 1,
    name: "Sample Commercial Building",
    client: "Juan Dela Cruz",
    location: "Cebu City, Philippines",
    progress: 65,
    deadline: "Dec 31, 2025",
  },
  {
    id: 2,
    name: "Residential Renovation",
    client: "Maria Santos",
    location: "Mandaue City, Cebu",
    progress: 40,
    deadline: "Sep 15, 2025",
  },
  {
    id: 3,
    name: "Office Fit-out",
    client: "ABC Corporation",
    location: "IT Park, Cebu City",
    progress: 80,
    deadline: "Aug 01, 2025",
  },
];

export default function AdminProjectsPage() {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin-auth");
    }
    router.push("/admin/login");
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Projects
            </h1>
            <p className="text-sm text-slate-600">
              Select a project to view its detailed progress and information.
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
              href="/admin"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              Back to Admin Home
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/admin/projects/${project.id}`}
              className="group rounded-2xl bg-white shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition"
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {project.name}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {project.client}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {project.location}
                </p>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Deadline: <span className="font-medium">{project.deadline}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}


